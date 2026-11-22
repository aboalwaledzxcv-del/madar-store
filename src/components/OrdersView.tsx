import { useEffect, useState } from 'react';
import { Box, Check, Home, Package, Truck } from 'lucide-react';
import { api } from '../api';
import { useStore } from '../context/StoreContext';
import { formatMoney, tr } from '../i18n';
import type { Order } from '../types';

const STEPS = ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const;

export default function OrdersView() {
  const { lang, user, setAuthOpen, navigate } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAuthOpen(true);
      setLoading(false);
      return;
    }
    api<{ orders: Order[] }>('/api/orders')
      .then((r) => setOrders(r.orders))
      .finally(() => setLoading(false));
  }, [user, setAuthOpen]);

  const stepLabel = (s: string) => {
    switch (s) {
      case 'placed': return tr(lang, 'statusPlaced');
      case 'packed': return tr(lang, 'statusPacked');
      case 'shipped': return tr(lang, 'statusShipped');
      case 'out_for_delivery': return tr(lang, 'statusOut');
      case 'delivered': return tr(lang, 'statusDelivered');
      default: return tr(lang, 'statusCancelled');
    }
  };

  return (
    <div className="page-wrap">
      <h1 className="page-heading">
        <Package size={24} /> {tr(lang, 'ordersTitle')}
      </h1>

      {loading ? (
        <div className="pdp-loading" />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>{tr(lang, 'noOrders')}</p>
          <button type="button" className="btn-amz-primary" onClick={() => navigate('home')}>
            {tr(lang, 'backToResults')}
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => {
            const activeIdx = STEPS.indexOf(o.status as (typeof STEPS)[number]);
            return (
              <article key={o.id} className="order-card">
                <header className="order-card-head">
                  <div>
                    <small>{tr(lang, 'orderNo')}</small>
                    <strong>{o.orderNumber}</strong>
                  </div>
                  <div>
                    <small>{tr(lang, 'trackingNo')}</small>
                    <strong>{o.trackingCode}</strong>
                  </div>
                  <div>
                    <small>{tr(lang, 'paymentMethod')}</small>
                    <strong>{o.paymentMethod}</strong>
                  </div>
                  <div>
                    <small>{tr(lang, 'orderTotal')}</small>
                    <strong className="order-total-val">{formatMoney(o.total)}</strong>
                  </div>
                </header>

                {/* Visual Tracking Stepper */}
                {o.status !== 'cancelled' ? (
                  <div className="tracking-stepper">
                    {STEPS.map((st, idx) => {
                      const done = idx <= activeIdx;
                      const Icon = idx === 0 ? Check : idx === 1 ? Box : idx === 4 ? Home : Truck;
                      return (
                        <div key={st} className={`track-step${done ? ' is-done' : ''}`}>
                          <div className="track-dot">
                            <Icon size={14} />
                          </div>
                          <span>{stepLabel(st)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="cancelled-banner">{tr(lang, 'statusCancelled')}</div>
                )}

                <div className="order-items-list">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="order-item-row">
                      <img src={it.image} alt="" onClick={() => navigate('product', it.productId)} />
                      <div>
                        <button type="button" onClick={() => navigate('product', it.productId)}>
                          {lang === 'ar' ? it.titleAr : it.titleEn}
                        </button>
                        <small>
                          {it.variantLabel} · {tr(lang, 'qty')}: {it.qty} · {formatMoney(it.unitPrice)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
