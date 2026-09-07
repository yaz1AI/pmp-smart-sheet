/**
 * Authentication & Subscription Service
 * يدير تسجيل الدخول، جلسات المستخدمين، وباقات الاشتراك الشهرية والسنوية
 */

const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "التجربة المجانية",
    nameEn: "Free Trial",
    badge: "FREE TRIAL 🌱",
    priceMonthly: 0,
    priceYearly: 0,
    maxProjects: 1,
    pdfExport: true,
    unlimitedCopilot: false,
    features: [
      "مشروع تجريبي كامل (1 Project)",
      "جدولة المهام اليومية PMP",
      "مصفوفة المشتريات والتوريدات",
      "إدارة التدفقات النقدية ومنحنى S-Curve",
      "تصدير ملفات Excel",
      "استشارات ذكية مع YAZ AI Copilot"
    ]
  },
  pro: {
    id: "pro",
    name: "الاشتراك الشامل",
    nameEn: "All-Access Pro Plan",
    badge: "PRO UNLIMITED ⭐",
    priceMonthly: 174,
    priceYearly: 174,
    maxProjects: 9999,
    pdfExport: true,
    unlimitedCopilot: true,
    fidicSupport: true,
    sCurve: true,
    customBranding: true,
    features: [
      "مشاريع هندسية غير محدودة",
      "دمج وتحليل عدة ملفات إكسل متزامنة",
      "إدارة التدفقات النقدية ومنحنى S-Curve",
      "تصدير تقارير PDF تنفيذية رسمية A4",
      "استشارات وتحليلات غير محدودة مع YAZ AI Copilot",
      "صياغة خطابات التمديد والمطالبات التعاقدية (FIDIC)",
      "تخصيص الشعار وهوية الشركة بالكامل",
      "دعم فني هندسي مستمر 24/7"
    ]
  }
};

class AuthService {
  constructor() {
    this.STORAGE_KEY_USER = "AI_PM_CURRENT_USER";
    this.STORAGE_KEY_USERS_DB = "AI_PM_USERS_DB";
    this.currentUser = this.loadCurrentUser();
  }

  getUsersDB() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_USERS_DB)) || [];
    } catch {
      return [];
    }
  }

  loadCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem(this.STORAGE_KEY_USER));
      if (user && !user.planId) {
        user.planId = "free";
        user.plan = SUBSCRIPTION_PLANS.free.name;
        user.planBadge = SUBSCRIPTION_PLANS.free.badge;
      }
      return user || null;
    } catch {
      return null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentPlan() {
    const planId = this.currentUser?.planId || "free";
    return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  register(name, email, role = "Project Manager", company = "", planId = "free") {
    const users = this.getUsersDB();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;

    const userObj = {
      id: existing ? existing.id : `usr-${Date.now()}`,
      name: name.trim() || "مدير المشروع",
      email: email.trim().toLowerCase(),
      role: role || "Project Manager",
      company: company.trim() || "جهة هندسية",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
      planId: plan.id,
      plan: plan.name,
      planBadge: plan.badge,
      billingCycle: "monthly",
      subscriptionStatus: "active",
      subscribedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    if (!existing) {
      users.push(userObj);
      localStorage.setItem(this.STORAGE_KEY_USERS_DB, JSON.stringify(users));
    }

    this.currentUser = userObj;
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(userObj));
    return userObj;
  }

  login(email) {
    const users = this.getUsersDB();
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      const name = email.split('@')[0] || "مدير المشروع";
      return this.register(name, email, "Project Manager", "", "free");
    }
    this.currentUser = user;
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  }

  upgradePlan(planId = "pro", billingCycle = "monthly", paymentMethod = "Mada") {
    if (!this.currentUser) {
      throw new Error("يرجى تسجيل الدخول أولاً للترقية");
    }

    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.pro;

    const days = 30; // Monthly billing
    this.currentUser.planId = plan.id;
    this.currentUser.plan = plan.name;
    this.currentUser.planBadge = plan.badge;
    this.currentUser.billingCycle = "monthly";
    this.currentUser.paymentMethod = paymentMethod;
    this.currentUser.subscriptionStatus = "active";
    this.currentUser.subscribedAt = new Date().toISOString();
    this.currentUser.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.currentUser));

    // Update in users DB
    const users = this.getUsersDB();
    const idx = users.findIndex(u => u.id === this.currentUser.id);
    if (idx !== -1) {
      users[idx] = this.currentUser;
      localStorage.setItem(this.STORAGE_KEY_USERS_DB, JSON.stringify(users));
    }

    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY_USER);
  }
}

window.SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS;
window.authService = new AuthService();
