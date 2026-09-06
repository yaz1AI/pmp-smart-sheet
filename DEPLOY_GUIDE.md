# 🚀 دليل نشر المنصة على الإنترنت مجاناً (Free Cloud Deployment Guide)

اتبع إحدى الطرق البسيطة التالية للحصول على رابط رسمي للمنصة (مثل `https://ai-pm-sheet.vercel.app`) ومشاركته مع الجميع:

---

## 🌟 الطريقة الأولى: النشر عبر Vercel (الأسهل والأسرع - مجاناً)

1. **ارفع المجلد على GitHub**:
   - افتح حسابك على [github.com](https://github.com) وأنشئ مستودعاً جديداً (New Repository) باسم `ai-pm-sheet`.
   - ارفع ملفات هذا المجلد إليه.

2. **الربط مع Vercel**:
   - توجه إلى [vercel.com](https://vercel.com) وسجل دخولك بحساب GitHub.
   - اضغط على **Add New Project** ثم اختر مستودع `ai-pm-sheet`.
   - في قسم **Environment Variables**، يمكنك إضافة:
     - `GEMINI_API_KEY`: مفتاح الـ API الخاص بك من Google AI Studio (اختياري).
   - اضغط **Deploy**.

3. **مبروك! 🎉**:
   - سيظهر لك رابط رسمي مباشر خلال دقيقة يمكنك فتحه ومشاركته مع أي شخص في العالم فوراً.

---

## 🌟 الطريقة الثانية: النشر عبر Render.com (مجاناً)

1. توجه إلى [render.com](https://render.com) وسجل حساباً جديداً.
2. اختر **New Web Service** واربطه بمستودع GitHub.
3. اضبط الإعدادات:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. اضغط **Create Web Service**، وستحصل على رابط حي ومجاني للمنصة.
