# MADAR | مَدار — Full-Stack Bilingual Marketplace

منصة تجارة إلكترونية متكاملة ثنائية اللغة (**عربي RTL + إنجليزي LTR**) مبنية بـ **React + TypeScript + Express + Node SQLite**.

## المميزات الأساسية
- واجهة متجر احترافية بهوية **MADAR | مَدار** وتبديل فوري بين العربية (`RTL`) والإنجليزية (`LTR`)
- بحث حي بالاقتراحات + فلاتر متقدمة (القسم، التقييم، السعر، برايم، عروض اليوم)
- صفحات تفاصيل المنتجات مع اختيار الألوان/المواصفات وصندوق الشراء وتقييمات العملاء
- سلة تسوق محفوظة + خطوات إتمام الطلب (`MADAR10` / `MADAR20`) + تتبع الشحنات بـ 5 مراحل
- لوحة البائع والإدارة (**Seller Studio**): إدارة المنتجات والمخزون وتحديث حالات الطلبات
- حسابات تجريبية مدمجة:
  - **عميل:** `customer@madar.store` / `Amazon123!`
  - **بائع أدمن:** `admin@madar.store` / `Admin123!`

## التشغيل محلياً
```bash
npm install
npm run build
npm start
# ثم افتح http://localhost:4000
```

## النشر الرسمي والحصول على رابط عام (Render / Railway / Docker)
1. ارفع المستودع إلى **GitHub**.
2. في [Render](https://render.com) اختر **New → Blueprint** واربط المستودع (سيقرأ `render.yaml` تلقائياً ويعطيك رابط `https://...` عام).
   أو في [Railway](https://railway.app) اختر **Deploy from GitHub Repo** (سيقرأ `Dockerfile` و `railway.json`).
