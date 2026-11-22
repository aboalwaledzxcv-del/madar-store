import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown, Globe, Heart, MapPin, Menu, Package, Search, ShoppingCart, ShieldCheck, Store, User as UserIcon, X,
} from 'lucide-react';
import { api } from '../api';
import { useStore } from '../context/StoreContext';
import { CATEGORIES, formatMoney, tr } from '../i18n';

interface Suggestion {
  id: number;
  titleEn: string;
  titleAr: string;
  category: string;
  brand: string;
  price: number;
  image: string;
}

export default function Header() {
  const {
    lang, toggleLang, navigate, user, setAuthOpen, logout, cart, setCartOpen,
    wishlistIds, addresses, searchQuery, setSearchQuery, selectedCategory,
    setSelectedCategory, dealsOnly, setDealsOnly, primeOnly, setPrimeOnly,
  } = useStore();

  const [draft, setDraft] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [acctMenuOpen, setAcctMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(searchQuery), [searchQuery]);

  useEffect(() => {
    const q = draft.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      api<{ suggestions: Suggestion[] }>(`/api/products/suggest?q=${encodeURIComponent(q)}`)
        .then((r) => setSuggestions(r.suggestions))
        .catch(() => {});
    }, 150);
    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const cartCount = cart.reduce((sum, x) => sum + x.qty, 0);
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(draft.trim());
    setSuggestOpen(false);
    navigate('home');
  };

  const pickDepartment = (cat: string) => {
    setSelectedCategory(cat);
    setDealsOnly(false);
    setPrimeOnly(false);
    setDrawerOpen(false);
    navigate('home');
  };

  return (
    <header className="amz-header">
      <div className="amz-nav-main">
        {/* Brand Wordmark */}
        <button
          id="nav-logo"
          type="button"
          className="nav-brand nav-tile"
          onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setDealsOnly(false);
            setPrimeOnly(false);
            navigate('home');
          }}
        >
          <span className="brand-wordmark">
            MADAR<span className="brand-dot">.</span>
          </span>
          <span className="brand-smile" aria-hidden="true" />
        </button>

        {/* Deliver To */}
        <button
          id="nav-address"
          type="button"
          className="nav-deliver nav-tile hide-sm"
          onClick={() => (user ? navigate('account') : setAuthOpen(true))}
        >
          <MapPin size={17} />
          <span className="nav-stack">
            <span className="nav-tiny">{tr(lang, 'deliverTo')}</span>
            <strong className="nav-strong">
              {defaultAddr ? defaultAddr.city : tr(lang, 'chooseLocation')}
            </strong>
          </span>
        </button>

        {/* Amazon-style Search Bar with Category Prefix & Autocomplete */}
        <div className="nav-search-wrap" ref={searchWrapRef}>
          <form className="nav-search" onSubmit={submitSearch}>
            <select
              id="search-dept"
              aria-label={tr(lang, 'department')}
              className="search-dept"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                navigate('home');
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'ar' ? c.ar : c.en}
                </option>
              ))}
            </select>
            <input
              id="search-input"
              type="search"
              className="search-input"
              value={draft}
              placeholder={tr(lang, 'searchPlaceholder')}
              onFocus={() => setSuggestOpen(true)}
              onChange={(e) => {
                setDraft(e.target.value);
                setSuggestOpen(true);
                if (!e.target.value) setSearchQuery('');
              }}
            />
            <button id="search-submit" type="submit" className="search-btn" aria-label="Search">
              <Search size={20} />
            </button>
          </form>

          {suggestOpen && suggestions.length > 0 && (
            <div className="search-dropdown" role="listbox">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="suggest-item"
                  onClick={() => {
                    setSuggestOpen(false);
                    navigate('product', s.id);
                  }}
                >
                  <img src={s.image} alt="" />
                  <div className="suggest-info">
                    <span className="suggest-title">{lang === 'ar' ? s.titleAr : s.titleEn}</span>
                    <span className="suggest-meta">{s.brand}</span>
                  </div>
                  <strong className="suggest-price">{formatMoney(s.price)}</strong>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language Toggle (AR / EN) */}
        <button id="btn-lang" type="button" className="nav-lang nav-tile" onClick={toggleLang} title="Switch Language">
          <Globe size={16} />
          <strong>{lang === 'ar' ? 'EN' : 'عربي'}</strong>
        </button>

        {/* Account & Lists Dropdown */}
        <div
          className="nav-account-wrap"
          onMouseEnter={() => setAcctMenuOpen(true)}
          onMouseLeave={() => setAcctMenuOpen(false)}
        >
          <button
            id="nav-account"
            type="button"
            className="nav-tile nav-stack"
            onClick={() => (user ? setAcctMenuOpen(true) : setAuthOpen(true))}
          >
            <span className="nav-tiny">
              {user ? `${tr(lang, 'helloUser')} ${user.name.split(' ')[0]}` : tr(lang, 'helloSignIn')}
            </span>
            <span className="nav-strong-row">
              <strong>{tr(lang, 'accountLists')}</strong>
              <ChevronDown size={13} />
            </span>
          </button>

          {acctMenuOpen && (
            <div className="account-popover">
              {!user ? (
                <div className="acct-guest">
                  <button
                    type="button"
                    className="btn-amz-primary full"
                    onClick={() => {
                      setAcctMenuOpen(false);
                      setAuthOpen(true);
                    }}
                  >
                    {tr(lang, 'signIn')}
                  </button>
                </div>
              ) : (
                <div className="acct-links">
                  <div className="acct-head">
                    <UserIcon size={16} />
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setAcctMenuOpen(false); navigate('account'); }}>
                    <MapPin size={15} /> {tr(lang, 'myAccount')}
                  </button>
                  <button type="button" onClick={() => { setAcctMenuOpen(false); navigate('orders'); }}>
                    <Package size={15} /> {tr(lang, 'ordersTitle')}
                  </button>
                  <button type="button" onClick={() => { setAcctMenuOpen(false); navigate('wishlist'); }}>
                    <Heart size={15} /> {tr(lang, 'wishlist')} ({wishlistIds.length})
                  </button>
                  {user.role === 'admin' && (
                    <button
                      type="button"
                      className="acct-admin-link"
                      onClick={() => {
                        setAcctMenuOpen(false);
                        navigate('admin');
                      }}
                    >
                      <Store size={15} /> {tr(lang, 'sellerStudio')}
                    </button>
                  )}
                  <hr />
                  <button id="btn-sign-out" type="button" onClick={() => { setAcctMenuOpen(false); logout(); }}>
                    {tr(lang, 'signOut')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders Shortcut */}
        <button
          id="nav-orders"
          type="button"
          className="nav-tile nav-stack hide-sm"
          onClick={() => (user ? navigate('orders') : setAuthOpen(true))}
        >
          <span className="nav-tiny">{tr(lang, 'returnsOrders')}</span>
          <strong className="nav-strong">{tr(lang, 'andOrders')}</strong>
        </button>

        {/* Cart Button */}
        <button id="nav-cart" type="button" className="nav-tile nav-cart" onClick={() => setCartOpen(true)}>
          <span className="cart-icon-wrap">
            <ShoppingCart size={26} />
            <span className="cart-badge" id="cart-count">{cartCount}</span>
          </span>
          <strong className="hide-sm">{tr(lang, 'cart')}</strong>
        </button>
      </div>

      {/* Category Sub-Navigation */}
      <div className="amz-subnav">
        <button id="subnav-all" type="button" className="subnav-item subnav-all" onClick={() => setDrawerOpen(true)}>
          <Menu size={17} />
          <span>{tr(lang, 'allMenu')}</span>
        </button>

        <button
          id="subnav-deals"
          type="button"
          className={`subnav-item${dealsOnly ? ' is-active' : ''}`}
          onClick={() => {
            setDealsOnly(!dealsOnly);
            setSelectedCategory('all');
            navigate('home');
          }}
        >
          {tr(lang, 'todaysDeals')}
        </button>

        <button
          id="subnav-prime"
          type="button"
          className={`subnav-item${primeOnly ? ' is-active' : ''}`}
          onClick={() => {
            setPrimeOnly(!primeOnly);
            navigate('home');
          }}
        >
          {tr(lang, 'primeDelivery')}
        </button>

        {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
          <button
            key={c.id}
            type="button"
            className={`subnav-item hide-md${selectedCategory === c.id ? ' is-active' : ''}`}
            onClick={() => pickDepartment(c.id)}
          >
            {lang === 'ar' ? c.ar : c.en}
          </button>
        ))}

        <div className="subnav-spacer" />

        <button
          id="subnav-wishlist"
          type="button"
          className="subnav-item"
          onClick={() => (user ? navigate('wishlist') : setAuthOpen(true))}
        >
          <Heart size={14} />
          <span>{tr(lang, 'wishlist')} ({wishlistIds.length})</span>
        </button>

        {user?.role === 'admin' ? (
          <button id="subnav-admin" type="button" className="subnav-item subnav-seller" onClick={() => navigate('admin')}>
            <ShieldCheck size={15} />
            <span>{tr(lang, 'sellerStudio')}</span>
          </button>
        ) : (
          <button id="subnav-seller-demo" type="button" className="subnav-item subnav-seller" onClick={() => setAuthOpen(true)}>
            <Store size={14} />
            <span>{tr(lang, 'sellerStudio')}</span>
          </button>
        )}
      </div>

      {/* Department Slide-Out Drawer */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside className="dept-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="dept-drawer-head">
              <UserIcon size={20} />
              <strong>
                {user ? `${tr(lang, 'helloUser')} ${user.name}` : tr(lang, 'helloSignIn')}
              </strong>
              <button type="button" aria-label="Close" onClick={() => setDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dept-drawer-body">
              <h4>{tr(lang, 'department')}</h4>
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => pickDepartment(c.id)}>
                  {lang === 'ar' ? c.ar : c.en}
                </button>
              ))}
              <hr />
              <button type="button" onClick={() => { setDrawerOpen(false); user ? navigate('orders') : setAuthOpen(true); }}>
                {tr(lang, 'ordersTitle')}
              </button>
              <button type="button" onClick={() => { setDrawerOpen(false); user ? navigate('account') : setAuthOpen(true); }}>
                {tr(lang, 'myAccount')}
              </button>
              <button type="button" onClick={() => { setDrawerOpen(false); user?.role === 'admin' ? navigate('admin') : setAuthOpen(true); }}>
                {tr(lang, 'sellerStudio')}
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
