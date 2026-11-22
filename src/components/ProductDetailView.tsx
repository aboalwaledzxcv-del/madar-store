import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Heart, Lock, ShieldCheck, Star, ThumbsUp, Truck } from 'lucide-react';
import { api } from '../api';
import { useStore } from '../context/StoreContext';
import { CATEGORY_MAP, formatMoney, tr } from '../i18n';
import type { Product, Review } from '../types';
import Stars from './Stars';

interface BreakdownRow {
  stars: number;
  count: number;
}

export default function ProductDetailView() {
  const {
    lang, selectedProductId, navigate, addToCart, wishlistIds, toggleWishlist,
    user, setAuthOpen, toast,
  } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [qty, setQty] = useState(1);
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedProductId) return;
    api<{ product: Product; reviews: Review[]; breakdown: BreakdownRow[] }>(`/api/products/${selectedProductId}`)
      .then((res) => {
        setProduct(res.product);
        setReviews(res.reviews);
        setBreakdown(res.breakdown);
        setSelectedVariant(res.product.variants[0]?.label || '');
        setQty(1);
      })
      .catch(() => navigate('home'));
  }, [selectedProductId, navigate]);

  if (!product) {
    return <div className="page-wrap"><div className="pdp-loading" /></div>;
  }

  const title = lang === 'ar' ? product.titleAr : product.titleEn;
  const desc = lang === 'ar' ? product.descriptionAr : product.descriptionEn;
  const variant = product.variants.find((v) => v.label === selectedVariant);
  const activePrice = Number(Math.max(1, product.price + (variant?.priceDelta || 0)).toFixed(2));
  const saved = wishlistIds.includes(product.id);
  const totalReviews = Math.max(1, reviews.length);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ reviews: Review[]; ratingAvg: number; reviewCount: number }>(
        `/api/products/${product.id}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({ rating: revRating, title: revTitle, comment: revComment }),
        }
      );
      setReviews(res.reviews);
      setProduct((p) => (p ? { ...p, ratingAvg: res.ratingAvg, reviewCount: res.reviewCount } : p));
      setBreakdown(
        [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: res.reviews.filter((r) => r.rating === s).length }))
      );
      setRevTitle('');
      setRevComment('');
      toast(lang === 'ar' ? 'تم نشر تقييمك بنجاح' : 'Review published');
    } catch (err) {
      toast((err as Error).message, 'err');
    } finally {
      setSubmitting(false);
    }
  };

  const voteHelpful = async (reviewId: number) => {
    const res = await api<{ review: { id: number; helpfulCount: number } }>(`/api/reviews/${reviewId}/helpful`, {
      method: 'POST',
    });
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: res.review.helpfulCount } : r))
    );
  };

  return (
    <div className="page-wrap">
      <div className="pdp-breadcrumb">
        <button type="button" className="back-link" onClick={() => navigate('home')}>
          <ArrowLeft size={16} />
          <span>{tr(lang, 'backToResults')}</span>
        </button>
        <span className="crumb-sep">/</span>
        <span>{lang === 'ar' ? CATEGORY_MAP[product.category]?.ar : CATEGORY_MAP[product.category]?.en}</span>
        <span className="crumb-sep">/</span>
        <span>{product.brand}</span>
      </div>

      {/* 3-Column Amazon Product Detail Grid */}
      <div className="pdp-grid">
        <div className="pdp-gallery">
          <div className="pdp-stage">
            <img src={product.image} alt={title} />
          </div>
          {product.specs.length > 0 && (
            <div className="pdp-specs">
              <h3>{tr(lang, 'specsTitle')}</h3>
              <table>
                <tbody>
                  {product.specs.map((sp, i) => (
                    <tr key={i}>
                      <th>{lang === 'ar' ? sp.kAr : sp.kEn}</th>
                      <td>{sp.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pdp-info">
          <span className="pdp-brand">
            {tr(lang, 'brandLabel')} <strong>{product.brand}</strong> · {tr(lang, 'skuLabel')} {product.sku}
          </span>
          <h1 className="pdp-title">{title}</h1>

          <div className="pdp-rating-line">
            <Stars rating={product.ratingAvg} count={product.reviewCount} size={17} />
          </div>

          <hr />

          <div className="pdp-price-block">
            {product.isDeal && <span className="deal-pill">{tr(lang, 'dealBadge')}</span>}
            <div className="pdp-price-main">{formatMoney(activePrice)}</div>
            {product.originalPrice && product.originalPrice > activePrice && (
              <div className="pdp-list-price">
                <span>{formatMoney(product.originalPrice)}</span>
                <em>
                  -{Math.round(((product.originalPrice - activePrice) / product.originalPrice) * 100)}%
                </em>
              </div>
            )}
          </div>

          {product.variants.length > 0 && (
            <div className="pdp-variants">
              <div className="variants-label">
                {tr(lang, 'chooseOption')} <strong>{lang === 'ar' ? variant?.labelAr || selectedVariant : selectedVariant}</strong>
              </div>
              <div className="variants-list">
                {product.variants.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    className={`variant-chip${selectedVariant === v.label ? ' is-selected' : ''}`}
                    onClick={() => setSelectedVariant(v.label)}
                  >
                    {v.color && <span className="swatch" style={{ background: v.color }} />}
                    <span>{lang === 'ar' ? v.labelAr || v.label : v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pdp-about">
            <h3>{tr(lang, 'aboutItem')}</h3>
            <p>{desc}</p>
          </div>
        </div>

        {/* Amazon Buy Box */}
        <aside className="pdp-buybox">
          <div className="buybox-price">{formatMoney(activePrice)}</div>

          {product.isPrime ? (
            <div className="buybox-prime">
              <span className="prime-tag">
                <Check size={14} /> <strong>{tr(lang, 'primeBadge')}</strong>
              </span>
              <p>{tr(lang, 'freeDeliveryTomorrow')}</p>
            </div>
          ) : (
            <p className="buybox-std">
              <Truck size={15} /> {tr(lang, 'shippingStandard')}
            </p>
          )}

          <div className={`buybox-stock ${product.stock > 10 ? 'ok' : product.stock > 0 ? 'low' : 'out'}`}>
            {product.stock > 10
              ? tr(lang, 'inStock')
              : product.stock > 0
              ? `${tr(lang, 'lowStock')} ${product.stock}`
              : tr(lang, 'outOfStock')}
          </div>

          <div className="buybox-qty">
            <label htmlFor="pdp-qty">{tr(lang, 'qty')}</label>
            <select id="pdp-qty" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
              {Array.from({ length: Math.min(10, Math.max(1, product.stock)) }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <button
            id="pdp-add-cart"
            type="button"
            className="btn-amz-primary full"
            disabled={product.stock <= 0}
            onClick={() => addToCart(product, selectedVariant, qty, true)}
          >
            {tr(lang, 'addToCart')}
          </button>

          <button
            id="pdp-buy-now"
            type="button"
            className="btn-amz-cta full"
            disabled={product.stock <= 0}
            onClick={() => {
              addToCart(product, selectedVariant, qty, false);
              if (user) navigate('checkout');
              else setAuthOpen(true);
            }}
          >
            {tr(lang, 'buyNow')}
          </button>

          <button
            type="button"
            className="btn-amz-ghost full"
            onClick={() => void toggleWishlist(product.id)}
          >
            <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
            <span>{saved ? tr(lang, 'savedWishlist') : tr(lang, 'saveWishlist')}</span>
          </button>

          <div className="buybox-meta">
            <div>
              <span>{tr(lang, 'shipsFrom')}</span>
              <strong>MADAR Fulfillment</strong>
            </div>
            <div>
              <span>{tr(lang, 'soldBy')}</span>
              <strong>{product.brand} Official</strong>
            </div>
            <div className="secure-note">
              <Lock size={13} /> {tr(lang, 'secureTx')}
            </div>
          </div>
        </aside>
      </div>

      {/* Reviews Section */}
      <section className="pdp-reviews-section">
        <div className="reviews-summary">
          <h2>{tr(lang, 'reviewsTitle')}</h2>
          <div className="reviews-score-big">
            <Stars rating={product.ratingAvg} count={product.reviewCount} size={20} />
          </div>
          <div className="rating-bars">
            {breakdown.map((b) => {
              const pct = Math.round((b.count / totalReviews) * 100);
              return (
                <div key={b.stars} className="rating-bar-row">
                  <span>{b.stars} ★</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="bar-pct">{pct}%</span>
                </div>
              );
            })}
          </div>

          <form className="review-form" onSubmit={submitReview}>
            <h3>{tr(lang, 'writeReview')}</h3>
            {!user && <p className="review-login-hint">{tr(lang, 'signInToReview')}</p>}
            <div className="star-picker" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRevRating(s)} aria-label={`${s} stars`}>
                  <Star size={20} className={s <= revRating ? 'star-on' : 'star-off'} fill={s <= revRating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder={tr(lang, 'reviewTitlePh')}
              value={revTitle}
              onChange={(e) => setRevTitle(e.target.value)}
              required
            />
            <textarea
              rows={3}
              placeholder={tr(lang, 'reviewCommentPh')}
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              required
            />
            <button type="submit" className="btn-amz-primary" disabled={submitting}>
              {tr(lang, 'submitReview')}
            </button>
          </form>
        </div>

        <div className="reviews-list">
          {reviews.map((r) => (
            <article key={r.id} className="review-card">
              <div className="review-author">
                <div className="avatar">{r.userName.slice(0, 1).toUpperCase()}</div>
                <strong>{r.userName}</strong>
                {Boolean(r.verifiedPurchase) && (
                  <span className="verified-tag">
                    <ShieldCheck size={13} /> {tr(lang, 'verifiedPurchase')}
                  </span>
                )}
              </div>
              <div className="review-head">
                <Stars rating={r.rating} size={14} />
                <h4>{r.title}</h4>
              </div>
              <p>{r.comment}</p>
              <button type="button" className="helpful-btn" onClick={() => void voteHelpful(r.id)}>
                <ThumbsUp size={13} /> {tr(lang, 'helpful')} ({r.helpfulCount})
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
