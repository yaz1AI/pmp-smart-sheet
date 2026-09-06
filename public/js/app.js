/**
 * AI PM Smart Sheet - Main Application Controller (Clean Multi-Project & Empty State Engine)
 */

// Application State
let activeProjectRecord = window.projectsStore ? window.projectsStore.getActiveProject() : null;
let currentProject = activeProjectRecord ? activeProjectRecord.data : null;
let scheduler = currentProject ? new PMTaskScheduler(currentProject) : null;
let activeTab = currentProject ? "daily" : "upload"; // Default to 'upload' if no project exists!
let selectedDate = new Date().toISOString().split('T')[0];
let filters = {
  phase: "all",
  owner: "all",
  priority: "all",
  status: "all",
  search: ""
};

const geminiService = new GeminiPMService();

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderUserBadge();
  refreshAppState();
  initTabs();
  initDateControls();
  initFilterControls();
  initUploadHandlers();
  initSettingsModal();
  initAuthModals();
  initNewProjectModal();
  initShareModal();
});

function refreshAppState() {
  activeProjectRecord = window.projectsStore ? window.projectsStore.getActiveProject() : null;
  currentProject = activeProjectRecord ? activeProjectRecord.data : null;
  scheduler = currentProject ? new PMTaskScheduler(currentProject) : null;

  renderProjectSelector();

  const headerBanner = document.getElementById("project-header-banner");
  const projectTabsBar = document.getElementById("project-tabs-bar");
  
  // Project specific tabs to toggle
  const projectTabButtons = document.querySelectorAll(".project-specific-tab");

  if (!currentProject) {
    // NO PROJECT LOADED: Hide active project banner and hide project tabs
    if (headerBanner) headerBanner.classList.add("hidden");
    projectTabButtons.forEach(btn => btn.classList.add("hidden"));
    
    // Switch to upload welcome screen
    activeTab = "upload";
    switchTab("upload");
  } else {
    // PROJECT EXISTS: Show header and reveal all smart sheet tabs
    if (headerBanner) headerBanner.classList.remove("hidden");
    projectTabButtons.forEach(btn => btn.classList.remove("hidden"));

    selectedDate = currentProject.projectInfo?.startDate || new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("daily-date-picker");
    if (dateInput) dateInput.value = selectedDate;

    renderProjectHeader();
    renderKPIs();
    renderCurrentTab();
  }
}

