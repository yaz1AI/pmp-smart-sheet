/**
 * Optional Supabase bridge.
 * Local storage remains the source of truth until a user completes Supabase
 * authentication. This prevents project data being sent to a cloud account by
 * accident and keeps the app usable offline.
 */
class CloudService {
  constructor() {
    this.config = null;
    this.sessionKey = 'AI_PM_SUPABASE_SESSION';
    this.ready = this.init();
  }

  async init() {
    const publicFallback = {
      enabled: true,
      url: 'https://ojeovbqyfaorxtnofrtx.supabase.co',
      // Publishable keys are intended for browser use; RLS policies protect the data.
      anonKey: 'sb_publishable_y-1B1pnIrQxQiNZCHt9hLw_pRZkAlwI'
    };
    try {
      const response = await fetch('/api/cloud/config');
      const serverConfig = response.ok ? await response.json() : null;
      this.config = serverConfig?.enabled ? serverConfig : publicFallback;
    } catch (_) {
      this.config = publicFallback;
    }
    this.captureSessionFromRedirect();
    window.dispatchEvent(new CustomEvent('cloud-status-changed', { detail: this.getStatus() }));
    return this.config;
  }

  captureSessionFromRedirect() {
    // Supabase magic links return tokens in the URL fragment. Remove them from
    // the address bar immediately after storing the session locally.
    const params = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
    const accessToken = params.get('access_token');
    if (!accessToken) return false;
    localStorage.setItem(this.sessionKey, JSON.stringify({
      access_token: accessToken,
      refresh_token: params.get('refresh_token') || null,
      expires_at: params.get('expires_at') || null
    }));
    history.replaceState({}, document.title, `${location.pathname}${location.search}`);
    setTimeout(() => this.syncAllLocalProjects(), 0);
    return true;
  }

  getSession() {
    try { return JSON.parse(localStorage.getItem(this.sessionKey)) || null; } catch (_) { return null; }
  }

  getStatus() {
    const session = this.getSession();
    return {
      configured: Boolean(this.config?.enabled),
      connected: Boolean(session?.access_token),
      label: !this.config?.enabled ? 'تخزين محلي' : (session?.access_token ? 'مزامنة سحابية مفعّلة' : 'Supabase جاهز للربط')
    };
  }

  async sendMagicLink(email) {
    await this.ready;
    if (!this.config?.enabled) throw new Error('أضف SUPABASE_URL وSUPABASE_ANON_KEY أولاً لتفعيل الحسابات السحابية.');
    const response = await fetch(`${this.config.url}/auth/v1/otp`, {
      method: 'POST',
      headers: { apikey: this.config.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, create_user: true, options: { emailRedirectTo: `${location.origin}/index.html` } })
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(detail?.msg || detail?.message || 'تعذر إرسال رابط الدخول.');
    }
    return true;
  }

  async syncProject(project) {
    await this.ready;
    const session = this.getSession();
    if (!this.config?.enabled || !session?.access_token || !project) return false;
    const payload = {
      id: project.id,
      project_name: project.data?.projectInfo?.nameAr || project.data?.projectInfo?.nameEn || 'مشروع بدون اسم',
      project_data: project.data || {},
      updated_at: project.updatedAt || new Date().toISOString()
    };
    const response = await fetch(`${this.config.url}/rest/v1/projects?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: this.config.anonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  }

  notifyLocalChange(project) {
    this.syncProject(project).catch(() => {});
  }

  async syncAllLocalProjects() {
    const projects = window.projectsStore?.getAllProjects?.() || [];
    await Promise.all(projects.map(project => this.syncProject(project)));
    window.dispatchEvent(new CustomEvent('cloud-status-changed', { detail: this.getStatus() }));
  }
}

window.cloudService = new CloudService();
