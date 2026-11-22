import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Truck, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { tr } from '../i18n';

export default function HeroBanner() {
  const { lang, setSelectedCategory, setDealsOnly } = useStore();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      image: '/images/hero-electronics.jpg',
      tag: tr(lang, 'heroTag1'),
      title: tr(lang, 'heroTitle1'),
      sub: tr(lang, 'heroSub1'),
      cta: tr(lang, 'heroCta1'),
      cat: 'electronics',
    },
    {
      image: '/images/hero-home.jpg',
      tag: tr(lang, 'heroTag2'),
      title: tr(lang, 'heroTitle2'),
      sub: tr(lang, 'heroSub2'),
      cta: tr(lang, 'heroCta2'),
      cat: 'smarthome',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const active = slides[slide];

  const quickCards = [
    {
      id: 'computers',
      titleAr: 'لابتوبات ولوحات مفاتيح احترافية',
      titleEn: 'Pro Laptops & Mechanical Gear',
      img: '/images/laptop.jpg',
      badgeAr: 'خصم يصل إلى 15%',
      badgeEn: 'Save up to 15%',
    },
    {
      id: 'audio',
      titleAr: 'سماعات عزل الضوضاء الفاخرة',
      titleEn: 'Studio ANC Headphones',
      img: '/images/headphones.jpg',
      badgeAr: 'عرض اليوم',
      badgeEn: "Today's Deal",
    },
    {
      id: 'smarthome',
      titleAr: 'القهوة المختصة والمنزل الذكي',
      titleEn: 'Espresso & Smart Living',
      img: '/images/espresso.jpg',
      badgeAr: 'توصيل برايم غداً',
      badgeEn: 'Prime Tomorrow',
    },
    {
      id: 'workspace',
      titleAr: 'شاشات Ultrawide وكراسي طبية',
      titleEn: 'Ultrawide Monitors & Seating',
      img: '/images/monitor.jpg',
      badgeAr: 'تجهيز المكتب',
      badgeEn: 'Workspace Upgrade',
    },
  ];

  return (
    <section className="hero-section" aria-label="Featured promotions">
      <div className="hero-stage">
        <img src={active.image} alt={active.title} className="hero-bg" />
        <div className="hero-scrim" />
        <div className="hero-content">
          <span className="hero-kicker">
            <Sparkles size={14} /> {active.tag}
          </span>
          <h1>{active.title}</h1>
          <p>{active.sub}</p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-amz-cta"
              onClick={() => {
                setDealsOnly(false);
                setSelectedCategory(active.cat);
              }}
            >
              {active.cta}
            </button>
            <div className="hero-perks">
              <span><Truck size={15} /> {tr(lang, 'primeDelivery')}</span>
              <span><ShieldCheck size={15} /> {tr(lang, 'secureTx')}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="hero-arrow prev"
          aria-label="Previous slide"
          onClick={() => setSlide((s) => (s + slides.length - 1) % slides.length)}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          className="hero-arrow next"
          aria-label="Next slide"
          onClick={() => setSlide((s) => (s + 1) % slides.length)}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Overlapping Amazon-style 4-card Quick Department Showcase */}
      <div className="hero-cards-grid">
        {quickCards.map((c) => (
          <button
            key={c.id}
            type="button"
            className="hero-dept-card"
            onClick={() => {
              setDealsOnly(false);
              setSelectedCategory(c.id);
              document.getElementById('catalog-top')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="hero-dept-head">
              <h3>{lang === 'ar' ? c.titleAr : c.titleEn}</h3>
              <span className="mini-tag">{lang === 'ar' ? c.badgeAr : c.badgeEn}</span>
            </div>
            <div className="hero-dept-img">
              <img src={c.img} alt={lang === 'ar' ? c.titleAr : c.titleEn} />
            </div>
            <span className="hero-dept-link">
              {lang === 'ar' ? 'تسوق القسم الآن ←' : 'Shop department →'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
