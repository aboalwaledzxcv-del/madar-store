import { Minus, Plus, ShoppingBag, Trash2, X, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMoney, tr } from '../i18n';

export default function CartDrawer() {
  const {
    lang, cart, cartOpen, setCartOpen, updateCartQty, removeFromCart,
    user, setAuthOpen, navigate,
  } = useStore();

  if (!cartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()} aria-label={tr(lang, 'cartTitle')}>
        <div className="cart-drawer-head">
          <div className="cart-title-row">
            <ShoppingBag size={20} />
            <h2>
              {tr(lang, 'cartTitle')} ({count})
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={() => setCartOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={42} />
              <h3>{tr(lang, 'cartEmpty')}</h3>
              <p>{tr(lang, 'cartEmptySub')}</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.productId}:${item.variantLabel}`} className="cart-item">
                <img
                  src={item.image}
                  alt={lang === 'ar' ? item.titleAr : item.titleEn}
                  onClick={() => {
                    setCartOpen(false);
                    navigate('product', item.productId);
                  }}
                />
                <div className="cart-item-info">
                  <button
                    type="button"
                    className="cart-item-title"
                    onClick={() => {
                      setCartOpen(false);
                      navigate('product', item.productId);
                    }}
                  >
                    {lang === 'ar' ? item.titleAr : item.titleEn}
                  </button>
                  {item.variantLabel && <span className="cart-item-var">{item.variantLabel}</span>}
                  {item.isPrime && (
                    <span className="prime-tag sm">
                      <Check size={11} /> <strong>{tr(lang, 'primeBadge')}</strong>
                    </span>
                  )}
                  <div className="cart-item-bottom">
                    <strong>{formatMoney(item.unitPrice * item.qty)}</strong>
                    <div className="qty-stepper">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => updateCartQty(item.productId, item.variantLabel, item.qty - 1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => updateCartQty(item.productId, item.variantLabel, Math.min(item.stock, item.qty + 1))}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="trash-icon"
                      aria-label="Remove"
                      onClick={() => removeFromCart(item.productId, item.variantLabel)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer-foot">
            <div className="cart-subtotal">
              <span>{tr(lang, 'subtotal')}:</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <button
              id="btn-proceed-checkout"
              type="button"
              className="btn-amz-primary full"
              onClick={() => {
                setCartOpen(false);
                if (user) navigate('checkout');
                else setAuthOpen(true);
              }}
            >
              {tr(lang, 'proceedCheckout')}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