// 1. User Badge & Profile
function renderUserBadge() {
  const user = window.authService?.getCurrentUser();
  const container = document.getElementById("user-profile-badge");
  if (!container) return;

  if (user) {
    container.innerHTML = `
      <div class="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 py-1 px-3 rounded-xl cursor-pointer transition" id="btn-user-menu">
        <img src="${user.avatar}" class="w-7 h-7 rounded-full bg-blue-500 border border-white shadow-sm" alt="${user.name}">
        <div class="text-right hidden sm:block">
          <div class="text-xs font-bold text-slate-800 leading-tight">${user.name}</div>
          <div class="text-[10px] text-blue-600 font-semibold leading-tight">${user.role}</div>
        </div>
        <span class="text-xs text-slate-400">▾</span>
      </div>
      <!-- User Dropdown Menu -->
      <div id="user-dropdown" class="hidden absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 text-right text-xs">
        <div class="p-2 border-b border-slate-100">
          <div class="font-bold text-slate-800">${user.name}</div>
          <div class="text-slate-400 text-[11px]">${user.email}</div>
          <span class="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">${user.plan}</span>
        </div>
        <button onclick="switchTab('projects')" class="w-full text-right p-2 hover:bg-slate-50 rounded-lg font-bold text-slate-700 flex items-center justify-between">
          <span>📁 لوحة مشاريعي</span>
          <span class="text-xs">📂</span>
        </button>
        <button onclick="switchTab('upload')" class="w-full text-right p-2 hover:bg-slate-50 rounded-lg font-bold text-slate-700 flex items-center justify-between">
          <span>➕ رفع مشروع جديد</span>
          <span class="text-xs">📤</span>
        </button>
        <button onclick="handleClearAllUserProjects()" class="w-full text-right p-2 hover:bg-amber-50 text-amber-700 rounded-lg font-bold flex items-center justify-between">
          <span>🗑️ مسح مشاريعي (البدء من الصفر)</span>
          <span class="text-xs">🧹</span>
        </button>
        <button onclick="handleLogout()" class="w-full text-right p-2 hover:bg-red-50 text-red-600 rounded-lg font-bold flex items-center justify-between mt-1 border-t border-slate-100">
          <span>🚪 تسجيل الخروج</span>
          <span class="text-xs">✕</span>
        </button>
      </div>
    `;

    document.getElementById("btn-user-menu")?.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("user-dropdown")?.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      document.getElementById("user-dropdown")?.classList.add("hidden");
    });
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm">
        👤 تسجيل الدخول
      </button>
    `;
  }
}

function handleClearAllUserProjects() {
  if (confirm("هل تريد مسح جميع مشاريعك والبدء من الصفر بشاشة نظيفة؟")) {
    window.projectsStore?.clearCurrentUserProjects();
    refreshAppState();
    alert("✅ تم مسح المشاريع بنجاح. يمكنك الآن رفع أول ملف لك!");
  }
}

// 2. Project Switcher Dropdown in Top Bar
function renderProjectSelector() {
  const select = document.getElementById("project-select-dropdown");
  if (!select) return;

  const projects = window.projectsStore?.getAllProjects() || [];
  const activeId = window.projectsStore?.getActiveProjectId();

  if (projects.length === 0) {
    select.innerHTML = `<option value="">(لا يوجد مشروع نشط)</option>`;
    select.disabled = true;
    return;
  }

  select.disabled = false;
  select.innerHTML = projects.map(p => `
    <option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>
      ${p.data.projectInfo.projectNameAr || p.data.projectInfo.projectName}
    </option>
  `).join('');

  select.onchange = (e) => {
    switchActiveProject(e.target.value);
  };
}

function switchActiveProject(projectId) {
  window.projectsStore?.setActiveProjectId(projectId);
  refreshAppState();
}

// 3. Render Project Header
function renderProjectHeader() {
  if (!currentProject) return;
  const info = currentProject.projectInfo;
  document.getElementById("project-title").innerText = info.projectNameAr || info.projectName;
  document.getElementById("project-subtitle").innerText = `${info.projectName} | عقد رقم: ${info.projectNumber || 'N/A'}`;
  document.getElementById("client-contractor").innerText = `العميل: ${info.client || 'N/A'} | المقاول: ${info.contractor || 'N/A'}`;
  document.getElementById("project-dates").innerText = `📅 ${info.startDate} إلى ${info.finishDate} (${info.totalScheduleDays || 365} يوماً)`;
}

// 4. Render KPIs
function renderKPIs() {
  if (!scheduler) return;
  const kpis = scheduler.getProjectKPIs();
  document.getElementById("kpi-total").innerText = kpis.totalTasks;
  document.getElementById("kpi-completed").innerText = kpis.completedTasks;
  document.getElementById("kpi-inprogress").innerText = kpis.inProgressTasks;
  document.getElementById("kpi-pending").innerText = kpis.pendingTasks;
  document.getElementById("kpi-critical").innerText = kpis.criticalTasks;
  document.getElementById("kpi-progress-bar").style.width = `${kpis.completionRate}%`;
  document.getElementById("kpi-progress-text").innerText = `${kpis.completionRate}%`;
}

// 5. Tab Switching
function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  activeTab = tabName;
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(b => {
    const isActive = b.dataset.tab === activeTab;
    b.classList.toggle("active", isActive);
  });
  renderCurrentTab();
}

function renderCurrentTab() {
  const sections = ["projects", "daily", "grid", "mts", "milestones", "actions", "upload"];
  sections.forEach(s => {
    const el = document.getElementById(`tab-content-${s}`);
    if (el) el.classList.toggle("hidden", s !== activeTab);
  });

  if (activeTab === "projects") renderProjectsDashboard();
  else if (activeTab === "daily") renderDailyView();
  else if (activeTab === "grid") renderGridView();
  else if (activeTab === "mts") renderMTSView();
  else if (activeTab === "milestones") renderMilestonesView();
  else if (activeTab === "actions") renderActionsView();
}

// 6. MY PROJECTS DASHBOARD TAB
function renderProjectsDashboard() {
  const container = document.getElementById("projects-grid-container");
  if (!container) return;

  const projects = window.projectsStore?.getAllProjects() || [];
  const activeId = window.projectsStore?.getActiveProjectId();

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-zinc-300 space-y-4 shadow-sm">
        <div class="w-16 h-16 bg-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-zinc-200">📁</div>
        <h3 class="text-lg font-black text-zinc-950">ليس لديك أي مشروع محفوظ حالياً</h3>
        <p class="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
          ابدأ برفع ملف مشروعك الأول (PDF / Word / Excel) ليقوم المحلل الذكي بدراسته وبناء خطة المهام اليومية وجداول المشتريات.
        </p>
        <div class="flex flex-wrap justify-center gap-3 pt-2">
          <button onclick="switchTab('upload')" class="px-5 py-2.5 bg-zinc-950 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm">
            ➕ رفع ملف مشروعي الأول
          </button>
          <button onclick="handleLoadDemoProject()" class="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition">
            📂 تجربة نموذج استعراضي
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map(p => {
    const info = p.data.projectInfo;
    const tempScheduler = new PMTaskScheduler(p.data);
    const kpis = tempScheduler.getProjectKPIs();
    const isActive = p.id === activeId;

    return `
      <div class="bg-white rounded-2xl border ${isActive ? 'border-2 border-zinc-950 shadow-md ring-1 ring-zinc-900/10' : 'border-zinc-200/80 shadow-sm'} p-6 flex flex-col justify-between hover:shadow-md transition relative">
        ${isActive ? `
          <div class="absolute -top-3 right-6 bg-zinc-950 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow border border-amber-400/20">
            المشروع النشط حالياً
          </div>
        ` : ''}

        <div>
          <div class="flex justify-between items-start gap-3 mb-3">
            <div>
              <span class="text-xs font-mono font-bold text-zinc-400">${info.projectNumber || 'PRJ'}</span>
              <h3 class="text-lg font-black text-zinc-950 leading-snug">${info.projectNameAr || info.projectName}</h3>
              <p class="text-xs text-zinc-400 font-mono">${info.projectName}</p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
              ${info.status || 'Active'}
            </span>
          </div>

          <p class="text-xs text-zinc-600 mb-4 line-clamp-2 leading-relaxed">${info.description || 'مشروع هندسي مجدول بالذكاء الاصطناعي'}</p>

          <div class="space-y-2 text-xs text-zinc-600 bg-zinc-50 p-3.5 rounded-xl mb-4 border border-zinc-100">
            <div class="flex justify-between">
              <span class="text-zinc-400">العميل / المالك:</span>
              <strong class="text-zinc-900">${info.client || 'N/A'}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-400">المقاول المنفذ:</span>
              <strong class="text-zinc-900">${info.contractor || 'N/A'}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-400">المدة الزمنية:</span>
              <strong class="text-zinc-900">${info.startDate} ⬅ ${info.finishDate} (${info.totalScheduleDays || 365} يوم)</strong>
            </div>
          </div>

          <!-- Progress -->
          <div class="mb-4">
            <div class="flex justify-between text-xs font-bold mb-1">
              <span class="text-zinc-500">نسبة الإنجاز المخططة:</span>
              <span class="text-zinc-950 font-black">${kpis.completionRate}%</span>
            </div>
            <div class="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
              <div class="bg-zinc-950 h-full rounded-full transition-all" style="width: ${kpis.completionRate}%"></div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center text-xs mb-4">
            <div class="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
              <div class="font-black text-zinc-950 text-sm">${kpis.totalTasks}</div>
              <div class="text-[10px] text-zinc-400">إجمالي المهام</div>
            </div>
            <div class="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
              <div class="font-black text-emerald-700 text-sm">${kpis.completedTasks}</div>
              <div class="text-[10px] text-emerald-800">مكتملة</div>
            </div>
            <div class="bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
              <div class="font-black text-rose-700 text-sm">${kpis.criticalTasks}</div>
              <div class="text-[10px] text-rose-800">حرجة</div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-3 border-t border-zinc-100">
          <button onclick="handleSelectProject('${p.id}')" class="flex-1 py-2 px-3 bg-zinc-950 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm">
            ⚡ فتح الشيت الذكي
          </button>
          <button onclick="exportSingleProject('${p.id}')" class="p-2 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-700 rounded-xl text-xs font-bold transition border border-zinc-200" title="تصدير Excel">
            📊
          </button>
          <button onclick="handleDeleteProject('${p.id}')" class="p-2 bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 text-zinc-400 rounded-xl text-xs font-bold transition border border-zinc-200" title="حذف المشروع">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function handleLoadDemoProject() {
  window.projectsStore?.loadDemoProject();
  refreshAppState();
  switchTab("daily");
  alert("✅ تم تحميل المشروع التجريبي الاستعراضي بنجاح!");
}

