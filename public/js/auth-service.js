/**
 * Authentication & User Session Service
 * يدير تسجيل الدخول، إنشاء الحسابات، وجلسات المستخدمين لمدراء المشاريع
 */

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
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_USER)) || null;
    } catch {
      return null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  register(name, email, role = "Project Manager", company = "") {
    const users = this.getUsersDB();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    const userObj = {
      id: existing ? existing.id : `usr-${Date.now()}`,
      name: name.trim() || "مدير المشروع",
      email: email.trim().toLowerCase(),
      role: role || "Project Manager",
      company: company.trim() || "جهة هندسية",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
      plan: "Pro Tier (حساب نشط)",
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
      return this.register(name, email);
    }
    this.currentUser = user;
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY_USER);
  }
}

window.authService = new AuthService();
