import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db';
import { seedIfEmpty } from './seed';
import {
  hashPassword, verifyPassword, signToken, requireAuth, requireAdmin, optionalAuth,
  type AuthedRequest,
} from './auth';

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

interface ProductRow {
  id: number;
  slug: string;
  sku: string;
  titleEn: string;
  titleAr: string;
  brand: string;
  category: string;
  descriptionEn: string;
  descriptionAr: string;
  specsJson: string;
  variantsJson: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  image: string;
  isPrime: number;
  isDeal: number;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
}

function formatProduct(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    titleEn: row.titleEn,
    titleAr: row.titleAr,
    brand: row.brand,
    category: row.category,
    descriptionEn: row.descriptionEn,
    descriptionAr: row.descriptionAr,
    specs: JSON.parse(row.specsJson || '[]'),
    variants: JSON.parse(row.variantsJson || '[]'),
    price: row.price,
    originalPrice: row.originalPrice,
    stock: row.stock,
    image: row.image,
    isPrime: Boolean(row.isPrime),
    isDeal: Boolean(row.isDeal),
    ratingAvg: row.ratingAvg,
    reviewCount: row.reviewCount,
    createdAt: row.createdAt,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'madar-api' });
});

// ------------------------------------------------------------------ Auth
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanName || !cleanEmail || !password || password.length < 6) {
    res.status(400).json({ error: 'Name, valid email, and password (6+ chars) are required' });
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const resInsert = db
    .prepare('INSERT INTO users (name, email, passwordHash, role, isPrime) VALUES (?, ?, ?, ?, ?)')
    .run(cleanName, cleanEmail, hashPassword(password), 'customer', 1);
  const userId = Number(resInsert.lastInsertRowid);
  const user = db.prepare('SELECT id, name, email, role, isPrime FROM users WHERE id = ?').get(userId);
  res.status(201).json({ token: signToken(userId), user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = (email || '').trim().toLowerCase();
  const row = db
    .prepare('SELECT id, name, email, passwordHash, role, isPrime FROM users WHERE email = ?')
    .get(cleanEmail) as { id: number; name: string; email: string; passwordHash: string; role: string; isPrime: number } | undefined;
  if (!row || !password || !verifyPassword(password, row.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  res.json({
    token: signToken(row.id),
    user: { id: row.id, name: row.name, email: row.email, role: row.role, isPrime: row.isPrime },
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

// ------------------------------------------------------------------ Catalog
app.get('/api/products/suggest', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    res.json({ suggestions: [] });
    return;
  }
  const like = `%${q}%`;
  const rows = db
    .prepare(`
      SELECT id, titleEn, titleAr, category, brand, price, image
      FROM products
      WHERE titleEn LIKE ? OR titleAr LIKE ? OR brand LIKE ? OR category LIKE ?
      ORDER BY reviewCount DESC, ratingAvg DESC
      LIMIT 6
    `)
    .all(like, like, like, like);
  res.json({ suggestions: rows });
});

app.get('/api/products', (req, res) => {
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || 'all').trim();
  const prime = req.query.prime === '1';
  const deals = req.query.deals === '1';
  const minPrice = Number(req.query.minPrice || 0);
  const maxPrice = Number(req.query.maxPrice || 0);
  const minRating = Number(req.query.minRating || 0);
  const sort = String(req.query.sort || 'featured');

  const where: string[] = ['1=1'];
  const params: Array<string | number> = [];

  if (q) {
    const like = `%${q}%`;
    where.push('(titleEn LIKE ? OR titleAr LIKE ? OR brand LIKE ? OR descriptionEn LIKE ? OR descriptionAr LIKE ?)');
    params.push(like, like, like, like, like);
  }
  if (category && category !== 'all') {
    where.push('category = ?');
    params.push(category);
  }
  if (prime) where.push('isPrime = 1');
  if (deals) where.push('isDeal = 1');
  if (minPrice > 0) {
    where.push('price >= ?');
    params.push(minPrice);
  }
  if (maxPrice > 0) {
    where.push('price <= ?');
    params.push(maxPrice);
  }
  if (minRating > 0) {
    where.push('ratingAvg >= ?');
    params.push(minRating);
  }

  let orderBy = 'isDeal DESC, reviewCount DESC, id ASC';
  if (sort === 'price_asc') orderBy = 'price ASC';
  else if (sort === 'price_desc') orderBy = 'price DESC';
  else if (sort === 'rating') orderBy = 'ratingAvg DESC, reviewCount DESC';
  else if (sort === 'newest') orderBy = 'id DESC';

  const rows = db
    .prepare(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY ${orderBy}`)
    .all(...params) as unknown as ProductRow[];

  res.json({ products: rows.map(formatProduct) });
});

app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = (Number.isFinite(id)
    ? db.prepare('SELECT * FROM products WHERE id = ?').get(id)
    : db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.id)) as ProductRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const reviews = db
    .prepare('SELECT * FROM reviews WHERE productId = ? ORDER BY id DESC')
    .all(row.id) as Array<{
    id: number; productId: number; userId: number; userName: string;
    rating: number; title: string; comment: string; verifiedPurchase: number;
    helpfulCount: number; createdAt: string;
  }>;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  res.json({ product: formatProduct(row), reviews, breakdown });
});

app.post('/api/products/:id/reviews', requireAuth, (req: AuthedRequest, res) => {
  const pid = Number(req.params.id);
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(pid);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const { rating, title, comment } = req.body as { rating?: number; title?: string; comment?: string };
  const r = Math.max(1, Math.min(5, Math.round(Number(rating || 5))));
  const cleanTitle = (title || '').trim();
  const cleanComment = (comment || '').trim();
  if (!cleanTitle || !cleanComment) {
    res.status(400).json({ error: 'Review title and comment are required' });
    return;
  }

  const hasPurchased = db
    .prepare(`
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      WHERE o.userId = ? AND oi.productId = ?
      LIMIT 1
    `)
    .get(req.user!.id, pid);

  db.prepare(`
    INSERT INTO reviews (productId, userId, userName, rating, title, comment, verifiedPurchase)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(pid, req.user!.id, req.user!.name, r, cleanTitle, cleanComment, hasPurchased ? 1 : 0);

  const avg = db
    .prepare('SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE productId = ?')
    .get(pid) as { avg: number; cnt: number };
  db.prepare('UPDATE products SET ratingAvg = ?, reviewCount = ? WHERE id = ?').run(
    Number(avg.avg.toFixed(2)),
    avg.cnt,
    pid
  );

  const reviews = db.prepare('SELECT * FROM reviews WHERE productId = ? ORDER BY id DESC').all(pid);
  res.status(201).json({ reviews, ratingAvg: Number(avg.avg.toFixed(2)), reviewCount: avg.cnt });
});

app.post('/api/reviews/:id/helpful', optionalAuth, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('UPDATE reviews SET helpfulCount = helpfulCount + 1 WHERE id = ?').run(id);
  const row = db.prepare('SELECT id, helpfulCount FROM reviews WHERE id = ?').get(id);
  res.json({ review: row });
});

// ------------------------------------------------------------------ Addresses
app.get('/api/addresses', requireAuth, (req: AuthedRequest, res) => {
  const rows = db.prepare('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, id DESC').all(req.user!.id);
  res.json({ addresses: rows });
});

app.post('/api/addresses', requireAuth, (req: AuthedRequest, res) => {
  const { label, fullName, phone, city, street, postalCode, isDefault } = req.body as Record<string, unknown>;
  if (!fullName || !phone || !city || !street) {
    res.status(400).json({ error: 'All address fields are required' });
    return;
  }
  const existingCount = (db.prepare('SELECT COUNT(*) AS c FROM addresses WHERE userId = ?').get(req.user!.id) as { c: number }).c;
  const makeDefault = isDefault || existingCount === 0 ? 1 : 0;
  if (makeDefault) {
    db.prepare('UPDATE addresses SET isDefault = 0 WHERE userId = ?').run(req.user!.id);
  }
  const info = db
    .prepare('INSERT INTO addresses (userId, label, fullName, phone, city, street, postalCode, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(
      req.user!.id,
      String(label || 'Home'),
      String(fullName),
      String(phone),
      String(city),
      String(street),
      String(postalCode || '11118'),
      makeDefault
    );
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(Number(info.lastInsertRowid));
  res.status(201).json({ address: addr });
});

app.patch('/api/addresses/:id/default', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('UPDATE addresses SET isDefault = 0 WHERE userId = ?').run(req.user!.id);
  db.prepare('UPDATE addresses SET isDefault = 1 WHERE id = ? AND userId = ?').run(id, req.user!.id);
  const rows = db.prepare('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, id DESC').all(req.user!.id);
  res.json({ addresses: rows });
});

app.delete('/api/addresses/:id', requireAuth, (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM addresses WHERE id = ? AND userId = ?').run(id, req.user!.id);
  const rows = db.prepare('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, id DESC').all(req.user!.id);
  res.json({ addresses: rows });
});

// ------------------------------------------------------------------ Wishlist
app.get('/api/wishlist', requireAuth, (req: AuthedRequest, res) => {
  const rows = db
    .prepare(`
      SELECT p.* FROM products p
      JOIN wishlist w ON w.productId = p.id
      WHERE w.userId = ?
      ORDER BY w.createdAt DESC
    `)
    .all(req.user!.id) as unknown as ProductRow[];
  res.json({ products: rows.map(formatProduct) });
});

app.post('/api/wishlist/:productId', requireAuth, (req: AuthedRequest, res) => {
  const pid = Number(req.params.productId);
  const exists = db.prepare('SELECT 1 FROM wishlist WHERE userId = ? AND productId = ?').get(req.user!.id, pid);
  if (exists) {
    db.prepare('DELETE FROM wishlist WHERE userId = ? AND productId = ?').run(req.user!.id, pid);
  } else {
    db.prepare('INSERT OR IGNORE INTO wishlist (userId, productId) VALUES (?, ?)').run(req.user!.id, pid);
  }
  const ids = (db.prepare('SELECT productId FROM wishlist WHERE userId = ?').all(req.user!.id) as Array<{ productId: number }>).map(
    (r) => r.productId
  );
  res.json({ saved: !exists, wishlistIds: ids });
});

// ------------------------------------------------------------------ Server Cart
app.get('/api/cart', requireAuth, (req: AuthedRequest, res) => {
  const rows = db
    .prepare(`
      SELECT c.id, c.productId, c.variantLabel, c.qty, p.titleEn, p.titleAr, p.price, p.image, p.isPrime, p.stock, p.variantsJson, p.brand
      FROM cart_items c
      JOIN products p ON p.id = c.productId
      WHERE c.userId = ?
    `)
    .all(req.user!.id) as Array<{
    id: number; productId: number; variantLabel: string; qty: number;
    titleEn: string; titleAr: string; price: number; image: string;
    isPrime: number; stock: number; variantsJson: string; brand: string;
  }>;

  const items = rows.map((r) => {
    const variants = JSON.parse(r.variantsJson || '[]') as Array<{ label: string; priceDelta?: number }>;
    const match = variants.find((v) => v.label === r.variantLabel);
    const unitPrice = Math.max(1, r.price + (match?.priceDelta || 0));
    return {
      productId: r.productId,
      variantLabel: r.variantLabel,
      qty: r.qty,
      titleEn: r.titleEn,
      titleAr: r.titleAr,
      brand: r.brand,
      unitPrice,
      image: r.image,
      isPrime: Boolean(r.isPrime),
      stock: r.stock,
    };
  });
  res.json({ items });
});

app.put('/api/cart', requireAuth, (req: AuthedRequest, res) => {
  const { items } = req.body as { items?: Array<{ productId: number; variantLabel?: string; qty: number }> };
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'items array required' });
    return;
  }
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM cart_items WHERE userId = ?').run(req.user!.id);
    const ins = db.prepare('INSERT INTO cart_items (userId, productId, variantLabel, qty) VALUES (?, ?, ?, ?)');
    for (const it of items) {
      if (!it.productId || it.qty <= 0) continue;
      ins.run(req.user!.id, it.productId, it.variantLabel || '', Math.min(99, Math.round(it.qty)));
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  res.json({ ok: true });
});

// ------------------------------------------------------------------ Orders & Checkout
app.get('/api/orders', requireAuth, (req: AuthedRequest, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE userId = ? ORDER BY id DESC')
    .all(req.user!.id) as Array<Record<string, unknown>>;

  const getItems = db.prepare('SELECT * FROM order_items WHERE orderId = ?');
  const enriched = orders.map((o) => ({
    ...o,
    address: JSON.parse(String(o.addressSnapshotJson || '{}')),
    items: getItems.all(Number(o.id)),
  }));
  res.json({ orders: enriched });
});

app.post('/api/orders', requireAuth, (req: AuthedRequest, res) => {
  const { items, address, paymentMethod, shippingSpeed, promoCode } = req.body as {
    items?: Array<{ productId: number; variantLabel?: string; qty: number }>;
    address?: Record<string, string>;
    paymentMethod?: string;
    shippingSpeed?: 'prime' | 'standard';
    promoCode?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Your cart is empty' });
    return;
  }
  if (!address?.fullName || !address?.city || !address?.street) {
    res.status(400).json({ error: 'Shipping address is incomplete' });
    return;
  }

  db.exec('BEGIN');
  try {
    let subtotal = 0;
    const resolved: Array<{
      productId: number; titleEn: string; titleAr: string; image: string;
      variantLabel: string; unitPrice: number; qty: number;
    }> = [];

    for (const reqItem of items) {
      const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(reqItem.productId) as ProductRow | undefined;
      if (!prod) {
        throw new Error(`Product #${reqItem.productId} no longer exists`);
      }
      const qty = Math.max(1, Math.round(reqItem.qty));
      if (prod.stock < qty) {
        throw new Error(`Insufficient stock for ${prod.titleEn}`);
      }
      const variants = JSON.parse(prod.variantsJson || '[]') as Array<{ label: string; priceDelta?: number }>;
      const variant = variants.find((v) => v.label === (reqItem.variantLabel || ''));
      const unitPrice = Number(Math.max(1, prod.price + (variant?.priceDelta || 0)).toFixed(2));
      subtotal += unitPrice * qty;

      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, prod.id);
      resolved.push({
        productId: prod.id,
        titleEn: prod.titleEn,
        titleAr: prod.titleAr,
        image: prod.image,
        variantLabel: reqItem.variantLabel || '',
        unitPrice,
        qty,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const speed = shippingSpeed === 'prime' ? 'prime' : 'standard';
    const shippingCost = speed === 'prime' ? (req.user!.isPrime ? 0 : 9.99) : subtotal >= 50 ? 0 : 5.99;

    let discount = 0;
    const code = (promoCode || '').trim().toUpperCase();
    if (code === 'PRIME10' || code === 'MADAR10') discount = Number((subtotal * 0.1).toFixed(2));
    else if (code === 'AMZ20' || code === 'MADAR20') discount = Number((subtotal * 0.2).toFixed(2));

    const taxable = Math.max(0, subtotal - discount);
    const tax = Number((taxable * 0.08).toFixed(2));
    const total = Number((taxable + shippingCost + tax).toFixed(2));

    const orderNumber = `MDR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingCode = `TRK-MDR-${Math.floor(100000 + Math.random() * 900000)}JO`;

    const ordRes = db
      .prepare(`
        INSERT INTO orders (
          orderNumber, userId, status, paymentMethod, shippingSpeed, addressSnapshotJson,
          promoCode, subtotal, shippingCost, tax, discount, total, trackingCode
        ) VALUES (?, ?, 'placed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        orderNumber,
        req.user!.id,
        paymentMethod || 'Visa •••• 4242',
        speed,
        JSON.stringify(address),
        code || null,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        trackingCode
      );
    const orderId = Number(ordRes.lastInsertRowid);
    const insItem = db.prepare(`
      INSERT INTO order_items (orderId, productId, titleEn, titleAr, image, variantLabel, unitPrice, qty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of resolved) {
      insItem.run(orderId, r.productId, r.titleEn, r.titleAr, r.image, r.variantLabel, r.unitPrice, r.qty);
    }

    db.prepare('DELETE FROM cart_items WHERE userId = ?').run(req.user!.id);
    db.exec('COMMIT');

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown>;
    res.status(201).json({
      order: {
        ...created,
        address,
        items: resolved,
      },
    });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: (err as Error).message });
  }
});

// ------------------------------------------------------------------ Seller / Admin Studio
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const revenueRow = db
    .prepare("SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE status != 'cancelled'")
    .get() as { revenue: number; orders: number };
  const prodRow = db
    .prepare('SELECT COUNT(*) AS products, SUM(CASE WHEN stock <= 12 THEN 1 ELSE 0 END) AS lowStock FROM products')
    .get() as { products: number; lowStock: number };
  const custRow = db.prepare("SELECT COUNT(*) AS customers FROM users WHERE role = 'customer'").get() as { customers: number };
  res.json({
    revenue: Number(revenueRow.revenue.toFixed(2)),
    orders: revenueRow.orders,
    products: prodRow.products,
    lowStock: prodRow.lowStock || 0,
    customers: custRow.customers,
  });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const orders = db
    .prepare(`
      SELECT o.*, u.name AS customerName, u.email AS customerEmail
      FROM orders o
      JOIN users u ON u.id = o.userId
      ORDER BY o.id DESC
    `)
    .all() as Array<Record<string, unknown>>;
  const getItems = db.prepare('SELECT * FROM order_items WHERE orderId = ?');
  res.json({
    orders: orders.map((o) => ({
      ...o,
      address: JSON.parse(String(o.addressSnapshotJson || '{}')),
      items: getItems.all(Number(o.id)),
    })),
  });
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status?: string };
  const allowed = ['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  db.prepare("UPDATE orders SET status = ?, updatedAt = datetime('now') WHERE id = ?").run(status, id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ order: updated });
});

app.post('/api/admin/products', requireAdmin, (req: AuthedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const titleEn = String(body.titleEn || '').trim();
  const titleAr = String(body.titleAr || titleEn).trim();
  const brand = String(body.brand || 'MADAR').trim();
  const category = String(body.category || 'electronics').trim();
  const price = Number(body.price || 0);
  if (!titleEn || price <= 0) {
    res.status(400).json({ error: 'Title and valid price are required' });
    return;
  }
  const slug = `${titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 36)}-${Date.now().toString(36)}`;
  const sku = `MDR-${category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const info = db
    .prepare(`
      INSERT INTO products (
        slug, sku, titleEn, titleAr, brand, category, descriptionEn, descriptionAr,
        specsJson, variantsJson, price, originalPrice, stock, image, isPrime, isDeal, sellerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      slug,
      sku,
      titleEn,
      titleAr,
      brand,
      category,
      String(body.descriptionEn || titleEn),
      String(body.descriptionAr || titleAr),
      JSON.stringify(body.specs || []),
      JSON.stringify(body.variants || []),
      price,
      body.originalPrice ? Number(body.originalPrice) : null,
      Math.max(0, Math.round(Number(body.stock ?? 25))),
      String(body.image || '/images/headphones.jpg'),
      body.isPrime === false ? 0 : 1,
      body.isDeal ? 1 : 0,
      req.user!.id
    );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(info.lastInsertRowid)) as unknown as ProductRow;
  res.status(201).json({ product: formatProduct(row) });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as ProductRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const b = req.body as Record<string, unknown>;
  db.prepare(`
    UPDATE products SET
      titleEn = ?, titleAr = ?, brand = ?, category = ?,
      descriptionEn = ?, descriptionAr = ?, price = ?, originalPrice = ?,
      stock = ?, image = ?, isPrime = ?, isDeal = ?
    WHERE id = ?
  `).run(
    b.titleEn !== undefined ? String(b.titleEn) : existing.titleEn,
    b.titleAr !== undefined ? String(b.titleAr) : existing.titleAr,
    b.brand !== undefined ? String(b.brand) : existing.brand,
    b.category !== undefined ? String(b.category) : existing.category,
    b.descriptionEn !== undefined ? String(b.descriptionEn) : existing.descriptionEn,
    b.descriptionAr !== undefined ? String(b.descriptionAr) : existing.descriptionAr,
    b.price !== undefined ? Number(b.price) : existing.price,
    b.originalPrice !== undefined ? (b.originalPrice ? Number(b.originalPrice) : null) : existing.originalPrice,
    b.stock !== undefined ? Math.max(0, Math.round(Number(b.stock))) : existing.stock,
    b.image !== undefined ? String(b.image) : existing.image,
    b.isPrime !== undefined ? (b.isPrime ? 1 : 0) : existing.isPrime,
    b.isDeal !== undefined ? (b.isDeal ? 1 : 0) : existing.isDeal,
    id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as ProductRow;
  res.json({ product: formatProduct(updated) });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ ok: true });
});

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MADAR API listening on http://0.0.0.0:${PORT}`);
});