function handleSelectProject(id) {
  switchActiveProject(id);
  switchTab("daily");
}

function exportSingleProject(id) {
  const p = window.projectsStore.getAllProjects().find(x => x.id === id);
  if (p) {
    const tempSched = new PMTaskScheduler(p.data);
    PMExcelExporter.exportProjectWorkbook(p.data, tempSched);
  }
}

function handleDeleteProject(id) {
  if (confirm("هل أنت متأكد من رغبتك في حذف هذا المشروع؟")) {
    try {
      window.projectsStore.deleteProject(id);
      refreshAppState();
      renderProjectsDashboard();
      alert("✅ تم حذف المشروع بنجاح");
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }
}

// 7. Date Controls for Daily View
function initDateControls() {
  const dateInput = document.getElementById("daily-date-picker");
  if (dateInput) {
    dateInput.value = selectedDate;
    dateInput.addEventListener("change", (e) => {
      selectedDate = e.target.value;
      renderDailyView();
    });
  }

  document.getElementById("btn-prev-day")?.addEventListener("click", () => shiftDate(-1));
  document.getElementById("btn-next-day")?.addEventListener("click", () => shiftDate(1));
  document.getElementById("btn-today")?.addEventListener("click", () => {
    const todayStr = new Date().toISOString().split('T')[0];
    selectedDate = todayStr;
    if (dateInput) dateInput.value = selectedDate;
    renderDailyView();
  });
}

function shiftDate(deltaDays) {
  const d = new Date(selectedDate);
  d.setDate(d.getDate() + deltaDays);
  selectedDate = d.toISOString().split('T')[0];
  const dateInput = document.getElementById("daily-date-picker");
  if (dateInput) dateInput.value = selectedDate;
  renderDailyView();
}

// 8. Daily View Render
function renderDailyView() {
  const container = document.getElementById("daily-tasks-list");
  const dateHeader = document.getElementById("daily-selected-date-display");
  if (!container || !scheduler) return;

  const d = new Date(selectedDate);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateHeader.innerText = `جدول مهام يوم: ${d.toLocaleDateString('ar-SA', options)} (${selectedDate})`;

  let tasks = scheduler.getTasksForDate(selectedDate);

  if (tasks.length === 0) {
    const all = scheduler.getAllTasks();
    const upcoming = all.filter(t => t.date >= selectedDate).slice(0, 5);
    
    container.innerHTML = `
      <div class="p-8 text-center bg-white rounded-2xl border border-dashed border-zinc-300 shadow-sm">
        <div class="text-4xl mb-3">☕</div>
        <h3 class="text-base font-bold text-zinc-800 mb-1">لا توجد مهام مجدولة بالتحديد في تاريخ ${selectedDate}</h3>
        <p class="text-xs text-zinc-500 mb-4">يمكنك إضافة مهمة جديدة لهذا اليوم أو استعراض أقرب المهام القادمة أدناه:</p>
        <button onclick="openAddTaskModal('${selectedDate}')" class="px-4 py-2 bg-zinc-950 hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm transition">
          ➕ إضافة مهمة جديدة لهذا اليوم
        </button>
      </div>
      ${upcoming.length > 0 ? `
        <div class="mt-6">
          <h4 class="text-xs font-bold text-zinc-500 mb-3">📌 أقرب المهام القادمة في الجدول الزمني:</h4>
          <div class="space-y-3">
            ${upcoming.map(t => renderSingleTaskCard(t)).join('')}
          </div>
        </div>
      ` : ''}
    `;
    return;
  }

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <span class="text-xs font-bold text-zinc-600">عدد المهام اليومية: ${tasks.length}</span>
      <button onclick="openAddTaskModal('${selectedDate}')" class="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition border border-zinc-200">
        ➕ إضافة مهمة لهذا اليوم
      </button>
    </div>
    <div class="space-y-3">
      ${tasks.map(t => renderSingleTaskCard(t)).join('')}
    </div>
  `;
}

function renderSingleTaskCard(task) {
  const priorityClass = task.priority === 'Critical' ? 'badge-critical' : task.priority === 'High' ? 'badge-high' : 'badge-medium';
  const statusClass = task.status === 'Completed' ? 'badge-completed' : task.status === 'In Progress' ? 'badge-inprogress' : 'badge-pending';
  const isChecked = task.status === 'Completed' ? 'checked' : '';

  return `
    <div class="p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-sm hover:border-zinc-400 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start gap-3 flex-1">
        <input type="checkbox" ${isChecked} onchange="toggleTaskStatus('${task.id}', this.checked)" class="mt-1.5 w-5 h-5 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 cursor-pointer">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-mono font-bold text-zinc-400">${task.id}</span>
            <span class="text-xs px-2 py-0.5 rounded-lg ${priorityClass}">${task.priority}</span>
            <span class="text-xs px-2 py-0.5 rounded-lg ${statusClass}">${task.status}</span>
            <span class="text-xs px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 font-medium">📅 ${task.date}</span>
            <span class="text-xs px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 font-medium border border-zinc-200">${task.phase}</span>
          </div>
          <h4 class="text-base font-bold text-zinc-950 leading-snug ${task.status === 'Completed' ? 'line-through text-zinc-400' : ''}">${task.titleAr || task.titleEn}</h4>
          ${task.titleEn && task.titleAr ? `<p class="text-xs text-zinc-400 font-mono">${task.titleEn}</p>` : ''}
          <div class="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
            <span>👤 <strong>المسؤول:</strong> ${task.owner}</span>
            <span>📍 <strong>الموقع:</strong> ${task.facility}</span>
            <span>📦 <strong>المخرج:</strong> ${task.deliverable}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 self-end md:self-center">
        <div class="text-left w-24">
          <span class="text-[11px] text-zinc-500">الإنجاز: <strong>${task.progress || 0}%</strong></span>
          <input type="range" min="0" max="100" value="${task.progress || 0}" onchange="updateTaskProgress('${task.id}', this.value)" class="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-950">
        </div>
      </div>
    </div>
  `;
}

// 9. Spreadsheet Grid View
function renderGridView() {
  const tbody = document.getElementById("grid-table-body");
  if (!tbody || !scheduler) return;

  const tasks = getFilteredTasks();
  document.getElementById("grid-count").innerText = `(إجمالي المعروض: ${tasks.length} مهمة)`;

  tbody.innerHTML = tasks.map(t => {
    const priorityClass = t.priority === 'Critical' ? 'badge-critical' : t.priority === 'High' ? 'badge-high' : 'badge-medium';
    const statusClass = t.status === 'Completed' ? 'badge-completed' : t.status === 'In Progress' ? 'badge-inprogress' : 'badge-pending';

    return `
      <tr class="hover:bg-zinc-50 transition">
        <td class="font-mono text-xs font-bold text-zinc-400">${t.id}</td>
        <td class="font-mono text-xs whitespace-nowrap">${t.date}</td>
        <td class="text-xs font-semibold text-zinc-900 whitespace-nowrap">${t.phase}</td>
        <td class="text-xs font-medium text-zinc-950">
          <div>${t.titleAr || t.titleEn}</div>
          <div class="text-[11px] text-zinc-400 font-mono">${t.titleEn || ''}</div>
        </td>
        <td class="text-xs font-medium text-zinc-700 whitespace-nowrap">${t.owner}</td>
        <td class="text-xs text-zinc-600 whitespace-nowrap">${t.facility}</td>
        <td><span class="text-xs px-2 py-0.5 rounded-lg ${priorityClass}">${t.priority}</span></td>
        <td>
          <select onchange="updateTaskStatusDirect('${t.id}', this.value)" class="text-xs font-bold rounded-lg px-2 py-1 border border-zinc-300 focus:ring-zinc-950 ${statusClass}">
            <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
          </select>
        </td>
        <td class="text-center font-bold text-xs">${t.progress || 0}%</td>
        <td class="text-xs text-zinc-500 max-w-xs truncate" title="${t.deliverable}">${t.deliverable}</td>
      </tr>
    `;
  }).join('');
}

// 10. MTS View
function renderMTSView() {
  const tbody = document.getElementById("mts-table-body");
  if (!tbody || !currentProject) return;

  const items = currentProject.materialSubmittals || [];
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-xs text-zinc-400">لا توجد سجلات اعتمادات مواد أو مشتريات مدخلة في هذا المشروع حتى الآن.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(m => {
    const codeClass = m.status === 'A' ? 'code-a' : m.status === 'B' ? 'code-b' : 'code-c';
    const isLongLead = (m.leadTime || '').includes('8-12');

    return `
      <tr>
        <td class="text-center font-bold text-xs text-zinc-400">${m.sn || 1}</td>
        <td class="font-bold text-xs text-zinc-950">${m.item}</td>
        <td class="font-mono text-xs whitespace-nowrap">${m.submissionDate || '-'}</td>
        <td class="text-center"><span class="px-2 py-0.5 rounded text-xs font-bold ${codeClass}">Code ${m.status || 'B'}</span></td>
        <td class="text-xs font-medium text-zinc-700">${m.codeName || 'Under Review'}</td>
        <td>
          <span class="text-xs px-2 py-0.5 rounded font-bold ${isLongLead ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-zinc-100 text-zinc-700'}">
            ${m.leadTime || 'Standard'} ${isLongLead ? '⚠️' : ''}
          </span>
        </td>
        <td class="font-mono text-xs font-bold text-zinc-950 whitespace-nowrap">${m.requiredSite || '-'}</td>
        <td><span class="text-xs px-2 py-0.5 rounded font-semibold bg-zinc-100 text-zinc-800">${m.poStatus || 'Planned'}</span></td>
        <td class="text-center font-bold text-xs">${m.critical ? '🚨 حرج' : 'عادي'}</td>
      </tr>
    `;
  }).join('');
}

// 11. Milestones View
function renderMilestonesView() {
  const container = document.getElementById("milestones-timeline-container");
  if (!container || !currentProject) return;

  const milestones = currentProject.keyMilestones || [];
  if (milestones.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-xs text-zinc-400">لا توجد معالم رئيسية مدخلة.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="relative border-r-2 border-zinc-200 mr-4 space-y-8 py-4">
      ${milestones.map((m) => `
        <div class="relative pr-8">
          <div class="absolute -right-2.5 top-1 w-5 h-5 rounded-full bg-zinc-950 border-4 border-white shadow-md"></div>
          <div class="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-md transition">
            <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
              <span class="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">${m.id} (وزن المعلم: ${m.weight || '10%'})</span>
              <span class="text-xs px-2 py-0.5 rounded font-bold ${m.status === 'Completed' ? 'badge-completed' : m.status === 'Critical' ? 'badge-critical' : 'badge-inprogress'}">${m.status || 'Planned'}</span>
            </div>
            <h4 class="text-base font-bold text-zinc-950 mb-1">${m.name}</h4>
            <div class="flex flex-wrap gap-4 text-xs text-zinc-500">
              <span>📅 من: <strong>${m.startDate}</strong> إلى: <strong>${m.finishDate}</strong></span>
              <span>👤 المسؤول: <strong>${m.owner || 'Project Lead'}</strong></span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 12. Actions View
function renderActionsView() {
  const tbody = document.getElementById("actions-table-body");
  if (!tbody || !currentProject) return;

  const actions = currentProject.actionItems || [];
  if (actions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-xs text-slate-400">لا توجد بنود عمل معلقة مسجلة.</td></tr>`;
    return;
  }

  tbody.innerHTML = actions.map(a => {
    const pClass = a.priority === 'Critical' ? 'badge-critical' : a.priority === 'High' ? 'badge-high' : 'badge-medium';
    return `
      <tr>
        <td class="font-mono text-xs font-bold text-slate-400">${a.id}</td>
        <td class="text-xs font-bold text-slate-800">${a.taskAr || a.task}</td>
        <td class="text-xs text-slate-400 font-mono">${a.task}</td>
        <td class="text-xs font-bold text-blue-800 whitespace-nowrap">${a.owner}</td>
        <td class="font-mono text-xs font-bold text-red-600 whitespace-nowrap">${a.targetDate}</td>
        <td><span class="text-xs px-2 py-0.5 rounded font-bold ${pClass}">${a.priority}</span></td>
        <td><span class="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">${a.status}</span></td>
      </tr>
    `;
  }).join('');
}

// Filter Logic
function initFilterControls() {
  document.getElementById("filter-search")?.addEventListener("input", (e) => {
    filters.search = e.target.value.toLowerCase();
    renderGridView();
  });
  document.getElementById("filter-phase")?.addEventListener("change", (e) => {
    filters.phase = e.target.value;
    renderGridView();
  });
  document.getElementById("filter-priority")?.addEventListener("change", (e) => {
    filters.priority = e.target.value;
    renderGridView();
  });
}

function getFilteredTasks() {
  if (!scheduler) return [];
  return scheduler.getAllTasks().filter(t => {
    const matchesSearch = !filters.search || 
      (t.titleAr && t.titleAr.toLowerCase().includes(filters.search)) ||
      (t.titleEn && t.titleEn.toLowerCase().includes(filters.search)) ||
      (t.owner && t.owner.toLowerCase().includes(filters.search)) ||
      (t.id && t.id.toLowerCase().includes(filters.search));
    const matchesPhase = filters.phase === 'all' || t.phase.includes(filters.phase);
    const matchesPriority = filters.priority === 'all' || t.priority === filters.priority;
    return matchesSearch && matchesPhase && matchesPriority;
  });
}

function toggleTaskStatus(taskId, isChecked) {
  if (!scheduler) return;
  const task = scheduler.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = isChecked ? 'Completed' : 'In Progress';
    task.progress = isChecked ? 100 : 50;
    saveActiveProjectState();
    renderKPIs();
    renderDailyView();
  }
}

function updateTaskProgress(taskId, progressVal) {
  if (!scheduler) return;
  const task = scheduler.tasks.find(t => t.id === taskId);
  if (task) {
    task.progress = parseInt(progressVal);
    task.status = task.progress === 100 ? 'Completed' : task.progress === 0 ? 'Pending' : 'In Progress';
    saveActiveProjectState();
    renderKPIs();
    renderDailyView();
  }
}

function updateTaskStatusDirect(taskId, newStatus) {
  if (!scheduler) return;
  const task = scheduler.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    task.progress = newStatus === 'Completed' ? 100 : newStatus === 'Pending' ? 0 : 50;
    saveActiveProjectState();
    renderKPIs();
    renderGridView();
  }
}

