/**
 * Multi-Project Management Store (User-Isolated & Secure)
 * يعزل المشاريع بالكامل لكل مستخدم بحيث لا يرى أي مستخدم جديد مشاريع مستخدم آخر أو مشاريع قديمة
 */

class ProjectsStore {
  constructor() {
    this.STORAGE_KEY_PROJECTS = "AI_PM_PROJECTS_LIST";
    this.STORAGE_KEY_ACTIVE_PREFIX = "AI_PM_ACTIVE_PROJECT_ID_";
  }

  // Get raw list of all projects in storage
  _getRawProjects() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY_PROJECTS)) || [];
    } catch {
      return [];
    }
  }

  _saveRawProjects(list) {
    localStorage.setItem(this.STORAGE_KEY_PROJECTS, JSON.stringify(list));
  }

  // Get projects strictly owned by the current logged-in user
  getAllProjects() {
    const all = this._getRawProjects();
    const user = window.authService?.getCurrentUser();
    if (!user || !user.id) {
      return [];
    }
    return all.filter(p => p.userId === user.id);
  }

  getActiveProjectId() {
    const user = window.authService?.getCurrentUser();
    if (!user || !user.id) return null;
    return localStorage.getItem(this.STORAGE_KEY_ACTIVE_PREFIX + user.id) || null;
  }

  setActiveProjectId(id) {
    const user = window.authService?.getCurrentUser();
    if (!user || !user.id) return;
    if (id) {
      localStorage.setItem(this.STORAGE_KEY_ACTIVE_PREFIX + user.id, id);
    } else {
      localStorage.removeItem(this.STORAGE_KEY_ACTIVE_PREFIX + user.id);
    }
  }

  getActiveProject() {
    const userProjects = this.getAllProjects();
    if (userProjects.length === 0) return null;
    const activeId = this.getActiveProjectId();
    const found = userProjects.find(p => p.id === activeId);
    if (found) return found;
    return userProjects[0] || null;
  }

  canCreateProject() {
    const user = window.authService?.getCurrentUser();
    const plan = window.authService?.getCurrentPlan();
    if (!user) return true;
    // Free trial user is allowed 1 project only
    if (plan && plan.id === "free") {
      const userProjects = this.getAllProjects();
      if (userProjects.length >= 1) {
        return false;
      }
    }
    return true;
  }

  createProject(projectData) {
    const all = this._getRawProjects();
    const user = window.authService?.getCurrentUser();
    const userId = user ? user.id : "usr-guest";
    
    const newProject = {
      id: `prj-${Date.now()}`,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: projectData
    };

    all.unshift(newProject);
    this._saveRawProjects(all);
    this.setActiveProjectId(newProject.id);
    return newProject;
  }

  loadDemoProject() {
    const demoData = window.SAMPLE_PROJECT_DATA || SAMPLE_PROJECT_DATA;
    return this.createProject(demoData);
  }

  updateProject(id, updatedProjectData) {
    const all = this._getRawProjects();
    const idx = all.findIndex(p => p.id === id);
    if (idx !== -1) {
      all[idx].data = updatedProjectData;
      all[idx].updatedAt = new Date().toISOString();
      this._saveRawProjects(all);
      return all[idx];
    }
    return null;
  }

  deleteProject(id) {
    let all = this._getRawProjects();
    all = all.filter(p => p.id !== id);
    this._saveRawProjects(all);
    
    const userProjects = this.getAllProjects();
    if (userProjects.length > 0) {
      this.setActiveProjectId(userProjects[0].id);
    } else {
      this.setActiveProjectId(null);
    }
    return userProjects;
  }

  clearCurrentUserProjects() {
    const user = window.authService?.getCurrentUser();
    if (!user || !user.id) return;
    
    let all = this._getRawProjects();
    all = all.filter(p => p.userId !== user.id);
    this._saveRawProjects(all);
    this.setActiveProjectId(null);
  }

  clearAllData() {
    localStorage.clear();
  }
}

window.projectsStore = new ProjectsStore();
