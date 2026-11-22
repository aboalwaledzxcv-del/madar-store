export type Lang = 'ar' | 'en';
export type PageView = 'home' | 'product' | 'checkout' | 'orders' | 'account' | 'wishlist' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  isPrime: number;
}

export interface ProductSpec {
  kEn: string;
  kAr: string;
  v: string;
}

export interface ProductVariant {
  label: string;
  labelAr?: string;
  color?: string;
  priceDelta?: number;
}

export interface Product {
  id: number;
  slug: string;
  sku: string;
  titleEn: string;
  titleAr: string;
  brand: string;
  category: string;
  descriptionEn: string;
  descriptionAr: string;
  specs: ProductSpec[];
  variants: ProductVariant[];
  price: number;
  originalPrice: number | null;
  stock: number;
  image: string;
  isPrime: boolean;
  isDeal: boolean;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: number;
  helpfulCount: number;
  createdAt: string;
}

export interface Address {
  id: number;
  userId: number;
  label: string;
  fullName: string;
  phone: string;
  city: string;
  street: string;
  postalCode: string;
  isDefault: number;
}

export interface CartItem {
  productId: number;
  variantLabel: string;
  qty: number;
  titleEn: string;
  titleAr: string;
  brand: string;
  unitPrice: number;
  image: string;
  isPrime: boolean;
  stock: number;
}

export interface OrderItem {
  id?: number;
  productId: number;
  titleEn: string;
  titleAr: string;
  image: string;
  variantLabel: string;
  unitPrice: number;
  qty: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerName?: string;
  customerEmail?: string;
  status: 'placed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingSpeed: 'prime' | 'standard';
  address: Partial<Address>;
  promoCode: string | null;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  trackingCode: string;
  createdAt: string;
  items: OrderItem[];
}