function saveActiveProjectState() {
  if (activeProjectRecord && window.projectsStore) {
    window.projectsStore.updateProject(activeProjectRecord.id, currentProject);
  }
}

// 13. File Upload and AI Analysis
function initUploadHandlers() {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-blue-500", "bg-blue-50");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-blue-500", "bg-blue-50");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-blue-500", "bg-blue-50");
    if (e.dataTransfer.files.length > 0) {
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleUploadedFile(e.target.files[0]);
    }
  });

  document.getElementById("btn-export-excel")?.addEventListener("click", () => {
    if (!currentProject || !scheduler) {
      alert("⚠️ يرجى رفع أو فتح مشروع أولاً لتصدير ملف الإكسل.");
      return;
    }
    PMExcelExporter.exportProjectWorkbook(currentProject, scheduler);
  });
}

async function handleUploadedFile(file) {
  const uploadStatus = document.getElementById("upload-status");
  uploadStatus.classList.remove("hidden");
  
  const apiKey = geminiService.getApiKey();

  uploadStatus.innerHTML = `
    <div class="flex items-center gap-3 text-blue-700 bg-blue-50 p-4 rounded-2xl border border-blue-200">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
      <div>
        <p class="font-bold">جاري قراءة محتوى الملف (${file.name}) ودراسة المشروع بالذكاء الاصطناعي...</p>
        <p class="text-xs text-blue-600 mt-0.5">يتم استخراج المهام الحقيقية، المعالم، النطاق، والمشتريات الخاصة بملفك فقط...</p>
      </div>
    </div>
  `;

  try {
    const formData = new FormData();
    formData.append("projectFile", file);

    const headers = {};
    if (apiKey) {
      headers["x-gemini-key"] = apiKey;
    }

    const res = await fetch("/api/analyze-file", {
      method: "POST",
      headers: headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "فشل تحليل الملف");
    }

    const data = await res.json();
    const newProjectRecord = window.projectsStore?.createProject(data.projectData);
    
    refreshAppState();
    switchTab("daily");

    uploadStatus.innerHTML = `
      <div class="text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 font-bold space-y-1">
        <div class="flex items-center gap-2">
          <span>✅</span>
          <span>تم تحليل وتفكيك مشروع (${file.name}) بنجاح وتوليد ${scheduler.tasks.length} مهمة مجدولة!</span>
        </div>
        ${data.warning ? `<p class="text-xs font-normal text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">💡 ${data.warning}</p>` : ''}
      </div>
    `;
  } catch (error) {
    console.error("Upload error:", error);
    uploadStatus.innerHTML = `
      <div class="text-red-700 bg-red-50 p-4 rounded-2xl border border-red-200 space-y-2">
        <p class="font-bold">❌ حدث خطأ أثناء تحليل الملف بالذكاء الاصطناعي:</p>
        <p class="text-xs">${error.message}</p>
        <p class="text-xs text-slate-600 pt-1 border-t border-red-200">
          💡 تلميح: تأكد من إدخال مفتاح <strong>Gemini API Key</strong> من أيقونة الإعدادات (⚙️) بالأعلى لقراءة أي ملف PDF/Word بدقة تامة.
        </p>
      </div>
    `;
  }
}

