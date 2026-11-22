import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Box, DollarSign, Edit3, Package, Plus, Store, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useStore } from '../context/StoreContext';
import { CATEGORIES, formatMoney, tr } from '../i18n';
import type { Order, Product } from '../types';

const STUDIO_IMAGES = [
  '/images/headphones.jpg',
  '/images/laptop.jpg',
  '/images/watch.jpg',
  '/images/camera.jpg',
  '/images/espresso.jpg',
  '/images/sneakers.jpg',
  '/images/keyboard.jpg',
  '/images/backpack.jpg',
  '/images/monitor.jpg',
  '/images/chair.jpg',
  '/images/speaker.jpg',
  '/images/tablet.jpg',
];

interface Overview {
  revenue: number;
  orders: number;
  products: number;
  lowStock: number;
  customers: number;
}

export default function AdminDashboard() {
  const { lang, user, toast } = useStore();
  const [tab, setTab] = useState<'inventory' | 'orders'>('inventory');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    titleEn: '',
    titleAr: '',
    brand: 'MADAR',
    category: 'electronics',
    price: '199',
    originalPrice: '249',
    stock: '25',
    image: STUDIO_IMAGES[0],
    descriptionEn: '',
    descriptionAr: '',
    isPrime: true,
    isDeal: true,
  });

  const refresh = useCallback(async () => {
    const [ov, pr, ords] = await Promise.all([
      api<Overview>('/api/admin/overview'),
      api<{ products: Product[] }>('/api/products?sort=newest'),
      api<{ orders: Order[] }>('/api/admin/orders'),
    ]);
    setOverview(ov);
    setProducts(pr.products);
    setOrders(ords.orders);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      void refresh();
    }
  }, [user, refresh]);

  if (user?.role !== 'admin') {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <p>{lang === 'ar' ? 'تحتاج لصلاحيات البائع/الأدمن للوصول إلى هذه الصفحة.' : 'Seller/Admin permissions required.'}</p>
        </div>
      </div>
    );
  }

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setShowCreate(true);
    setForm({
      titleEn: p.titleEn,
      titleAr: p.titleAr,
      brand: p.brand,
      category: p.category,
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      stock: String(p.stock),
      image: p.image,
      descriptionEn: p.descriptionEn,
      descriptionAr: p.descriptionAr,
      isPrime: p.isPrime,
      isDeal: p.isDeal,
    });
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      stock: Number(form.stock),
    };
    try {
      if (editingId) {
        await api(`/api/admin/products/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast(lang === 'ar' ? 'تم تحديث المنتج' : 'Product updated');
      } else {
        await api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
        toast(lang === 'ar' ? 'تمت إضافة المنتج إلى المتجر' : 'New product published');
      }
      setShowCreate(false);
      setEditingId(null);
      await refresh();
    } catch (err) {
      toast((err as Error).message, 'err');
    }
  };

  const removeProduct = async (id: number) => {
    await api(`/api/admin/products/${id}`, { method: 'DELETE' });
    toast(lang === 'ar' ? 'تم حذف المنتج' : 'Product deleted');
    await refresh();
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    await api(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    toast(lang === 'ar' ? 'تم تحديث حالة الطلب' : 'Order status updated');
    await refresh();
  };

  return (
    <div className="page-wrap">
      <div className="admin-head">
        <div>
          <h1 className="page-heading">
            <Store size={24} /> {tr(lang, 'adminTitle')}
          </h1>
        </div>
        <button
          id="btn-admin-add-product"
          type="button"
          className="btn-amz-primary"
          onClick={() => {
            setEditingId(null);
            setForm({
              titleEn: '',
              titleAr: '',
              brand: 'MADAR',
              category: 'electronics',
              price: '199',
              originalPrice: '249',
              stock: '25',
              image: STUDIO_IMAGES[0],
              descriptionEn: '',
              descriptionAr: '',
              isPrime: true,
              isDeal: true,
            });
            setShowCreate((v) => !v);
          }}
        >
          <Plus size={16} /> {tr(lang, 'addProduct')}
        </button>
      </div>

      {/* KPI Grid */}
      {overview && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <DollarSign size={22} />
            <div>
              <small>{tr(lang, 'kpiRevenue')}</small>
              <strong>{formatMoney(overview.revenue)}</strong>
            </div>
          </div>
          <div className="kpi-card">
            <Package size={22} />
            <div>
              <small>{tr(lang, 'kpiOrders')}</small>
              <strong>{overview.orders}</strong>
            </div>
          </div>
          <div className="kpi-card">
            <Box size={22} />
            <div>
              <small>{tr(lang, 'kpiProducts')}</small>
              <strong>{overview.products}</strong>
            </div>
          </div>
          <div className="kpi-card warn">
            <AlertTriangle size={22} />
            <div>
              <small>{tr(lang, 'kpiLowStock')}</small>
              <strong>{overview.lowStock}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Form */}
      {showCreate && (
        <form className="admin-form-card" onSubmit={submitProduct}>
          <h3>{editingId ? tr(lang, 'editProduct') : tr(lang, 'addProduct')}</h3>
          <div className="admin-form-grid">
            <input
              placeholder="Product Title (English)"
              value={form.titleEn}
              onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
              required
            />
            <input
              placeholder="اسم المنتج (بالعربية)"
              value={form.titleAr}
              onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
              required
            />
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>{lang === 'ar' ? c.ar : c.en}</option>
              ))}
            </select>
            <input type="number" step="0.01" placeholder="Price ($)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input type="number" step="0.01" placeholder="Original Price ($)" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} />
            <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            <select value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}>
              {STUDIO_IMAGES.map((img) => (
                <option key={img} value={img}>{img.replace('/images/', '')}</option>
              ))}
            </select>
            <textarea
              placeholder="Description (English)"
              value={form.descriptionEn}
              onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
            />
            <textarea
              placeholder="وصف المنتج (بالعربية)"
              value={form.descriptionAr}
              onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
            />
          </div>
          <div className="admin-form-checks">
            <label><input type="checkbox" checked={form.isPrime} onChange={(e) => setForm({ ...form, isPrime: e.target.checked })} /> Prime</label>
            <label><input type="checkbox" checked={form.isDeal} onChange={(e) => setForm({ ...form, isDeal: e.target.checked })} /> Today&apos;s Deal</label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn-amz-primary">{editingId ? tr(lang, 'editProduct') : tr(lang, 'addProduct')}</button>
            <button type="button" className="btn-amz-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button id="tab-admin-inventory" type="button" className={tab === 'inventory' ? 'is-active' : ''} onClick={() => setTab('inventory')}>
          {tr(lang, 'tabInventory')} ({products.length})
        </button>
        <button id="tab-admin-orders" type="button" className={tab === 'orders' ? 'is-active' : ''} onClick={() => setTab('orders')}>
          {tr(lang, 'tabOrders')} ({orders.length})
        </button>
      </div>

      {tab === 'inventory' ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                <th>{lang === 'ar' ? 'القسم' : 'Category'}</th>
                <th>{lang === 'ar' ? 'السعر' : 'Price'}</th>
                <th>{lang === 'ar' ? 'المخزون' : 'Stock'}</th>
                <th>{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><code>{p.sku}</code></td>
                  <td className="tbl-prod">
                    <img src={p.image} alt="" />
                    <span>{lang === 'ar' ? p.titleAr : p.titleEn}</span>
                  </td>
                  <td>{p.category}</td>
                  <td><strong>{formatMoney(p.price)}</strong></td>
                  <td>
                    <span className={`stock-pill ${p.stock <= 12 ? 'low' : 'ok'}`}>{p.stock}</span>
                  </td>
                  <td className="tbl-actions">
                    <button type="button" className="btn-sm" onClick={() => startEdit(p)}>
                      <Edit3 size={14} /> {tr(lang, 'editProduct')}
                    </button>
                    <button type="button" className="btn-sm danger" onClick={() => void removeProduct(p.id)}>
                      <Trash2 size={14} /> {tr(lang, 'deleteProduct')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{tr(lang, 'orderNo')}</th>
                <th>{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                <th>{tr(lang, 'orderTotal')}</th>
                <th>{tr(lang, 'trackingNo')}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.orderNumber}</strong></td>
                  <td>{o.customerName} <small>({o.customerEmail})</small></td>
                  <td><strong>{formatMoney(o.total)}</strong></td>
                  <td><code>{o.trackingCode}</code></td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => void updateOrderStatus(o.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="placed">{tr(lang, 'statusPlaced')}</option>
                      <option value="packed">{tr(lang, 'statusPacked')}</option>
                      <option value="shipped">{tr(lang, 'statusShipped')}</option>
                      <option value="out_for_delivery">{tr(lang, 'statusOut')}</option>
                      <option value="delivered">{tr(lang, 'statusDelivered')}</option>
                      <option value="cancelled">{tr(lang, 'statusCancelled')}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
