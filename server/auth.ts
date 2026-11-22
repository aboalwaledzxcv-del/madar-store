import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { db } from './db';

const SECRET = process.env.MADAR_SECRET || 'madar-local-dev-hmac-secret-2026';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  isPrime: number;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const key = Buffer.from(keyHex, 'hex');
  return key.length === derived.length && crypto.timingSafeEqual(key, derived);
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

export function signToken(userId: number): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ sub: userId, exp: Date.now() + 7 * 86400 * 1000 }));
  const sig = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
  const a = Buffer.from(s);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as { sub?: number; exp?: number };
    if (!data.sub || !data.exp || Date.now() > data.exp) return null;
    return data.sub;
  } catch {
    return null;
  }
}

function lookupUser(req: Request): AuthUser | undefined {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return undefined;
  const userId = verifyToken(auth.slice(7));
  if (!userId) return undefined;
  return db
    .prepare('SELECT id, name, email, role, isPrime FROM users WHERE id = ?')
    .get(userId) as AuthUser | undefined;
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  req.user = lookupUser(req);
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = lookupUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = lookupUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Seller / Admin permissions required' });
    return;
  }
  req.user = user;
  next();
}