// 14. Modals (Auth, Settings, Share, New Project)
function initAuthModals() {
  const modal = document.getElementById("auth-modal");
  const closeBtn = document.getElementById("btn-close-auth");
  const form = document.getElementById("auth-form");

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("auth-name")?.value;
    const email = document.getElementById("auth-email")?.value;
    const role = document.getElementById("auth-role")?.value;
    const company = document.getElementById("auth-company")?.value;

    try {
      window.authService.register(name, email, role, company);
      renderUserBadge();
      modal.classList.add("hidden");
      alert(`🎉 أهلاً بك يا ${name}! تم إنشاء حسابك بنجاح.`);
      refreshAppState();
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  });
}

function openAuthModal() {
  document.getElementById("auth-modal")?.classList.remove("hidden");
}

function handleLogout() {
  if (confirm("هل تريد تسجيل الخروج؟")) {
    window.authService.logout();
    renderUserBadge();
    refreshAppState();
    alert("تم تسجيل الخروج بنجاح.");
  }
}

function initNewProjectModal() {
  document.getElementById("btn-open-new-project")?.addEventListener("click", () => {
    switchTab("upload");
  });
}

function initShareModal() {
  const modal = document.getElementById("share-modal");
  const closeBtn = document.getElementById("btn-close-share");
  const copyBtn = document.getElementById("btn-copy-share-link");

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));

  copyBtn?.addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href);
    alert("📋 تم نسخ رابط المشروع! يمكنك إرساله لفريق العمل أو الاستشاري.");
  });
}

