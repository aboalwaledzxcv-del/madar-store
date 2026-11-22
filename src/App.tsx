import { StoreProvider, useStore } from './context/StoreContext';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import CatalogView from './components/CatalogView';
import ProductDetailView from './components/ProductDetailView';
import CartDrawer from './components/CartDrawer';
import CheckoutView from './components/CheckoutView';
import OrdersView from './components/OrdersView';
import AccountView from './components/AccountView';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import { tr } from './i18n';

function StoreShell() {
  const { lang, page, searchQuery, selectedCategory, dealsOnly, primeOnly } = useStore();
  const showHero = page === 'home' && !searchQuery && selectedCategory === 'all' && !dealsOnly && !primeOnly;

  return (
    <div className="amz-app">
      <Header />
      <main className="amz-main">
        {page === 'home' && (
          <>
            {showHero && <HeroBanner />}
            <CatalogView />
          </>
        )}
        {page === 'product' && <ProductDetailView />}
        {page === 'checkout' && <CheckoutView />}
        {page === 'orders' && <OrdersView />}
        {page === 'account' && <AccountView initialTab="addresses" />}
        {page === 'wishlist' && <AccountView initialTab="wishlist" />}
        {page === 'admin' && <AdminDashboard />}
      </main>

      <footer className="amz-footer">
        <button
          type="button"
          className="footer-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {tr(lang, 'footerBackTop')}
        </button>
        <div className="footer-body">
          <div className="footer-brand">
            <strong>MADAR.</strong>
            <span>{tr(lang, 'brandSub')}</span>
          </div>
          <p>
            {lang === 'ar'
              ? 'منصة تجارة إلكترونية متكاملة — React + TypeScript + Express + SQLite'
              : 'Full-Stack Marketplace Platform — React + TypeScript + Express + SQLite'}
          </p>
        </div>
      </footer>

      <CartDrawer />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StoreShell />
    </StoreProvider>
  );
}
