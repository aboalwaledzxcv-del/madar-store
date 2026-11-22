import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    isPrime INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    fullName TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    street TEXT NOT NULL,
    postalCode TEXT NOT NULL,
    isDefault INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    titleEn TEXT NOT NULL,
    titleAr TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    descriptionEn TEXT NOT NULL,
    descriptionAr TEXT NOT NULL,
    specsJson TEXT NOT NULL DEFAULT '[]',
    variantsJson TEXT NOT NULL DEFAULT '[]',
    price REAL NOT NULL,
    originalPrice REAL,
    stock INTEGER NOT NULL DEFAULT 20,
    image TEXT NOT NULL,
    isPrime INTEGER NOT NULL DEFAULT 1,
    isDeal INTEGER NOT NULL DEFAULT 0,
    ratingAvg REAL NOT NULL DEFAULT 4.5,
    reviewCount INTEGER NOT NULL DEFAULT 0,
    sellerId INTEGER REFERENCES users(id),
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    userName TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    verifiedPurchase INTEGER NOT NULL DEFAULT 1,
    helpfulCount INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNumber TEXT NOT NULL UNIQUE,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'placed',
    paymentMethod TEXT NOT NULL,
    shippingSpeed TEXT NOT NULL DEFAULT 'prime',
    addressSnapshotJson TEXT NOT NULL,
    promoCode TEXT,
    subtotal REAL NOT NULL,
    shippingCost REAL NOT NULL,
    tax REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    trackingCode TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    productId INTEGER NOT NULL,
    titleEn TEXT NOT NULL,
    titleAr TEXT NOT NULL,
    image TEXT NOT NULL,
    variantLabel TEXT NOT NULL DEFAULT '',
    unitPrice REAL NOT NULL,
    qty INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    productId INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (userId, productId)
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    productId INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variantLabel TEXT NOT NULL DEFAULT '',
    qty INTEGER NOT NULL DEFAULT 1,
    UNIQUE(userId, productId, variantLabel)
  );
`);
