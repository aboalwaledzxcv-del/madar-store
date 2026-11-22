import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, getStoredToken, setStoredToken } from '../api';
import type { Address, CartItem, Lang, PageView, Product, User } from '../types';

const CART_KEY = 'madar_guest_cart';
const LANG_KEY = 'madar_lang';

interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'err';
}

interface StoreContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  page: PageView;
  navigate: (p: PageView, productId?: number) => void;
  selectedProductId: number | null;
  user: User | null;
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addToCart: (p: Product, variantLabel?: string, qty?: number, openDrawer?: boolean) => void;
  updateCartQty: (productId: number, variantLabel: string, qty: number) => void;
  removeFromCart: (productId: number, variantLabel: string) => void;
  clearCart: () => void;
  wishlistIds: number[];
  toggleWishlist: (productId: number) => Promise<void>;
  addresses: Address[];
  refreshAddresses: () => Promise<void>;
  toast: (text: string, tone?: 'ok' | 'err') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  dealsOnly: boolean;
  setDealsOnly: (v: boolean) => void;
  primeOnly: boolean;
  setPrimeOnly: (v: boolean) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ar'));
  const [page, setPage] = useState<PageView>('home');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dealsOnly, setDealsOnly] = useState(false);
  const [primeOnly, setPrimeOnly] = useState(false);

  const toast = useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const loadUserExtras = useCallback(async () => {
    try {
      const [wishRes, addrRes, cartRes] = await Promise.all([
        api<{ products: Product[] }>('/api/wishlist'),
        api<{ addresses: Address[] }>('/api/addresses'),
        api<{ items: CartItem[] }>('/api/cart'),
      ]);
      setWishlistIds(wishRes.products.map((p) => p.id));
      setAddresses(addrRes.addresses);
      setCart((guest) => {
        if (cartRes.items.length === 0 && guest.length > 0) {
          void api('/api/cart', {
            method: 'PUT',
            body: JSON.stringify({ items: guest.map((g) => ({ productId: g.productId, variantLabel: g.variantLabel, qty: g.qty })) }),
          });
          return guest;
        }
        if (guest.length === 0) return cartRes.items;
        // Merge guest cart with server cart
        const map = new Map<string, CartItem>();
        for (const it of cartRes.items) map.set(`${it.productId}:${it.variantLabel}`, it);
        for (const it of guest) {
          const k = `${it.productId}:${it.variantLabel}`;
          const ex = map.get(k);
          map.set(k, ex ? { ...ex, qty: ex.qty + it.qty } : it);
        }
        const merged = Array.from(map.values());
        void api('/api/cart', {
          method: 'PUT',
          body: JSON.stringify({ items: merged.map((g) => ({ productId: g.productId, variantLabel: g.variantLabel, qty: g.qty })) }),
        });
        return merged;
      });
    } catch {
      // ignore on expired token
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api<{ user: User }>('/api/auth/me')
      .then((res) => {
        setUser(res.user);
        void loadUserExtras();
      })
      .catch(() => setStoredToken(null));
  }, [loadUserExtras]);

  // Persist cart to localStorage and sync to server when signed in
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    if (user) {
      void api('/api/cart', {
        method: 'PUT',
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c.productId, variantLabel: c.variantLabel, qty: c.qty })),
        }),
      }).catch(() => {});
    }
  }, [cart, user]);

  const navigate = useCallback((p: PageView, productId?: number) => {
    if (productId !== undefined) setSelectedProductId(productId);
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(res.token);
      setUser(res.user);
      setAuthOpen(false);
      await loadUserExtras();
      toast(lang === 'ar' ? `مرحباً بك يا ${res.user.name}` : `Welcome back, ${res.user.name}`);
    },
    [lang, loadUserExtras, toast]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setStoredToken(res.token);
      setUser(res.user);
      setAuthOpen(false);
      await loadUserExtras();
      toast(lang === 'ar' ? 'تم إنشاء حسابك بنجاح' : 'Account created successfully');
    },
    [lang, loadUserExtras, toast]
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setWishlistIds([]);
    setAddresses([]);
    if (page === 'admin' || page === 'orders' || page === 'account') setPage('home');
    toast(lang === 'ar' ? 'تم تسجيل الخروج' : 'Signed out');
  }, [lang, page, toast]);

  const addToCart = useCallback(
    (p: Product, variantLabel?: string, qty = 1, openDrawer = true) => {
      const chosen = variantLabel ?? p.variants[0]?.label ?? '';
      const variant = p.variants.find((v) => v.label === chosen);
      const unitPrice = Number(Math.max(1, p.price + (variant?.priceDelta || 0)).toFixed(2));
      setCart((prev) => {
        const idx = prev.findIndex((x) => x.productId === p.id && x.variantLabel === chosen);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: Math.min(p.stock, next[idx].qty + qty) };
          return next;
        }
        return [
          ...prev,
          {
            productId: p.id,
            variantLabel: chosen,
            qty: Math.min(p.stock, qty),
            titleEn: p.titleEn,
            titleAr: p.titleAr,
            brand: p.brand,
            unitPrice,
            image: p.image,
            isPrime: p.isPrime,
            stock: p.stock,
          },
        ];
      });
      if (openDrawer) setCartOpen(true);
      toast(lang === 'ar' ? 'تمت الإضافة إلى سلة التسوق' : 'Added to Cart');
    },
    [lang, toast]
  );

  const updateCartQty = useCallback((productId: number, variantLabel: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((x) => !(x.productId === productId && x.variantLabel === variantLabel)));
      return;
    }
    setCart((prev) =>
      prev.map((x) => (x.productId === productId && x.variantLabel === variantLabel ? { ...x, qty } : x))
    );
  }, []);

  const removeFromCart = useCallback((productId: number, variantLabel: string) => {
    setCart((prev) => prev.filter((x) => !(x.productId === productId && x.variantLabel === variantLabel)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (!user) {
        setAuthOpen(true);
        toast(lang === 'ar' ? 'سجل الدخول لحفظ المنتجات في المفضلة' : 'Sign in to save items to your wishlist', 'err');
        return;
      }
      const res = await api<{ saved: boolean; wishlistIds: number[] }>(`/api/wishlist/${productId}`, { method: 'POST' });
      setWishlistIds(res.wishlistIds);
      toast(
        res.saved
          ? lang === 'ar' ? 'تمت الإضافة للمفضلة' : 'Saved to Wishlist'
          : lang === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from Wishlist'
      );
    },
    [lang, toast, user]
  );

  const refreshAddresses = useCallback(async () => {
    if (!user) return;
    const res = await api<{ addresses: Address[] }>('/api/addresses');
    setAddresses(res.addresses);
  }, [user]);

  const value = useMemo<StoreContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      page,
      navigate,
      selectedProductId,
      user,
      authOpen,
      setAuthOpen,
      login,
      register,
      logout,
      cart,
      cartOpen,
      setCartOpen,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      wishlistIds,
      toggleWishlist,
      addresses,
      refreshAddresses,
      toast,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      dealsOnly,
      setDealsOnly,
      primeOnly,
      setPrimeOnly,
    }),
    [
      lang, setLang, toggleLang, page, navigate, selectedProductId, user, authOpen,
      login, register, logout, cart, cartOpen, addToCart, updateCartQty,
      removeFromCart, clearCart, wishlistIds, toggleWishlist, addresses, refreshAddresses,
      toast, searchQuery, selectedCategory, dealsOnly, primeOnly,
    ]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.text}
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}
