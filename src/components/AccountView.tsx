import { useEffect, useState } from 'react';
import { Heart, MapPin, Plus, ShoppingCart, Trash2, User as UserIcon } from 'lucide-react';
import { api } from '../api';
import { useStore } from '../context/StoreContext';
import { formatMoney, tr } from '../i18n';
import type { Product } from '../types';
import Stars from './Stars';

export default function AccountView({ initialTab = 'addresses' }: { initialTab?: 'addresses' | 'wishlist' }) {
  const {
    lang, user, setAuthOpen, addresses, refreshAddresses, addToCart, toggleWishlist, navigate, toast,
  } = useStore();

  const [tab, setTab] = useState<'addresses' | 'wishlist'>(initialTab);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [form, setForm] = useState({ label: '', fullName: '', phone: '', city: '', street: '', postalCode: '11183' });

  useEffect(() => setTab(initialTab), [initialTab]);

  useEffect(() => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    api<{ products: Product[] }>('/api/wishlist').then((r) => setWishlist(r.products));
  }, [user, setAuthOpen]);

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/addresses', { method: 'POST', body: JSON.stringify(form) });
      await refreshAddresses();
      setForm({ label: '', fullName: '', phone: '', city: '', street: '', postalCode: '11183' });
      toast(lang === 'ar' ? 'تمت إضافة العنوان' : 'Address added');
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  };

  const setDefault = async (id: number) => {
    await api(`/api/addresses/${id}/default`, { method: 'PATCH' });
    await refreshAddresses();
  };

  const removeAddr = async (id: number) => {
    await api(`/api/addresses/${id}`, { method: 'DELETE' });
    await refreshAddresses();
  };

  if (!user) return null;

  return (
    <div className="page-wrap">
      <div className="account-banner">
        <div className="account-identity">
          <div className="avatar lg">
            <UserIcon size={24} />
          </div>
          <div>
            <h1>{user.name}</h1>
            <p>{user.email} · {user.isPrime ? 'MADAR Prime' : 'Standard'}</p>
          </div>
        </div>
        <div className="account-tabs">
          <button type="button" className={tab === 'addresses' ? 'is-active' : ''} onClick={() => setTab('addresses')}>
            <MapPin size={15} /> {tr(lang, 'myAccount')}
          </button>
          <button type="button" className={tab === 'wishlist' ? 'is-active' : ''} onClick={() => setTab('wishlist')}>
            <Heart size={15} /> {tr(lang, 'wishlist')} ({wishlist.length})
          </button>
        </div>
      </div>

      {tab === 'addresses' ? (
        <div className="addresses-layout">
          <div className="address-cards">
            {addresses.map((a) => (
              <div key={a.id} className={`addr-card${a.isDefault ? ' is-default' : ''}`}>
                <div className="addr-card-head">
                  <strong>{a.label}</strong>
                  {Boolean(a.isDefault) && <span className="mini-tag">Default</span>}
                </div>
                <p><strong>{a.fullName}</strong></p>
                <p>{a.street}</p>
                <p>{a.city} · {a.postalCode}</p>
                <p>{a.phone}</p>
                <div className="addr-card-actions">
                  {!a.isDefault && (
                    <button type="button" className="link-btn" onClick={() => void setDefault(a.id)}>
                      {lang === 'ar' ? 'تعيين كافتراضي' : 'Set as default'}
                    </button>
                  )}
                  <button type="button" className="trash-icon" onClick={() => void removeAddr(a.id)} aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form className="addr-create-card" onSubmit={addAddress}>
            <h3><Plus size={17} /> {tr(lang, 'addNewAddress')}</h3>
            <input placeholder={tr(lang, 'addrLabel')} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            <input placeholder={tr(lang, 'fullName')} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            <input placeholder={tr(lang, 'phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <input placeholder={tr(lang, 'city')} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <input placeholder={tr(lang, 'street')} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
            <input placeholder={tr(lang, 'postalCode')} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
            <button type="submit" className="btn-amz-primary full">{tr(lang, 'saveAddress')}</button>
          </form>
        </div>
      ) : (
        <div className="product-grid">
          {wishlist.length === 0 ? (
            <div className="empty-state">
              <p>{lang === 'ar' ? 'قائمة المفضلة فارغة.' : 'Your wishlist is empty.'}</p>
              <button type="button" className="btn-amz-primary" onClick={() => navigate('home')}>
                {tr(lang, 'backToResults')}
              </button>
            </div>
          ) : (
            wishlist.map((p) => (
              <article key={p.id} className="product-card">
                <div className="card-media">
                  <button type="button" className="card-img-btn" onClick={() => navigate('product', p.id)}>
                    <img src={p.image} alt={lang === 'ar' ? p.titleAr : p.titleEn} />
                  </button>
                </div>
                <div className="card-body">
                  <button type="button" className="card-title" onClick={() => navigate('product', p.id)}>
                    {lang === 'ar' ? p.titleAr : p.titleEn}
                  </button>
                  <Stars rating={p.ratingAvg} count={p.reviewCount} />
                  <div className="card-price-row">
                    <span className="price-main">{formatMoney(p.price)}</span>
                  </div>
                </div>
                <div className="card-actions row">
                  <button type="button" className="btn-amz-primary full" onClick={() => addToCart(p)}>
                    <ShoppingCart size={15} /> {tr(lang, 'addToCart')}
                  </button>
                  <button
                    type="button"
                    className="btn-amz-ghost"
                    onClick={async () => {
                      await toggleWishlist(p.id);
                      setWishlist((prev) => prev.filter((x) => x.id !== p.id));
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