function openShareModal() {
  document.getElementById("share-modal")?.classList.remove("hidden");
}

function initSettingsModal() {
  const modal = document.getElementById("settings-modal");
  const openBtn = document.getElementById("btn-open-settings");
  const closeBtn = document.getElementById("btn-close-settings");
  const saveBtn = document.getElementById("btn-save-settings");
  const apiKeyInput = document.getElementById("input-gemini-key");

  openBtn?.addEventListener("click", () => {
    if (apiKeyInput) apiKeyInput.value = geminiService.getApiKey();
    modal.classList.remove("hidden");
  });

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));

  saveBtn?.addEventListener("click", () => {
    if (apiKeyInput) {
      geminiService.setApiKey(apiKeyInput.value);
      alert("✅ تم حفظ إعدادات مفتاح Gemini API بنجاح!");
      modal.classList.add("hidden");
    }
  });
}

function openAddTaskModal(date) {
  if (!scheduler) return;
  const title = prompt("أدخل اسم وموضوع المهمة الجديدة لهذا اليوم:", "");
  if (!title) return;
  const owner = prompt("اسم المسؤول أو الدور (مثلاً: Site Engineer / QA/QC):", "Site Engineer");

  scheduler.tasks.push({
    id: `TSK-${String(scheduler.tasks.length + 1).padStart(4, '0')}`,
    date: date,
    phase: "Site Execution",
    category: "Custom Task",
    titleAr: title,
    titleEn: title,
    owner: owner || "Project Manager",
    facility: "Site",
    priority: "High",
    status: "Pending",
    progress: 0,
    deliverable: "Inspection Report / Deliverable"
  });

  saveActiveProjectState();
  renderKPIs();
  renderDailyView();
}
