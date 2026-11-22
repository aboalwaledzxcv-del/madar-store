import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Lock, MapPin, Plus, Tag, Truck } from 'lucide-react';
import { api } from '../api';
import { useStore } from '../context/StoreContext';
import { formatMoney, tr } from '../i18n';
import type { Address, Order } from '../types';

export default function CheckoutView() {
  const { lang, user, setAuthOpen, cart, clearCart, addresses, refreshAddresses, navigate, toast } = useStore();

  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);
  const [addingAddr, setAddingAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    fullName: user?.name || '',
    phone: '',
    city: '',
    street: '',
    postalCode: '11183',
  });
  const [shippingSpeed, setShippingSpeed] = useState<'prime' | 'standard'>('prime');
  const [paymentMethod, setPaymentMethod] = useState('Visa •••• 4242');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const def = addresses.find((a) => a.isDefault) || addresses[0];
    if (def && !selectedAddrId) setSelectedAddrId(def.id);
    if (addresses.length === 0) setAddingAddr(true);
  }, [user, addresses, selectedAddrId, setAuthOpen]);

  const subtotal = Number(cart.reduce((s, i) => s + i.unitPrice * i.qty, 0).toFixed(2));
  const shippingCost = shippingSpeed === 'prime' ? (user?.isPrime ? 0 : 9.99) : subtotal >= 50 ? 0 : 5.99;
  const discount =
    (appliedPromo === 'PRIME10' || appliedPromo === 'MADAR10')
      ? Number((subtotal * 0.1).toFixed(2))
      : (appliedPromo === 'AMZ20' || appliedPromo === 'MADAR20')
      ? Number((subtotal * 0.2).toFixed(2))
      : 0;
  const tax = Number((Math.max(0, subtotal - discount) * 0.08).toFixed(2));
  const total = Number((Math.max(0, subtotal - discount) + shippingCost + tax).toFixed(2));

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api<{ address: Address }>('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({ ...newAddr, isDefault: true }),
      });
      await refreshAddresses();
      setSelectedAddrId(res.address.id);
      setAddingAddr(false);
      toast(lang === 'ar' ? 'تم حفظ العنوان' : 'Address saved');
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  };

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (code === 'PRIME10' || code === 'AMZ20' || code === 'MADAR10' || code === 'MADAR20') {
      setAppliedPromo(code);
      toast(lang === 'ar' ? `تم تفعيل كود الخصم ${code}` : `Promo ${code} applied`);
    } else {
      toast(lang === 'ar' ? 'كود غير صالح — جرب MADAR10 أو MADAR20' : 'Invalid code — try MADAR10 or MADAR20', 'err');
    }
  };

  const placeOrder = async () => {
    const addr = addresses.find((a) => a.id === selectedAddrId);
    if (!addr) {
      toast(lang === 'ar' ? 'يرجى اختيار أو إضافة عنوان توصيل' : 'Please select or add a delivery address', 'err');
      return;
    }
    setPlacing(true);
    try {
      const res = await api<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c.productId, variantLabel: c.variantLabel, qty: c.qty })),
          address: addr,
          paymentMethod,
          shippingSpeed,
          promoCode: appliedPromo,
        }),
      });
      clearCart();
      toast(
        lang === 'ar'
          ? `تم تأكيد الطلب ${res.order.orderNumber} بنجاح!`
          : `Order ${res.order.orderNumber} confirmed!`
      );
      navigate('orders');
    } catch (err) {
      toast((err as Error).message, 'err');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <h2>{tr(lang, 'cartEmpty')}</h2>
          <button type="button" className="btn-amz-primary" onClick={() => navigate('home')}>
            {tr(lang, 'backToResults')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <h1 className="page-heading">
        <Lock size={22} /> {tr(lang, 'checkoutTitle')}
      </h1>

      <div className="checkout-grid">
        <div className="checkout-steps">
          {/* Step 1: Address */}
          <section className="checkout-card">
            <div className="checkout-card-head">
              <h2>
                <MapPin size={18} /> {tr(lang, 'stepAddress')}
              </h2>
              <button type="button" className="link-btn" onClick={() => setAddingAddr((v) => !v)}>
                <Plus size={14} /> {tr(lang, 'addNewAddress')}
              </button>
            </div>

            {addresses.length > 0 && (
              <div className="address-options">
                {addresses.map((a) => (
                  <label key={a.id} className={`address-option${selectedAddrId === a.id ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="addr"
                      checked={selectedAddrId === a.id}
                      onChange={() => setSelectedAddrId(a.id)}
                    />
                    <div>
                      <strong>{a.label} — {a.fullName}</strong>
                      <p>{a.street}, {a.city} ({a.postalCode}) · {a.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {addingAddr && (
              <form className="inline-addr-form" onSubmit={saveAddress}>
                <input
                  placeholder={tr(lang, 'addrLabel')}
                  value={newAddr.label}
                  onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                  required
                />
                <input
                  placeholder={tr(lang, 'fullName')}
                  value={newAddr.fullName}
                  onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                  required
                />
                <input
                  placeholder={tr(lang, 'phone')}
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  required
                />
                <input
                  placeholder={tr(lang, 'city')}
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  required
                />
                <input
                  placeholder={tr(lang, 'street')}
                  value={newAddr.street}
                  onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                  required
                />
                <input
                  placeholder={tr(lang, 'postalCode')}
                  value={newAddr.postalCode}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                />
                <button type="submit" className="btn-amz-primary">
                  {tr(lang, 'saveAddress')}
                </button>
              </form>
            )}
          </section>

          {/* Step 2: Delivery Speed & Payment */}
          <section className="checkout-card">
            <h2>
              <Truck size={18} /> {tr(lang, 'stepShipping')}
            </h2>

            <div className="radio-cards">
              <label className={`radio-card${shippingSpeed === 'prime' ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="ship"
                  checked={shippingSpeed === 'prime'}
                  onChange={() => setShippingSpeed('prime')}
                />
                <div>
                  <strong>{tr(lang, 'shippingPrime')}</strong>
                  <small>{user?.isPrime ? tr(lang, 'free') : '$9.99'}</small>
                </div>
              </label>

              <label className={`radio-card${shippingSpeed === 'standard' ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="ship"
                  checked={shippingSpeed === 'standard'}
                  onChange={() => setShippingSpeed('standard')}
                />
                <div>
                  <strong>{tr(lang, 'shippingStandard')}</strong>
                  <small>{subtotal >= 50 ? tr(lang, 'free') : '$5.99'}</small>
                </div>
              </label>
            </div>

            <h3>
              <CreditCard size={16} /> {tr(lang, 'paymentMethod')}
            </h3>
            <div className="radio-cards three">
              {['Visa •••• 4242', 'Apple Pay', 'Cash on Delivery'].map((pm) => (
                <label key={pm} className={`radio-card${paymentMethod === pm ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === pm}
                    onChange={() => setPaymentMethod(pm)}
                  />
                  <strong>{pm}</strong>
                </label>
              ))}
            </div>

            <div className="promo-row">
              <Tag size={16} />
              <input
                type="text"
                placeholder={tr(lang, 'promoCode')}
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
              />
              <button type="button" className="btn-amz-ghost" onClick={applyPromo}>
                {tr(lang, 'apply')}
              </button>
            </div>
          </section>

          {/* Step 3: Items Review */}
          <section className="checkout-card">
            <h2>
              <CheckCircle2 size={18} /> {tr(lang, 'stepSummary')}
            </h2>
            <div className="checkout-items">
              {cart.map((c) => (
                <div key={`${c.productId}:${c.variantLabel}`} className="checkout-item-row">
                  <img src={c.image} alt="" />
                  <div>
                    <strong>{lang === 'ar' ? c.titleAr : c.titleEn}</strong>
                    <small>
                      {c.variantLabel} · {tr(lang, 'qty')}: {c.qty}
                    </small>
                  </div>
                  <strong>{formatMoney(c.unitPrice * c.qty)}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky Order Summary Box */}
        <aside className="checkout-summary">
          <button
            id="btn-place-order"
            type="button"
            className="btn-amz-primary full"
            disabled={placing}
            onClick={() => void placeOrder()}
          >
            {tr(lang, 'placeOrder')}
          </button>

          <div className="summary-lines">
            <div>
              <span>{tr(lang, 'subtotal')}:</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div>
              <span>{tr(lang, 'shippingFee')}:</span>
              <span>{shippingCost === 0 ? tr(lang, 'free') : formatMoney(shippingCost)}</span>
            </div>
            {discount > 0 && (
              <div className="discount-line">
                <span>{tr(lang, 'discount')} ({appliedPromo}):</span>
                <span>-{formatMoney(discount)}</span>
              </div>
            )}
            <div>
              <span>{tr(lang, 'estimatedTax')}:</span>
              <span>{formatMoney(tax)}</span>
            </div>
            <hr />
            <div className="summary-total">
              <strong>{tr(lang, 'orderTotal')}:</strong>
              <strong>{formatMoney(total)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
