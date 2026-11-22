import { db } from './db';
import { hashPassword } from './auth';

export function seedIfEmpty(): void {
  const userCount = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
  if (userCount > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, passwordHash, role, isPrime) VALUES (?, ?, ?, ?, ?)'
  );
  const adminRes = insertUser.run('Madar Seller Studio', 'admin@madar.store', hashPassword('Admin123!'), 'admin', 1);
  const custRes = insertUser.run('أحمد المنصور', 'customer@madar.store', hashPassword('Amazon123!'), 'customer', 1);

  const adminId = Number(adminRes.lastInsertRowid);
  const custId = Number(custRes.lastInsertRowid);

  const insertAddr = db.prepare(
    'INSERT INTO addresses (userId, label, fullName, phone, city, street, postalCode, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertAddr.run(custId, 'المنزل / Home', 'أحمد المنصور', '+962 79 555 0142', 'عمّان / Amman', 'شارع المدينة المنورة، مبنى 42', '11183', 1);
  insertAddr.run(custId, 'العمل / Office', 'أحمد المنصور', '+962 79 555 0142', 'عمّان / Amman', 'مجمع الملك حسين للأعمال، الطابق 4', '11855', 0);

  const products = [
    {
      slug: 'aether-anc-headphones',
      sku: 'MDR-AUD-101',
      titleEn: 'Aether Studio Pro Wireless ANC Over-Ear Headphones, 45H Battery & Spatial Audio',
      titleAr: 'سماعات إيثير ستوديو برو اللاسلكية بعزل الضوضاء النشط وبطارية 45 ساعة وصوت محيطي',
      brand: 'Aether Audio',
      category: 'audio',
      descriptionEn: 'Engineered with custom 40mm beryllium drivers, hybrid 48dB active noise cancellation, multipoint Bluetooth 5.4, and memory-foam lambskin earcups for studio-grade clarity all day.',
      descriptionAr: 'مصممة بمحركات 40 ملم عالية الدقة مع عزل ضوضاء نشط بقدرة 48 ديسيبل، وبلوتوث 5.4 متعدد الأجهزة، ووسائد أذن مريحة لوضوح صوتي فائق طوال اليوم.',
      specs: [
        { kEn: 'Driver Size', kAr: 'حجم المحرك', v: '40 mm Dynamic' },
        { kEn: 'Battery Life', kAr: 'عمر البطارية', v: '45 Hours (ANC On)' },
        { kEn: 'Connectivity', kAr: 'الاتصال', v: 'Bluetooth 5.4 / USB-C Lossless' },
        { kEn: 'Weight', kAr: 'الوزن', v: '248 g' },
      ],
      variants: [
        { label: 'Obsidian Bronze', labelAr: 'برونزي أسود', color: '#2b2927', priceDelta: 0 },
        { label: 'Arctic Silver', labelAr: 'فضي ثلجي', color: '#d5d9df', priceDelta: 0 },
        { label: 'Midnight Navy', labelAr: 'أزرق ليلي', color: '#1e2c45', priceDelta: 15 },
      ],
      price: 279.99,
      originalPrice: 349.99,
      stock: 42,
      image: '/images/headphones.jpg',
      isPrime: 1,
      isDeal: 1,
    },
    {
      slug: 'titanbook-14-pro',
      sku: 'MDR-CMP-202',
      titleEn: 'TitanBook 14 Pro Ultrabook Laptop — 14.2" 120Hz OLED, 32GB RAM, 1TB NVMe SSD',
      titleAr: 'لابتوب تايتان بوك 14 برو ألترا — شاشة 14.2 بوصة OLED بتردد 120Hz ورام 32GB وتخزين 1TB',
      brand: 'TitanTech',
      category: 'computers',
      descriptionEn: 'CNC-milled aerospace titanium unibody laptop delivering desktop-class creative and engineering throughput with whisper-quiet vapor chamber cooling and 18-hour battery endurance.',
      descriptionAr: 'جهاز محمول بهيكل تيتانيوم فائق النحافة مع تبريد متطور وبطارية تدوم حتى 18 ساعة وأداء احترافي للتصميم والبرمجة.',
      specs: [
        { kEn: 'Display', kAr: 'الشاشة', v: '14.2" 3K 120Hz OLED' },
        { kEn: 'Memory', kAr: 'الذاكرة العشوائية', v: '32 GB LPDDR5X' },
        { kEn: 'Storage', kAr: 'التخزين', v: '1 TB PCIe Gen4 NVMe' },
        { kEn: 'Ports', kAr: 'المنافذ', v: '2x Thunderbolt 4, HDMI 2.1, SD' },
      ],
      variants: [
        { label: '32GB / 1TB Titanium', labelAr: '32 جيجا / 1 تيرا تيتانيوم', color: '#a8adb5', priceDelta: 0 },
        { label: '64GB / 2TB Graphite', labelAr: '64 جيجا / 2 تيرا جرافيت', color: '#464a52', priceDelta: 350 },
      ],
      price: 1399.0,
      originalPrice: 1649.0,
      stock: 16,
      image: '/images/laptop.jpg',
      isPrime: 1,
      isDeal: 1,
    },
    {
      slug: 'chrono-apex-watch',
      sku: 'MDR-ELC-303',
      titleEn: 'Chrono Apex Titanium Smartwatch — Dual-Band GPS, Sapphire Glass, 14-Day Battery',
      titleAr: 'ساعة كرونو أبيكس تيتانيوم الذكية — نظام GPS مزدوج وزجاج ياقوتي وبطارية 14 يوماً',
      brand: 'Chrono',
      category: 'electronics',
      descriptionEn: 'Track heart rate variability, sleep recovery, elevation, and 100+ sports modes on a blazingly bright 2,000-nit sapphire AMOLED display built for athletes and everyday wear.',
      descriptionAr: 'تتبّع معدل نبض القلب وجودة النوم وأكثر من 100 وضع رياضي على شاشة AMOLED ساطعة محمية بزجاج ياقوتي مقاوم للخدش.',
      specs: [
        { kEn: 'Case Material', kAr: 'مادة الهيكل', v: 'Grade-5 Titanium (46mm)' },
        { kEn: 'Water Resistance', kAr: 'مقاومة الماء', v: '10 ATM (100m)' },
        { kEn: 'Battery Life', kAr: 'عمر البطارية', v: 'Up to 14 Days' },
      ],
      variants: [
        { label: 'Deep Navy Strap', labelAr: 'سوار أزرق داكن', color: '#263a57', priceDelta: 0 },
        { label: 'Titanium Link', labelAr: 'سوار تيتانيوم', color: '#9ca2aa', priceDelta: 60 },
      ],
      price: 329.0,
      originalPrice: 399.0,
      stock: 29,
      image: '/images/watch.jpg',
      isPrime: 1,
      isDeal: 0,
    },
    {
      slug: 'lumina-gfx-camera',
      sku: 'MDR-ELC-404',
      titleEn: 'Lumina X5 Mirrorless Full-Frame Camera Body + 35mm f/1.4 Prime Lens Kit',
      titleAr: 'كاميرا لومينا X5 الاحترافية كاملة الإطار مع عدسة 35mm f/1.4 للتصوير السينمائي',
      brand: 'Lumina Optics',
      category: 'electronics',
      descriptionEn: '45.7MP stacked BSI CMOS sensor with 8-stop in-body stabilization, 4K120 10-bit internal recording, and fast subject-tracking autofocus.',
      descriptionAr: 'مستشعر بدقة 45.7 ميجابكسل مع تثبيت داخلي بـ 8 درجات وتصوير فيديو 4K بمعدل 120 إطاراً وتركيز تلقائي فائق السرعة.',
      specs: [
        { kEn: 'Sensor', kAr: 'المستشعر', v: '45.7 MP Full-Frame BSI' },
        { kEn: 'Video', kAr: 'الفيديو', v: '4K 120p 10-bit 4:2:2' },
        { kEn: 'Included Lens', kAr: 'العدسة المرفقة', v: '35mm f/1.4 WR Prime' },
      ],
      variants: [
        { label: 'Body + 35mm Lens', labelAr: 'الكاميرا + عدسة 35mm', color: '#1b1d21', priceDelta: 0 },
        { label: 'Body Only', labelAr: 'الهيكل فقط', color: '#33373d', priceDelta: -450 },
      ],
      price: 1849.0,
      originalPrice: 2099.0,
      stock: 9,
      image: '/images/camera.jpg',
      isPrime: 1,
      isDeal: 0,
    },
    {
      slug: 'barista-precision-espresso',
      sku: 'MDR-HOM-505',
      titleEn: 'Barista Precision Dual-Boiler Stainless Espresso Machine with Conical Grinder',
      titleAr: 'ماكينة إسبريسو باريستا الاحترافية من الستانلس ستيل مع مطحنة مدمجة ومؤشر ضغط',
      brand: 'CremaCraft',
      category: 'smarthome',
      descriptionEn: 'PID-controlled 9-bar extraction, integrated 30-step conical burr grinder, walnut portafilter handle, and commercial microfoam steam wand.',
      descriptionAr: 'استخلاص بضغط 9 بار مع تحكم حراري دقيق ومطحنة مدمجة بـ 30 درجة طحن وفوهة تبخير احترافية.',
      specs: [
        { kEn: 'Pump Pressure', kAr: 'ضغط المضخة', v: '15 Bar Italian Pump (9 Bar OPV)' },
        { kEn: 'Heating System', kAr: 'نظام التسخين', v: 'PID Dual ThermoJet' },
        { kEn: 'Water Tank', kAr: 'خزان الماء', v: '2.2 L Removable' },
      ],
      variants: [
        { label: 'Brushed Steel', labelAr: 'ستانلس ستيل مصقول', color: '#b7bcc2', priceDelta: 0 },
        { label: 'Matte Black', labelAr: 'أسود مطفي', color: '#222428', priceDelta: 30 },
      ],
      price: 549.0,
      originalPrice: 699.0,
      stock: 14,
      image: '/images/espresso.jpg',
      isPrime: 1,
      isDeal: 1,
    },
    {
      slug: 'stride-aero-sneakers',
      sku: 'MDR-FSH-606',
      titleEn: 'Stride Aero Carbon-Plate Road Running Shoes — Breathable Knit & High-Rebound Foam',
      titleAr: 'حذاء الجري سترايد إيرو الرياضي بنعل كربون فائق الخفة وتهوية شبكية مريحة',
      brand: 'Stride Athletics',
      category: 'fashion',
      descriptionEn: 'Ultra-responsive dual-density midsole paired with engineered mesh upper for daily tempo miles, travel, and effortless all-day comfort.',
      descriptionAr: 'نعل أوسط عالي الارتداد مع جزء علوي شبكي جيد التهوية يمنحك ثباتاً وراحة استثنائية أثناء الجري أو الاستخدام اليومي.',
      specs: [
        { kEn: 'Drop', kAr: 'انحدار النعل', v: '8 mm' },
        { kEn: 'Weight', kAr: 'الوزن', v: '228 g (US 9)' },
        { kEn: 'Upper', kAr: 'الجزء العلوي', v: 'Engineered Breathable Mesh' },
      ],
      variants: [
        { label: 'Slate / Burnt Orange (42)', labelAr: 'رمادي برتقالي (42)', color: '#5c6b78', priceDelta: 0 },
        { label: 'Slate / Burnt Orange (43)', labelAr: 'رمادي برتقالي (43)', color: '#d86631', priceDelta: 0 },
        { label: 'Cloud White (44)', labelAr: 'أبيض سحابي (44)', color: '#ebecee', priceDelta: 0 },
      ],
      price: 118.5,
      originalPrice: 155.0,
      stock: 64,
      image: '/images/sneakers.jpg',
      isPrime: 1,
      isDeal: 1,
    },
    {
      slug: 'keyforge-75-mechanical',
      sku: 'MDR-CMP-707',
      titleEn: 'KeyForge 75% Gasket CNC Aluminum Mechanical Keyboard — Tri-Mode Wireless & Rotary Knob',
      titleAr: 'لوحة مفاتيح ميكانيكية كي فورج 75% بهيكل ألمنيوم لاسلكية ثلاثية الوضع ومفتاح تحكم',
      brand: 'KeyForge',
      category: 'computers',
      descriptionEn: 'Hot-swappable lubed linear switches, acoustic poron foam stack, PBT double-shot keycaps, and 4000mAh battery for effortless typing.',
      descriptionAr: 'مفاتيح خطية ناعمة قابلة للتبديل السريع مع عزل صوتي داخلي وأغطية PBT متينة وبطارية 4000 مللي أمبير.',
      specs: [
        { kEn: 'Layout', kAr: 'التصميم', v: '75% (82 Keys + Knob)' },
        { kEn: 'Connection', kAr: 'التوصيل', v: '2.4GHz / BT 5.3 / USB-C' },
        { kEn: 'Chassis', kAr: 'الهيكل', v: '6063 CNC Anodized Aluminum' },
      ],
      variants: [
        { label: 'Graphite Amber (Linear)', labelAr: 'جرافيت كهرماني (خطي)', color: '#d0903a', priceDelta: 0 },
        { label: 'Graphite Amber (Tactile)', labelAr: 'جرافيت كهرماني (لمسي)', color: '#3b3e42', priceDelta: 10 },
      ],
      price: 149.0,
      originalPrice: 189.0,
      stock: 37,
      image: '/images/keyboard.jpg',
      isPrime: 1,
      isDeal: 0,
    },
    {
      slug: 'nomad-tech-backpack',
      sku: 'MDR-FSH-808',
      titleEn: 'Nomad 26L Weatherproof Tech Commuter Backpack — Fits 16" Laptop & TSA Carry-On Ready',
      titleAr: 'حقيبة ظهر نوماد 26 لتر مقاومة للماء للسفر والتقنية — تتسع للابتوب 16 بوصة',
      brand: 'Nomad Carry',
      category: 'fashion',
      descriptionEn: 'Ballistic carbonate-coated nylon exterior, suspended velvet laptop vault, hidden passport pocket, and luggage pass-through.',
      descriptionAr: 'نايلون متين مقاوم للأمطار مع جيب مبطن لحماية اللابتوب حتى 16 بوصة ومساحات تنظيم ذكية للسفر.',
      specs: [
        { kEn: 'Capacity', kAr: 'السعة', v: '26 Liters' },
        { kEn: 'Laptop Sleeve', kAr: 'جيب اللابتوب', v: 'Up to 16 inches' },
        { kEn: 'Material', kAr: 'الخامة', v: '840D Carbonate Ballistic Nylon' },
      ],
      variants: [
        { label: 'Matte Charcoal', labelAr: 'فحمي مطفي', color: '#33363b', priceDelta: 0 },
        { label: 'Olive Slate', labelAr: 'زيتوني داكن', color: '#454e45', priceDelta: 5 },
      ],
      price: 94.99,
      originalPrice: 129.99,
      stock: 51,
      image: '/images/backpack.jpg',
      isPrime: 1,
      isDeal: 1,
    },
    {
      slug: 'horizon-34-ultrawide',
      sku: 'MDR-CMP-909',
      titleEn: 'Horizon 34" Curved Ultrawide QHD 165Hz USB-C Hub Monitor (90W Power Delivery)',
      titleAr: 'شاشة هورايزن 34 بوصة منحنية فائقة الاتساع QHD بتردد 165Hz ومنفذ USB-C بقدرة 90 واط',
      brand: 'Horizon Display',
      category: 'workspace',
      descriptionEn: 'Immersive 1500R curvature, 99% DCI-P3 factory-calibrated color accuracy, built-in KVM switch, and single-cable 90W laptop charging.',
      descriptionAr: 'انحناء 1500R مريح للعين ودقة ألوان احترافية 99% DCI-P3 مع موزع USB-C مدمج يشحن اللابتوب بكابل واحد.',
      specs: [
        { kEn: 'Resolution', kAr: 'الدقة', v: '3440 × 1440 UWQHD' },
        { kEn: 'Refresh Rate', kAr: 'معدل التحديث', v: '165 Hz / 1 ms' },
        { kEn: 'USB-C PD', kAr: 'شحن USB-C', v: '90 W + Built-in KVM' },
      ],
      variants: [
        { label: '34" 165Hz Standard', labelAr: '34 بوصة 165Hz', color: '#1f2329', priceDelta: 0 },
        { label: '34" 240Hz OLED', labelAr: '34 بوصة 240Hz OLED', color: '#111419', priceDelta: 320 },
      ],
      price: 499.0,
      originalPrice: 649.0,
      stock: 12,
      image: '/images/monitor.jpg',
      isPrime: 1,
      isDeal: 1,
    },
    {
      slug: 'ergospine-mesh-chair',
      sku: 'MDR-WKS-1010',
      titleEn: 'ErgoSpine Pro Breathable Mesh Executive Office Chair with 4D Arms & Adaptive Lumbar',
      titleAr: 'كرسي المكتب الطبي إيرجو سباين شبكي متطور مع دعم قطني ديناميكي ومساند ذراع 4D',
      brand: 'ErgoSpine',
      category: 'workspace',
      descriptionEn: 'Self-adjusting dynamic lumbar support, breathable elastomer mesh, synchronized 135° recline lock, and cast aluminum 5-star base.',
      descriptionAr: 'دعم قطني يتكيف تلقائياً مع حركة الظهر وشبكة تهوية مرنة وإمالة متزامنة حتى 135 درجة لراحة العمل الطويل.',
      specs: [
        { kEn: 'Frame', kAr: 'الهيكل', v: 'Die-Cast Aluminum Alloy' },
        { kEn: 'Weight Capacity', kAr: 'أقصى وزن', v: '150 kg' },
        { kEn: 'Warranty', kAr: 'الضمان', v: '5 Years' },
      ],
      variants: [
        { label: 'Obsidian Mesh + Headrest', labelAr: 'أسود شبكي + مسند رأس', color: '#24272c', priceDelta: 0 },
      ],
      price: 389.0,
      originalPrice: 489.0,
      stock: 19,
      image: '/images/chair.jpg',
      isPrime: 0,
      isDeal: 0,
    },
    {
      slug: 'aura-smart-speaker',
      sku: 'MDR-HOM-1111',
      titleEn: 'Aura Studio 360° Smart Home Speaker with Spatial Room Tuning & Voice Assistant',
      titleAr: 'مكبر الصوت الذكي أورا ستوديو 360 درجة مع معايرة تلقائية للغرفة ومساعد صوتي',
      brand: 'Aura Home',
      category: 'smarthome',
      descriptionEn: 'Rich room-filling 360-degree acoustics powered by a dedicated upward-firing woofer, 5-mic far-field array, and Matter smart-home hub.',
      descriptionAr: 'صوت محيطي بزاوية 360 درجة مع مضخم صوت مدمج وميكروفونات بعيدة المدى للتحكم الكامل بأجهزة المنزل الذكي.',
      specs: [
        { kEn: 'Audio', kAr: 'الصوت', v: '360° Spatial + 3.5" Woofer' },
        { kEn: 'Smart Hub', kAr: 'البيت الذكي', v: 'Matter, Thread & Zigbee' },
        { kEn: 'Wi-Fi', kAr: 'الواي فاي', v: 'Wi-Fi 6 Dual Band' },
      ],
      variants: [
        { label: 'Charcoal Fabric', labelAr: 'قماش فحمي', color: '#3a3b3e', priceDelta: 0 },
        { label: 'Sandstone', labelAr: 'رملي دافئ', color: '#c4b8a8', priceDelta: 0 },
      ],
      price: 129.0,
      originalPrice: 169.0,
      stock: 48,
      image: '/images/speaker.jpg',
      isPrime: 1,
      isDeal: 1,
    },
    {
      slug: 'canvas-tab-12-pro',
      sku: 'MDR-ELC-1212',
      titleEn: 'Canvas Tab 12.9" Pro Tablet + Magnetic Stylus — 120Hz Tandem OLED, 256GB Wi-Fi 6E',
      titleAr: 'جهاز لوحي كانفاس تاب 12.9 بوصة برو مع قلم مغناطيسي — شاشة 120Hz OLED وتخزين 256GB',
      brand: 'Canvas Computing',
      category: 'electronics',
      descriptionEn: 'Featherweight 5.3mm aluminum slate with low-latency 4096-level magnetic stylus included, anti-reflective glass, and quad studio speakers.',
      descriptionAr: 'جهاز لوحي فائق النحافة بسماكة 5.3 ملم يأتي مع قلم مغناطيسي عالي الدقة وأربعة مكبرات صوت ستيريو.',
      specs: [
        { kEn: 'Display', kAr: 'الشاشة', v: '12.9" 120Hz Tandem OLED' },
        { kEn: 'Included', kAr: 'المرفقات', v: 'Magnetic Stylus Pen' },
        { kEn: 'Storage', kAr: 'السعة', v: '256 GB' },
      ],
      variants: [
        { label: '256GB Space Silver', labelAr: '256 جيجا فضي', color: '#b9bec7', priceDelta: 0 },
        { label: '512GB Space Silver', labelAr: '512 جيجا فضي', color: '#8e95a2', priceDelta: 180 },
      ],
      price: 749.0,
      originalPrice: 849.0,
      stock: 23,
      image: '/images/tablet.jpg',
      isPrime: 1,
      isDeal: 0,
    },
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (
      slug, sku, titleEn, titleAr, brand, category, descriptionEn, descriptionAr,
      specsJson, variantsJson, price, originalPrice, stock, image, isPrime, isDeal,
      ratingAvg, reviewCount, sellerId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (productId, userId, userName, rating, title, comment, verifiedPurchase, helpfulCount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleReviews = [
    { name: 'سارة الخطيب', rating: 5, title: 'جودة ممتازة وتوصيل سريع جداً', comment: 'المنتج أصلي ومطابق للوصف تماماً، التغليف ممتاز ووصل خلال أقل من 24 ساعة عبر برايم.' },
    { name: 'Daniel Carter', rating: 5, title: 'Worth every penny — exceeds expectations', comment: 'Build quality feels flagship-grade straight out of the box. Battery and performance are rock solid.' },
    { name: 'ليث العتيبي', rating: 4, title: 'أداء رائع وسعر منافس', comment: 'استخدمته لمدة أسبوعين يومياً والنتائج ممتازة، أنصح به بشدة مقارنة بالمنافسين.' },
  ];

  const prodIds: number[] = [];
  for (const p of products) {
    const res = insertProd.run(
      p.slug, p.sku, p.titleEn, p.titleAr, p.brand, p.category, p.descriptionEn, p.descriptionAr,
      JSON.stringify(p.specs), JSON.stringify(p.variants),
      p.price, p.originalPrice, p.stock, p.image, p.isPrime, p.isDeal,
      4.7, sampleReviews.length, adminId
    );
    const pid = Number(res.lastInsertRowid);
    prodIds.push(pid);
    for (const r of sampleReviews) {
      insertReview.run(pid, custId, r.name, r.rating, r.title, r.comment, 1, Math.floor(Math.random() * 18) + 2);
    }
    const avgRow = db.prepare('SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE productId = ?').get(pid) as { avg: number; cnt: number };
    db.prepare('UPDATE products SET ratingAvg = ?, reviewCount = ? WHERE id = ?').run(Number(avgRow.avg.toFixed(2)), avgRow.cnt, pid);
  }

  // Seed 1 sample order + wishlist items for customer@madar.store so Order Tracking & Wishlist are immediately populated
  db.prepare('INSERT INTO wishlist (userId, productId) VALUES (?, ?)').run(custId, prodIds[0]);
  db.prepare('INSERT INTO wishlist (userId, productId) VALUES (?, ?)').run(custId, prodIds[4]);

  const addrSnapshot = JSON.stringify({
    label: 'المنزل / Home',
    fullName: 'أحمد المنصور',
    phone: '+962 79 555 0142',
    city: 'عمّان / Amman',
    street: 'شارع المدينة المنورة، مبنى 42',
    postalCode: '11183',
  });
  const ordRes = db.prepare(`
    INSERT INTO orders (
      orderNumber, userId, status, paymentMethod, shippingSpeed, addressSnapshotJson,
      promoCode, subtotal, shippingCost, tax, discount, total, trackingCode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'MDR-2026-841920', custId, 'shipped', 'Visa •••• 4242', 'prime', addrSnapshot,
    null, 428.99, 0, 34.32, 0, 463.31, 'TRK-MDR-992841JO'
  );
  const ordId = Number(ordRes.lastInsertRowid);
  const insertItem = db.prepare(
    'INSERT INTO order_items (orderId, productId, titleEn, titleAr, image, variantLabel, unitPrice, qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertItem.run(ordId, prodIds[0], products[0].titleEn, products[0].titleAr, products[0].image, 'Obsidian Bronze', 279.99, 1);
  insertItem.run(ordId, prodIds[6], products[6].titleEn, products[6].titleAr, products[6].image, 'Graphite Amber (Linear)', 149.0, 1);
}
