import { useEffect, useState } from 'react';
import { Check, Heart, ShoppingCart, SlidersHorizontal, Tag, Truck } from 'lucide-react';
import { api } from '../api';
import { useStore } from '../context/StoreContext';
import { CATEGORIES, CATEGORY_MAP, formatMoney, tr } from '../i18n';
import type { Product } from '../types';
import Stars from './Stars';

export default function CatalogView() {
  const {
    lang, navigate, addToCart, wishlistIds, toggleWishlist,
    searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
    dealsOnly, setDealsOnly, primeOnly, setPrimeOnly,
  } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('featured');
  const [minRating, setMinRating] = useState(0);
  const [priceBucket, setPriceBucket] = useState<'all' | 'under150' | '150to500' | 'over500'>('all');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (primeOnly) params.set('prime', '1');
    if (dealsOnly) params.set('deals', '1');
    if (minRating > 0) params.set('minRating', String(minRating));
    if (priceBucket === 'under150') params.set('maxPrice', '150');
    else if (priceBucket === '150to500') {
      params.set('minPrice', '150');
      params.set('maxPrice', '500');
    } else if (priceBucket === 'over500') {
      params.set('minPrice', '500');
    }
    params.set('sort', sort);

    api<{ products: Product[] }>(`/api/products?${params.toString()}`)
      .then((res) => setProducts(res.products))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedCategory, primeOnly, dealsOnly, minRating, priceBucket, sort]);

  const resetAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDealsOnly(false);
    setPrimeOnly(false);
    setMinRating(0);
    setPriceBucket('all');
    setSort('featured');
  };

  return (
    <div id="catalog-top" className="catalog-shell">
      {/* Results & Sort Bar */}
      <div className="results-bar">
        <div className="results-summary">
          <strong>{products.length}</strong> {tr(lang, 'resultsCount')}
          {selectedCategory !== 'all' && (
            <span className="filter-pill">
              {lang === 'ar' ? CATEGORY_MAP[selectedCategory]?.ar : CATEGORY_MAP[selectedCategory]?.en}
            </span>
          )}
          {searchQuery && <span className="filter-pill">“{searchQuery}”</span>}
          {dealsOnly && <span className="filter-pill deal">{tr(lang, 'todaysDeals')}</span>}
        </div>
        <div className="sort-wrap">
          <label htmlFor="sort-select">{tr(lang, 'sortBy')}</label>
          <select id="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">{tr(lang, 'sortFeatured')}</option>
            <option value="price_asc">{tr(lang, 'sortPriceAsc')}</option>
            <option value="price_desc">{tr(lang, 'sortPriceDesc')}</option>
            <option value="rating">{tr(lang, 'sortRating')}</option>
            <option value="newest">{tr(lang, 'sortNewest')}</option>
          </select>
        </div>
      </div>

      <div className="catalog-layout">
        {/* Left Amazon Filter Rail */}
        <aside className="filter-rail">
          <div className="filter-rail-title">
            <SlidersHorizontal size={16} />
            <span>{tr(lang, 'department')}</span>
          </div>

          <ul className="filter-list">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={selectedCategory === c.id ? 'is-selected' : ''}
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {lang === 'ar' ? c.ar : c.en}
                </button>
              </li>
            ))}
          </ul>

          <div className="filter-group">
            <h4>{tr(lang, 'primeDelivery')}</h4>
            <label className="check-row">
              <input type="checkbox" checked={primeOnly} onChange={(e) => setPrimeOnly(e.target.checked)} />
              <span className="prime-word">
                <Check size={13} /> {tr(lang, 'primeBadge')}
              </span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={dealsOnly} onChange={(e) => setDealsOnly(e.target.checked)} />
              <span>{tr(lang, 'dealsOnly')}</span>
            </label>
          </div>

          <div className="filter-group">
            <h4>{tr(lang, 'customerReview')}</h4>
            {[4.5, 4, 3].map((r) => (
              <button
                key={r}
                type="button"
                className={`rating-filter-btn${minRating === r ? ' is-selected' : ''}`}
                onClick={() => setMinRating(minRating === r ? 0 : r)}
              >
                <Stars rating={r} size={13} /> <span>{tr(lang, 'andUp')}</span>
              </button>
            ))}
          </div>

          <div className="filter-group">
            <h4>{tr(lang, 'priceRange')}</h4>
            <ul className="filter-list">
              {(
                [
                  ['all', 'allPrices'],
                  ['under150', 'under150'],
                  ['150to500', 'from150to500'],
                  ['over500', 'over500'],
                ] as const
              ).map(([id, key]) => (
                <li key={id}>
                  <button
                    type="button"
                    className={priceBucket === id ? 'is-selected' : ''}
                    onClick={() => setPriceBucket(id)}
                  >
                    {tr(lang, key)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button type="button" className="btn-reset-filters" onClick={resetAll}>
            {tr(lang, 'resetFilters')}
          </button>
        </aside>

        {/* Product Grid */}
        <section className="product-grid" aria-label="Product catalog">
          {loading ? (
            Array.from({ length: 8 }).map((_, idx) => <div key={idx} className="product-card skeleton" />)
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>{lang === 'ar' ? 'لم نجد منتجات مطابقة لبحثك.' : 'No products match your current filters.'}</p>
              <button type="button" className="btn-amz-primary" onClick={resetAll}>
                {tr(lang, 'resetFilters')}
              </button>
            </div>
          ) : (
            products.map((p) => {
              const title = lang === 'ar' ? p.titleAr : p.titleEn;
              const saved = wishlistIds.includes(p.id);
              const discountPct =
                p.originalPrice && p.originalPrice > p.price
                  ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                  : 0;

              return (
                <article key={p.id} className="product-card" data-product-id={p.id}>
                  <div className="card-media">
                    <button
                      type="button"
                      className="card-img-btn"
                      onClick={() => navigate('product', p.id)}
                      aria-label={title}
                    >
                      <img src={p.image} alt={title} loading="lazy" />
                    </button>

                    <button
                      type="button"
                      className={`wish-btn${saved ? ' is-saved' : ''}`}
                      aria-label={saved ? tr(lang, 'savedWishlist') : tr(lang, 'saveWishlist')}
                      onClick={() => void toggleWishlist(p.id)}
                    >
                      <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
                    </button>

                    {p.isDeal && discountPct > 0 && (
                      <span className="deal-ribbon">
                        <Tag size={12} /> -{discountPct}% · {tr(lang, 'dealBadge')}
                      </span>
                    )}
                  </div>

                  <div className="card-body">
                    <span className="card-brand">{p.brand}</span>
                    <button type="button" className="card-title" onClick={() => navigate('product', p.id)}>
                      {title}
                    </button>

                    <Stars rating={p.ratingAvg} count={p.reviewCount} />

                    <div className="card-price-row">
                      <span className="price-main">{formatMoney(p.price)}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="price-strike">{formatMoney(p.originalPrice)}</span>
                      )}
                    </div>

                    <div className="card-delivery">
                      {p.isPrime ? (
                        <span className="prime-tag">
                          <Check size={12} /> <strong>{tr(lang, 'primeBadge')}</strong> · {tr(lang, 'freeDeliveryTomorrow')}
                        </span>
                      ) : (
                        <span className="std-tag">
                          <Truck size={13} /> {tr(lang, 'shippingStandard')}
                        </span>
                      )}
                    </div>

                    {p.stock <= 10 && p.stock > 0 && (
                      <span className="stock-warn">
                        {tr(lang, 'lowStock')} {p.stock}
                      </span>
                    )}
                  </div>

                  <div className="card-actions">
                    <button
                      type="button"
                      className="btn-amz-primary full add-cart-btn"
                      disabled={p.stock <= 0}
                      onClick={() => addToCart(p)}
                    >
                      <ShoppingCart size={16} />
                      <span>{p.stock > 0 ? tr(lang, 'addToCart') : tr(lang, 'outOfStock')}</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
