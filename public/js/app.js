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
  initWorkPlanGeneratorModal();
  initBudgetModal();
  initAttachFilesModal();
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

  // Update YAZ AI Copilot Context
  if (window.yazCopilot) {
    window.yazCopilot.setProjectContext(currentProject, scheduler);
  }
}

// 1. User Badge & Profile & Subscription
function renderUserBadge() {
  const user = window.authService?.getCurrentUser();
  const container = document.getElementById("user-profile-badge");
  if (!container) return;

  if (user) {
    const isPro = user.planId === "pro";
    const planBadge = user.planBadge || (isPro ? "PRO UNLIMITED ⭐" : "FREE TRIAL 🌱");
    
    container.innerHTML = `
      <div class="flex items-center gap-2 bg-[#14161f] hover:bg-[#1f2230] border border-[#242736] py-1 px-2.5 rounded-xl cursor-pointer transition" id="btn-user-menu">
        <img src="${user.avatar}" class="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 border border-amber-400 shadow-sm" alt="${user.name}">
        <div class="text-right hidden sm:block">
          <div class="text-xs font-bold text-white leading-tight">${user.name}</div>
          <div class="text-[9px] ${isPro ? 'text-amber-300' : 'text-emerald-400'} font-black leading-tight">${planBadge}</div>
        </div>
        <span class="text-xs text-zinc-400">▾</span>
      </div>
      <!-- User Dropdown Menu -->
      <div id="user-dropdown" class="hidden absolute left-0 mt-2 w-64 bg-[#12141c] rounded-2xl shadow-2xl border border-[#242736] p-2 z-50 text-right text-xs text-zinc-200">
        <div class="p-2.5 border-b border-[#1e2029]">
          <div class="font-black text-white">${user.name}</div>
          <div class="text-zinc-400 text-[11px]">${user.email}</div>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-[10px] px-2 py-0.5 rounded-full ${isPro ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'} font-bold border">${user.plan || (isPro ? 'الاشتراك الشامل' : 'التجربة المجانية')}</span>
            ${!isPro ? `<button onclick="openSubscriptionModal()" class="text-[10px] px-2 py-0.5 bg-amber-400 text-zinc-950 rounded-lg font-black hover:bg-amber-300 transition">ترقية 💎</button>` : ''}
          </div>
        </div>
        <button onclick="openSubscriptionModal()" class="w-full text-right p-2 hover:bg-[#181a24] rounded-xl font-bold text-amber-300 flex items-center justify-between">
          <span>💎 تفاصيل الاشتراك والترقية</span>
          <span class="text-xs">⭐</span>
        </button>
        <button onclick="switchTab('projects')" class="w-full text-right p-2 hover:bg-[#181a24] rounded-xl font-bold text-zinc-300 flex items-center justify-between">
          <span>📁 لوحة مشاريعي</span>
          <span class="text-xs">📂</span>
        </button>
        <button onclick="switchTab('upload')" class="w-full text-right p-2 hover:bg-[#181a24] rounded-xl font-bold text-zinc-300 flex items-center justify-between">
          <span>➕ رفع مشروع جديد</span>
          <span class="text-xs">📤</span>
        </button>
        <button onclick="handleClearAllUserProjects()" class="w-full text-right p-2 hover:bg-amber-950/30 text-amber-400 rounded-xl font-bold flex items-center justify-between">
          <span>🗑️ مسح مشاريعي (البدء من الصفر)</span>
          <span class="text-xs">🧹</span>
        </button>
        <button onclick="handleLogout()" class="w-full text-right p-2 hover:bg-rose-950/30 text-rose-400 rounded-xl font-bold flex items-center justify-between mt-1 border-t border-[#1e2029]">
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
      <button onclick="openAuthModal()" class="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-950 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm">
        👤 تسجيل الدخول
      </button>
    `;
  }
}

// Subscription Modal Controller (Unified 174 SAR All-Access Plan)
function openSubscriptionModal() {
  const modal = document.getElementById("subscription-modal");
  if (!modal) return;

  const user = window.authService?.getCurrentUser();
  const currentBadgeEl = document.getElementById("sub-modal-current-badge");
  if (currentBadgeEl && user) {
    const isPro = user.planId === "pro";
    currentBadgeEl.innerText = `حسابك الحالي: ${user.planBadge || (isPro ? 'PRO UNLIMITED ⭐' : 'FREE TRIAL 🌱')}`;
    currentBadgeEl.className = `text-[10px] px-2.5 py-0.5 rounded-full ${isPro ? 'bg-amber-400/10 text-amber-300 border-amber-400/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'} font-black border`;
  }

  window.paymentService?.renderPaymentUI("payment-checkout-container");
  modal.classList.remove("hidden");
}

function closeSubscriptionModal() {
  const modal = document.getElementById("subscription-modal");
  if (modal) modal.classList.add("hidden");
}

function handleConfirmSubscription() {
  const selectedPayment = document.querySelector('input[name="sub-payment-method"]:checked')?.value || "Mada";

  try {
    window.authService?.upgradePlan("pro", "monthly", selectedPayment);
    renderUserBadge();
    closeSubscriptionModal();

    alert("🎉 تهانينا! تم تفعيل الاشتراك الشامل بنجاح (174 ر.س / شهرياً).\n\nأصبح بإمكانك الآن إضافة مشاريع هندسية غير محدودة واستخدام كافة ميزات المنظومة والذكاء الاصطناعي بلا قيود!");
  } catch (err) {
    alert("⚠️ " + err.message);
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
    if (isActive) {
      b.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  });
  renderCurrentTab();
}

function renderCurrentTab() {
  const sections = ["projects", "daily", "grid", "mts", "milestones", "cashflow", "actions", "upload"];
  sections.forEach(s => {
    const el = document.getElementById(`tab-content-${s}`);
    if (el) el.classList.toggle("hidden", s !== activeTab);
  });

  if (activeTab === "projects") renderProjectsDashboard();
  else if (activeTab === "daily") renderDailyView();
  else if (activeTab === "grid") renderGridView();
  else if (activeTab === "mts") renderMTSView();
  else if (activeTab === "milestones") renderMilestonesView();
  else if (activeTab === "cashflow") renderCashFlowView();
  else if (activeTab === "actions") renderActionsView();
}

// 6. MY PROJECTS DASHBOARD TAB
function renderProjectsDashboard() {
  const container = document.getElementById("projects-grid-container");
  if (!container) return;

  const projects = window.projectsStore?.getAllProjects() || [];
  const activeId = window.projectsStore?.getActiveProjectId();

  const user = window.authService?.getCurrentUser();
  const isFree = !user || user.planId === 'free';
  const planBanner = isFree ? `
    <div class="col-span-full p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
      <div class="flex items-center gap-3">
        <span class="text-xl">🌱</span>
        <div>
          <div class="text-xs font-black text-zinc-900">أنت حالياً في التجربة المجانية (${projects.length} من 1 مشروع مسموح)</div>
          <div class="text-[11px] text-zinc-600">لإضافة مشاريع غير محدودة وتفعيل كافة مزايا التحليل والتصدير، اشترك في الباقة الشاملة.</div>
        </div>
      </div>
      <button onclick="openSubscriptionModal()" class="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 rounded-xl text-xs font-black transition shadow whitespace-nowrap">
        💎 الترقية للاشتراك الشامل (174 ر.س/شهرياً)
      </button>
    </div>
  ` : '';

  if (projects.length === 0) {
    container.innerHTML = planBanner + `
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

  container.innerHTML = planBanner + projects.map(p => {
    const info = p.data.projectInfo;
    const tempScheduler = new PMTaskScheduler(p.data);
    const kpis = tempScheduler.getProjectKPIs();
    const isActive = p.id === activeId;

    return `
      <div class="bg-white rounded-2xl border ${isActive ? 'border-2 border-zinc-950 shadow-md ring-1 ring-zinc-900/10' : 'border-zinc-200/80 shadow-sm'} p-4 sm:p-6 flex flex-col justify-between hover:shadow-md transition relative">
        ${isActive ? `
          <div class="absolute -top-3 right-4 sm:right-6 bg-zinc-950 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow border border-amber-400/20">
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
          <button onclick="openPdfReportModal('${p.id}')" class="p-2 bg-zinc-100 hover:bg-amber-50 hover:text-amber-800 text-zinc-700 rounded-xl text-xs font-bold transition border border-zinc-200" title="تقرير تنفيذي PDF">
            📄
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
  if (!window.projectsStore?.canCreateProject()) {
    openSubscriptionModal();
    alert("⚠️ لقد استنفدت التجربة المجانية لمشروع واحد.\n\nلإضافة مشاريع جديدة غير محدودة، يرجى تفعيل الاشتراك الشامل بـ 174 ر.س / شهرياً.");
    return;
  }
  window.projectsStore?.loadDemoProject();
  refreshAppState();
  switchTab("daily");
  alert("✅ تم تحميل المشروع التجريبي الاستعراضي بنجاح!");
}

function handleSelectProject(id) {
  switchActiveProject(id);
  switchTab("daily");
}

function exportCurrentProject() {
  const activeId = window.projectsStore?.getActiveProjectId();
  if (activeId) {
    exportSingleProject(activeId);
  } else if (currentProject && scheduler) {
    PMExcelExporter.exportProjectWorkbook(currentProject, scheduler);
  }
}

function handleDeleteCurrentProject() {
  const activeId = window.projectsStore?.getActiveProjectId();
  if (activeId) {
    handleDeleteProject(activeId);
  } else {
    alert("لا يوجد مشروع نشط حالياً للحذف.");
  }
}

function exportSingleProject(id) {
  const p = window.projectsStore.getAllProjects().find(x => x.id === id);
  if (p) {
    const tempSched = new PMTaskScheduler(p.data);
    PMExcelExporter.exportProjectWorkbook(p.data, tempSched);
  }
}

// PDF Export & Preview Handlers
let pdfTargetProject = null;
let pdfTargetScheduler = null;

function openPdfReportModal(projectId = null) {
  if (projectId) {
    const p = window.projectsStore?.getAllProjects().find(x => x.id === projectId);
    if (p) {
      pdfTargetProject = p.data;
      pdfTargetScheduler = new PMTaskScheduler(p.data);
    }
  } else if (currentProject) {
    pdfTargetProject = currentProject;
    pdfTargetScheduler = scheduler;
  } else {
    alert("⚠️ يرجى اختيار أو فتح مشروع أولاً لتصدير التقرير التنفيذي.");
    return;
  }

  const modal = document.getElementById("pdf-report-modal");
  if (!modal) return;

  modal.classList.remove("hidden");
  updatePdfLivePreview();
}

function closePdfReportModal() {
  const modal = document.getElementById("pdf-report-modal");
  if (modal) modal.classList.add("hidden");
}

function getPdfOptionsFromUI() {
  return {
    reportType: document.getElementById("pdf-opt-type")?.value || "comprehensive",
    includeFinancials: document.getElementById("pdf-opt-financials")?.checked ?? true,
    includeProcurement: document.getElementById("pdf-opt-procurement")?.checked ?? true,
    includeSignatures: document.getElementById("pdf-opt-signatures")?.checked ?? true,
    customNotes: document.getElementById("pdf-opt-notes")?.value || ""
  };
}

function updatePdfLivePreview() {
  const container = document.getElementById("pdf-live-preview-container");
  if (!container || !pdfTargetProject || !window.PMPdfExporter) return;

  const options = getPdfOptionsFromUI();
  container.innerHTML = window.PMPdfExporter.generateReportHTML(pdfTargetProject, pdfTargetScheduler, options);
}

async function handleDownloadPdf() {
  if (!pdfTargetProject || !window.PMPdfExporter) return;
  const btn = document.getElementById("btn-download-pdf-action");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>⏳</span> <span>جاري إنشاء الـ PDF...</span>`;
  }

  try {
    const options = getPdfOptionsFromUI();
    await window.PMPdfExporter.downloadPdf(pdfTargetProject, pdfTargetScheduler, options);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>📥</span> <span>تنزيل PDF عالي الدقة</span>`;
    }
  }
}

function handlePrintPdf() {
  if (!pdfTargetProject || !window.PMPdfExporter) return;
  const options = getPdfOptionsFromUI();
  window.PMPdfExporter.printReport(pdfTargetProject, pdfTargetScheduler, options);
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
    <div class="p-3.5 sm:p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-sm hover:border-zinc-400 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
      <div class="flex items-start gap-2.5 sm:gap-3 flex-1 w-full">
        <input type="checkbox" ${isChecked} onchange="toggleTaskStatus('${task.id}', this.checked)" class="mt-1 w-5 h-5 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 cursor-pointer flex-shrink-0">
        <div class="space-y-1 flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span class="text-xs font-mono font-bold text-zinc-400">${task.id}</span>
            <span class="text-[11px] sm:text-xs px-2 py-0.5 rounded-lg ${priorityClass}">${task.priority}</span>
            <span class="text-[11px] sm:text-xs px-2 py-0.5 rounded-lg ${statusClass}">${task.status}</span>
            <span class="text-[11px] sm:text-xs px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 font-medium">📅 ${task.date}</span>
            <span class="text-[11px] sm:text-xs px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 font-medium border border-zinc-200">${task.phase}</span>
          </div>
          <h4 class="text-sm sm:text-base font-bold text-zinc-950 leading-snug break-words ${task.status === 'Completed' ? 'line-through text-zinc-400' : ''}">${task.titleAr || task.titleEn}</h4>
          ${task.titleEn && task.titleAr ? `<p class="text-[11px] sm:text-xs text-zinc-400 font-mono truncate">${task.titleEn}</p>` : ''}
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-zinc-500 pt-1">
            <span>👤 <strong>المسؤول:</strong> ${task.owner}</span>
            <span>📍 <strong>الموقع:</strong> ${task.facility}</span>
            <span>📦 <strong>المخرج:</strong> ${task.deliverable}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
        <div class="flex items-center gap-2 flex-1 md:flex-initial md:w-28 text-left">
          <span class="text-[11px] text-zinc-500 whitespace-nowrap">الإنجاز: <strong class="text-zinc-950">${task.progress || 0}%</strong></span>
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

// 10. MTS View (Approvals & Procurement Register with Full PO Tracking)
function renderMTSView() {
  const tbody = document.getElementById("mts-table-body");
  const kpiContainer = document.getElementById("mts-kpi-summary");
  if (!tbody || !currentProject) return;

  const items = currentProject.materialSubmittals || [];

  // Render KPI summary bar
  if (kpiContainer) {
    const totalItems = items.length;
    const issuedCount = items.filter(m => m.poStatus === 'Issued' || m.poStatus === 'Delivered to Site').length;
    const pendingApprovalCount = items.filter(m => m.poStatus === 'Pending Approval' || m.poStatus === 'Pending PO').length;
    const revisionCount = items.filter(m => m.poStatus === 'Pending Revision' || m.poStatus === 'Under Resubmission').length;
    const criticalCount = items.filter(m => m.critical || (m.leadTime || '').includes('8-12')).length;
    const cycleCompletionRate = totalItems > 0 ? Math.round((issuedCount / totalItems) * 100) : 0;

    kpiContainer.innerHTML = `
      <div class="bg-white p-3 sm:p-4 rounded-xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div class="text-[11px] font-bold text-zinc-500">إجمالي المواد والاعتمادات</div>
          <div class="text-xl sm:text-2xl font-black text-zinc-900 mt-1">${totalItems} <span class="text-xs font-normal text-zinc-400">بند</span></div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg">📦</div>
      </div>
      <div class="bg-white p-3 sm:p-4 rounded-xl border border-emerald-200/80 shadow-sm flex items-center justify-between bg-emerald-50/20">
        <div>
          <div class="text-[11px] font-bold text-emerald-800">أوامر شراء صادرة (Issued)</div>
          <div class="text-xl sm:text-2xl font-black text-emerald-600 mt-1">${issuedCount} <span class="text-xs font-normal text-emerald-700">أمر</span></div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center text-lg">✅</div>
      </div>
      <div class="bg-white p-3 sm:p-4 rounded-xl border border-amber-200/80 shadow-sm flex items-center justify-between bg-amber-50/20">
        <div>
          <div class="text-[11px] font-bold text-amber-800">قيد الاعتماد الداخلي</div>
          <div class="text-xl sm:text-2xl font-black text-amber-600 mt-1">${pendingApprovalCount} <span class="text-xs font-normal text-amber-700">بند</span></div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center text-lg">⏳</div>
      </div>
      <div class="bg-white p-3 sm:p-4 rounded-xl border border-rose-200/80 shadow-sm flex items-center justify-between bg-rose-50/20">
        <div>
          <div class="text-[11px] font-bold text-rose-800">بانتظار المراجعة والتعديل</div>
          <div class="text-xl sm:text-2xl font-black text-rose-600 mt-1">${revisionCount} <span class="text-xs font-normal text-rose-700">بند</span></div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center text-lg">⚠️</div>
      </div>
      <div class="bg-white p-3 sm:p-4 rounded-xl border border-cyan-200/80 shadow-sm flex items-center justify-between bg-cyan-50/20 col-span-2 sm:col-span-4 lg:col-span-1">
        <div>
          <div class="text-[11px] font-bold text-cyan-800">اكتمال دورة التوريد</div>
          <div class="text-xl sm:text-2xl font-black text-cyan-600 mt-1">${cycleCompletionRate}% <span class="text-xs font-normal text-cyan-700">منجز</span></div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-cyan-100/70 text-cyan-700 flex items-center justify-center text-lg">🎯</div>
      </div>
    `;
  }

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" class="text-center py-8 text-xs text-zinc-400">لا توجد سجلات اعتمادات مواد أو مشتريات مدخلة في هذا المشروع حتى الآن.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(m => {
    const codeClass = m.status === 'A' ? 'code-a' : m.status === 'B' ? 'code-b' : 'code-c';
    const isLongLead = (m.leadTime || '').includes('8-12');

    // PO Status styling badge
    let poBadgeClass = 'bg-zinc-100 text-zinc-700 border-zinc-200';
    let poIcon = '📄';
    if (m.poStatus === 'Issued') {
      poBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold';
      poIcon = '✅';
    } else if (m.poStatus === 'Delivered to Site') {
      poBadgeClass = 'bg-teal-50 text-teal-800 border-teal-300 font-bold';
      poIcon = '🚚';
    } else if (m.poStatus === 'Pending Approval' || m.poStatus === 'Pending PO') {
      poBadgeClass = 'bg-amber-50 text-amber-700 border-amber-300 font-semibold';
      poIcon = '⏳';
    } else if (m.poStatus === 'Pending Revision') {
      poBadgeClass = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
      poIcon = '❌';
    } else if (m.poStatus === 'Under Resubmission') {
      poBadgeClass = 'bg-orange-50 text-orange-700 border-orange-300 font-semibold';
      poIcon = '🔄';
    }

    // Mini Cycle status visual
    const hasRequest = m.poRequestDate && m.poRequestDate !== '-';
    const hasApproval = m.poApprovalDate && m.poApprovalDate !== '-';
    const hasIssuance = m.poIssuanceDate && m.poIssuanceDate !== '-';

    return `
      <tr class="hover:bg-zinc-50/80 transition-colors border-b border-zinc-100">
        <td class="text-center font-bold text-xs text-zinc-400 py-2.5 px-2">${m.sn || 1}</td>
        <td class="py-2.5 px-3 min-w-[220px]">
          <div class="font-bold text-xs text-zinc-950">${m.item}</div>
          <div class="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1 font-mono">
            <span class="${hasRequest ? 'text-blue-600 font-semibold' : 'text-zinc-300'}">طلب</span>
            <span class="text-zinc-300">➔</span>
            <span class="${hasApproval ? 'text-amber-600 font-semibold' : 'text-zinc-300'}">اعتماد</span>
            <span class="text-zinc-300">➔</span>
            <span class="${hasIssuance ? 'text-emerald-600 font-bold' : 'text-zinc-300'}">إصدار</span>
          </div>
        </td>
        <td class="font-mono text-xs whitespace-nowrap text-center py-2.5 px-2.5 text-zinc-600">${m.submissionDate || '-'}</td>
        <td class="text-center py-2.5 px-2"><span class="px-2 py-0.5 rounded text-xs font-bold ${codeClass}">Code ${m.status || 'B'}</span></td>
        <td class="text-xs font-medium text-zinc-700 py-2.5 px-2.5 whitespace-nowrap">${m.codeName || 'Under Review'}</td>
        <td class="py-2.5 px-2.5 whitespace-nowrap">
          <span class="text-xs px-2 py-0.5 rounded font-bold ${isLongLead ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-zinc-100 text-zinc-700'}">
            ${m.leadTime || 'Standard'} ${isLongLead ? '⚠️' : ''}
          </span>
        </td>
        <td class="font-mono text-xs font-bold text-zinc-950 whitespace-nowrap text-center py-2.5 px-2.5">${m.requiredSite || '-'}</td>
        
        <!-- PO Lifecycle Columns -->
        <td class="font-mono text-xs text-center py-2.5 px-2.5 bg-blue-50/30 border-x border-blue-50 whitespace-nowrap text-zinc-700">
          ${m.poRequestDate && m.poRequestDate !== '-' ? `<span class="text-blue-700 font-semibold">${m.poRequestDate}</span>` : '<span class="text-zinc-300">-</span>'}
        </td>
        <td class="font-mono text-xs text-center py-2.5 px-2.5 bg-blue-50/30 border-x border-blue-50 whitespace-nowrap text-zinc-700">
          ${m.poApprovalDate && m.poApprovalDate !== '-' ? `<span class="text-amber-700 font-semibold">${m.poApprovalDate}</span>` : '<span class="text-zinc-300">-</span>'}
        </td>
        <td class="font-mono text-xs text-center py-2.5 px-2.5 bg-blue-50/30 border-x border-blue-50 whitespace-nowrap text-zinc-700">
          ${m.poIssuanceDate && m.poIssuanceDate !== '-' ? `<span class="text-emerald-700 font-bold">${m.poIssuanceDate}</span>` : '<span class="text-zinc-300">-</span>'}
        </td>
        <td class="font-mono text-xs text-center py-2.5 px-2.5 bg-zinc-50/50 whitespace-nowrap text-zinc-600">
          ${m.poStatusDate && m.poStatusDate !== '-' ? m.poStatusDate : '-'}
        </td>
        <td class="py-2.5 px-3 text-center whitespace-nowrap">
          <span class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${poBadgeClass}">
            <span>${poIcon}</span>
            <span>${m.poStatus || 'Planned'}</span>
          </span>
        </td>
        <td class="text-center font-bold text-xs py-2.5 px-2">
          ${m.critical ? '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">🚨 حرج</span>' : '<span class="text-zinc-400 font-normal">عادي</span>'}
        </td>
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

// 12.1 Cash Flow & S-Curve Financial View
const CURRENCY_SYMBOLS = {
  SAR: "ر.س",
  USD: "$",
  AED: "د.إ",
  QAR: "ر.ق",
  KWD: "د.ك",
  BHD: "د.ب",
  OMR: "ر.ع",
  EGP: "ج.م"
};

function renderCashFlowView() {
  if (!scheduler || !currentProject) return;

  const cf = scheduler.getCashFlowForecast();
  const sym = CURRENCY_SYMBOLS[cf.currency] || cf.currency || "ر.س";

  const valEl = document.getElementById("cf-contract-value");
  const inEl = document.getElementById("cf-total-inflows");
  const outEl = document.getElementById("cf-total-outflows");
  const profitEl = document.getElementById("cf-net-profit");
  const currBadge = document.getElementById("cf-currency-badge");
  const marginBadge = document.getElementById("cf-margin-badge");
  const inflowNote = document.getElementById("cf-inflow-note");
  const costRatioBadge = document.getElementById("cf-cost-ratio-badge");

  if (valEl) valEl.innerText = `${new Intl.NumberFormat('en-US').format(cf.contractValue)} ${sym}`;
  if (inEl) inEl.innerText = `${new Intl.NumberFormat('en-US').format(cf.totalInflow)} ${sym}`;
  if (outEl) outEl.innerText = `${new Intl.NumberFormat('en-US').format(cf.totalOutflow)} ${sym}`;
  if (profitEl) profitEl.innerText = `${new Intl.NumberFormat('en-US').format(cf.totalProfit)} ${sym}`;
  if (currBadge) currBadge.innerText = `العملة: ${cf.currency} (${sym})`;
  if (marginBadge) marginBadge.innerText = `هامش الربح: ${cf.profitMarginPct}% (${new Intl.NumberFormat('en-US').format(cf.totalProfit)} ${sym})`;
  if (inflowNote) inflowNote.innerText = `المستخلصات + الدفعة المقدمة (${cf.advancePaymentPct}%)`;
  if (costRatioBadge) costRatioBadge.innerText = `تكاليف التنفيذ والتوريد (${Math.round((cf.totalOutflow / cf.contractValue) * 100)}%)`;

  renderCashFlowChart(cf);
  renderCashFlowTable(cf);
}

function renderCashFlowChart(cf) {
  const container = document.getElementById("cashflow-chart-container");
  if (!container) return;

  const months = cf.monthlyBreakdown || [];
  if (months.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-zinc-400 text-xs">لا توجد بيانات تدفقات نقدية مسجلة.</div>`;
    return;
  }

  const maxVal = Math.max(...months.map(m => Math.max(m.inflow, m.outflow)), 1);
  const sym = CURRENCY_SYMBOLS[cf.currency] || cf.currency || "ر.س";

  container.innerHTML = `
    <div class="flex items-end gap-3 min-w-[700px] pb-4 pt-6 px-2 border-b border-zinc-100">
      ${months.map(m => {
        const inflowHeightPct = Math.max(12, Math.round((m.inflow / maxVal) * 100));
        const outflowHeightPct = Math.max(12, Math.round((m.outflow / maxVal) * 100));
        const isNetPositive = m.netFlow >= 0;

        return `
          <div class="flex-1 flex flex-col items-center gap-2 group relative">
            <!-- S-Curve Progress Pill -->
            <div class="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 whitespace-nowrap shadow-xs flex items-center gap-1">
              <span>📈</span>
              <span>${m.cumulativeProgressPct}%</span>
            </div>

            <!-- Dual Bars Box -->
            <div class="w-full h-44 flex items-end justify-center gap-1.5 bg-zinc-50 rounded-2xl p-2 border border-zinc-200/60 group-hover:border-zinc-300 group-hover:bg-zinc-100/60 transition">
              <!-- Inflow Bar -->
              <div class="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all relative flex items-center justify-center cursor-pointer group/bar shadow-sm" style="height: ${inflowHeightPct}%;">
                <div class="opacity-0 group-hover/bar:opacity-100 transition absolute -top-8 bg-zinc-950 text-white text-[9px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  داخل: ${new Intl.NumberFormat('en-US').format(m.inflow)} ${sym}
                </div>
              </div>
              <!-- Outflow Bar -->
              <div class="w-1/2 bg-zinc-800 hover:bg-zinc-950 rounded-t-lg transition-all relative flex items-center justify-center cursor-pointer group/bar shadow-sm" style="height: ${outflowHeightPct}%;">
                <div class="opacity-0 group-hover/bar:opacity-100 transition absolute -top-8 bg-zinc-950 text-white text-[9px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  خارج: ${new Intl.NumberFormat('en-US').format(m.outflow)} ${sym}
                </div>
              </div>
            </div>

            <!-- Net Flow Tag -->
            <span class="text-[10px] font-black px-1.5 py-0.5 rounded-md ${isNetPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} whitespace-nowrap">
              ${isNetPositive ? '+' : ''}${new Intl.NumberFormat('en-US').format(Math.round(m.netFlow / 1000))}k
            </span>

            <!-- Month Title -->
            <div class="text-center">
              <span class="text-[11px] font-black text-zinc-900 block">شهر ${m.monthIndex}</span>
              <span class="text-[9px] text-zinc-400 font-mono block">${m.monthDate.substring(0, 7)}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderCashFlowTable(cf) {
  const tbody = document.getElementById("cashflow-table-body");
  const countBadge = document.getElementById("cashflow-table-count");
  if (!tbody) return;

  const months = cf.monthlyBreakdown || [];
  if (countBadge) countBadge.innerText = `(إجمالي دورات المشروع: ${months.length} أشهر مالية)`;

  if (months.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-xs text-zinc-400">لا توجد بيانات تدفقات نقدية مسجلة.</td></tr>`;
    return;
  }

  const sym = CURRENCY_SYMBOLS[cf.currency] || cf.currency || "ر.س";

  tbody.innerHTML = months.map(m => {
    const isNetPositive = m.netFlow >= 0;
    const isCumulativePositive = m.cumulativeNet >= 0;
    const statusClass = m.status.includes('Paid') ? 'badge-completed' : m.status.includes('Review') ? 'badge-inprogress' : 'badge-pending';

    return `
      <tr class="hover:bg-zinc-50 transition">
        <td class="text-center font-mono text-xs font-bold text-zinc-400">M${String(m.monthIndex).padStart(2, '0')}</td>
        <td class="text-xs font-bold text-zinc-900 whitespace-nowrap">${m.monthLabel}</td>
        <td class="text-center font-bold text-xs text-zinc-700">${m.progressPct}%</td>
        <td class="text-center">
          <div class="inline-flex items-center gap-1.5">
            <div class="w-12 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
              <div class="bg-amber-500 h-full rounded-full" style="width: ${m.cumulativeProgressPct}%"></div>
            </div>
            <span class="text-xs font-black text-amber-800">${m.cumulativeProgressPct}%</span>
          </div>
        </td>
        <td class="font-mono text-xs font-medium text-zinc-600 whitespace-nowrap">${new Intl.NumberFormat('en-US').format(m.plannedValue)} ${sym}</td>
        <td class="font-mono text-xs font-bold text-emerald-700 whitespace-nowrap">${new Intl.NumberFormat('en-US').format(m.inflow)} ${sym}</td>
        <td class="font-mono text-xs font-bold text-rose-700 whitespace-nowrap">${new Intl.NumberFormat('en-US').format(m.outflow)} ${sym}</td>
        <td class="font-mono text-xs font-black whitespace-nowrap ${isNetPositive ? 'text-emerald-700' : 'text-rose-700'}">
          ${isNetPositive ? '+' : ''}${new Intl.NumberFormat('en-US').format(m.netFlow)} ${sym}
        </td>
        <td class="font-mono text-xs font-bold whitespace-nowrap ${isCumulativePositive ? 'text-zinc-900' : 'text-rose-600'}">
          ${new Intl.NumberFormat('en-US').format(m.cumulativeNet)} ${sym}
        </td>
        <td class="text-center">
          <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${statusClass}">${m.statusAr || m.status}</span>
        </td>
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

// 13. Multi-File Upload and AI Analysis System
let selectedUploadFiles = [];

function getFileIcon(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📄';
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return '📊';
  if (ext === 'docx' || ext === 'doc') return '📝';
  if (ext === 'txt' || ext === 'json') return '📑';
  return '📁';
}

function getFileCategoryLabel(filename) {
  const name = (filename || '').toLowerCase();
  if (name.includes('boq') || name.includes('كميات') || name.includes('جدول') || name.includes('تسعير')) return 'جدول كميات ومشتريات (BOQ)';
  if (name.includes('spec') || name.includes('شروط') || name.includes('مواصفات') || name.includes('كراسة')) return 'كراسة شروط ومواصفات';
  if (name.includes('schedule') || name.includes('زمني') || name.includes('خطة') || name.includes('primavera') || name.includes('mpp')) return 'جدول زمني ومسار حرج';
  if (name.includes('contract') || name.includes('عقد') || name.includes('اتفاقية')) return 'عقد ومشروع';
  if (name.includes('mom') || name.includes('اجتماع') || name.includes('محضر') || name.includes('قرارات')) return 'محضر وقرارات معلقة';
  return 'مستند مشروع عام';
}

function addFilesToUploadQueue(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!selectedUploadFiles.some(f => f.name === file.name && f.size === file.size)) {
      selectedUploadFiles.push(file);
    }
  }
  renderUploadFilesQueue();
}

function removeFileFromUploadQueue(index) {
  selectedUploadFiles.splice(index, 1);
  renderUploadFilesQueue();
}

function clearSelectedFilesQueue() {
  selectedUploadFiles = [];
  const fileInput = document.getElementById("file-input");
  if (fileInput) fileInput.value = "";
  renderUploadFilesQueue();
}

function renderUploadFilesQueue() {
  const queueContainer = document.getElementById("selected-files-queue");
  const listEl = document.getElementById("selected-files-list");
  const countBadge = document.getElementById("selected-files-count-badge");
  const startBtn = document.getElementById("btn-start-multi-analysis");

  if (!queueContainer || !listEl) return;

  if (selectedUploadFiles.length === 0) {
    queueContainer.classList.add("hidden");
    return;
  }

  queueContainer.classList.remove("hidden");
  if (countBadge) countBadge.innerText = `${selectedUploadFiles.length} ملفات`;
  if (startBtn) startBtn.innerHTML = `<span>🚀</span> بدء التحليل والدمج الذكي (${selectedUploadFiles.length} ملفات)`;

  listEl.innerHTML = selectedUploadFiles.map((file, idx) => {
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
    const icon = getFileIcon(file.name);
    const tag = getFileCategoryLabel(file.name);

    return `
      <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-200 shadow-xs hover:border-zinc-300 transition">
        <div class="flex items-center gap-3 overflow-hidden">
          <span class="text-xl shrink-0">${icon}</span>
          <div class="truncate">
            <div class="font-bold text-zinc-950 text-xs truncate">${file.name}</div>
            <div class="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
              <span>${sizeStr}</span>
              <span>•</span>
              <span class="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">${tag}</span>
            </div>
          </div>
        </div>
        <button type="button" onclick="removeFileFromUploadQueue(${idx})" class="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 font-bold" title="إزالة الملف">
          ✕
        </button>
      </div>
    `;
  }).join('');
}

function initUploadHandlers() {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-zinc-800", "bg-zinc-100/80");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-zinc-800", "bg-zinc-100/80");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-zinc-800", "bg-zinc-100/80");
    if (e.dataTransfer.files.length > 0) {
      addFilesToUploadQueue(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      addFilesToUploadQueue(e.target.files);
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

async function startMultiFileAnalysis() {
  if (selectedUploadFiles.length === 0) {
    alert("⚠️ يرجى اختيار ملف واحد على الأقل للبدء في التحليل.");
    return;
  }

  if (!window.projectsStore?.canCreateProject()) {
    openSubscriptionModal();
    alert("⚠️ لقد استنفدت التجربة المجانية لمشروع واحد.\n\nلإضافة ودمج مشاريع جديدة غير محدودة، يرجى تفعيل باقة الاشتراك الشامل بـ 174 ر.س / شهرياً.");
    return;
  }

  const uploadStatus = document.getElementById("upload-status");
  uploadStatus.classList.remove("hidden");

  const apiKey = geminiService.getApiKey();
  const fileCount = selectedUploadFiles.length;

  uploadStatus.innerHTML = `
    <div class="flex items-start gap-3 text-zinc-900 bg-amber-50/80 p-5 rounded-2xl border border-amber-200 shadow-sm">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 shrink-0 mt-0.5"></div>
      <div class="space-y-1">
        <p class="font-black text-xs sm:text-sm text-zinc-950">جاري قراءة واستخراج نصوص (${fileCount} مستندات)...</p>
        <p class="text-xs text-zinc-600">يقوم المحلل بربط كراسة المواصفات مع جدول الكميات BOQ والجدول الزمني بالذكاء الاصطناعي...</p>
      </div>
    </div>
  `;

  try {
    const formData = new FormData();
    selectedUploadFiles.forEach(file => {
      formData.append("projectFiles", file);
    });

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
      throw new Error(err.error || err.message || "فشل تحليل ودمج الملفات");
    }

    const data = await res.json();
    const newProjectRecord = window.projectsStore?.createProject(data.projectData);

    // Clear queue after success
    clearSelectedFilesQueue();
    refreshAppState();
    switchTab("daily");

    uploadStatus.innerHTML = `
      <div class="text-emerald-800 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 font-bold space-y-1">
        <div class="flex items-center gap-2">
          <span>✅</span>
          <span>تم تحليل ودمج (${fileCount}) ملفات بنجاح وتوليد ${scheduler.tasks.length} مهمة مجدولة والمشتريات والتدفق النقدي!</span>
        </div>
        ${data.warning ? `<p class="text-xs font-normal text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">💡 ${data.warning}</p>` : ''}
      </div>
    `;
  } catch (error) {
    console.error("Multi-upload error:", error);
    uploadStatus.innerHTML = `
      <div class="text-rose-800 bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-2">
        <p class="font-bold">❌ حدث خطأ أثناء تحليل ودمج الملفات:</p>
        <p class="text-xs">${error.message}</p>
        <p class="text-xs text-zinc-600 pt-1 border-t border-rose-200">
          💡 تلميح: تأكد من إدخال مفتاح <strong>Gemini API Key</strong> من أيقونة الإعدادات (⚙️) بالأعلى لقراءة ودمج الملفات الضخمة بدقة قصوى.
        </p>
      </div>
    `;
  }
}

async function handleUploadedFile(file) {
  addFilesToUploadQueue([file]);
  startMultiFileAnalysis();
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
    window.location.replace("landing.html");
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
  const moyasarKeyInput = document.getElementById("input-moyasar-key");

  openBtn?.addEventListener("click", () => {
    if (apiKeyInput) apiKeyInput.value = geminiService.getApiKey();
    if (moyasarKeyInput && window.paymentService) moyasarKeyInput.value = window.paymentService.config.publishableKey || "";
    modal.classList.remove("hidden");
  });

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));

  saveBtn?.addEventListener("click", () => {
    if (apiKeyInput) {
      geminiService.setApiKey(apiKeyInput.value);
    }
    if (moyasarKeyInput && window.paymentService) {
      const key = moyasarKeyInput.value.trim();
      window.paymentService.saveConfig({ publishableKey: key, isLive: key.startsWith("pk_live_") });
    }
    alert("✅ تم حفظ إعدادات الذكاء الاصطناعي وبوابة الدفع بنجاح!");
    modal.classList.add("hidden");
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

// 15. AI Work Plan Generator Modal
function initWorkPlanGeneratorModal() {
  const modal = document.getElementById("workplan-generator-modal");
  const closeBtn = document.getElementById("btn-close-workplan-modal");
  const form = document.getElementById("workplan-form");
  const startDateInput = document.getElementById("wp-start-date");

  if (startDateInput && !startDateInput.value) {
    startDateInput.value = new Date().toISOString().split('T')[0];
  }

  closeBtn?.addEventListener("click", () => modal?.classList.add("hidden"));

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("wp-project-name")?.value || "مشروع هندسي جديد";
    const domain = document.getElementById("wp-domain")?.value || "construction";
    const duration = parseInt(document.getElementById("wp-duration")?.value, 10) || 180;
    const startDate = document.getElementById("wp-start-date")?.value || new Date().toISOString().split('T')[0];
    const workDays = parseInt(document.getElementById("wp-workdays")?.value, 10) || 6;
    const client = document.getElementById("wp-client")?.value || "مالك المشروع / العميل";
    const contractor = document.getElementById("wp-contractor")?.value || "المقاول المنفذ";
    const scopeText = document.getElementById("wp-scope-text")?.value || "";

    try {
      const generatedProjectData = PMTaskScheduler.generateCompleteWorkPlan({
        projectName: name,
        projectNameEn: name,
        domain: domain,
        startDate: startDate,
        durationDays: duration,
        client: client,
        contractor: contractor,
        scopeText: scopeText,
        workDaysPerWeek: workDays
      });

      const newProject = window.projectsStore?.createProject(generatedProjectData);
      modal?.classList.add("hidden");
      refreshAppState();
      switchTab("daily");

      alert(`🎉 تم توليد خطة العمل والجدول الزمني بنجاح!\n\nتم إنشاء ${generatedProjectData.dailyTasks.length} مهمة مجدولة على مدار ${duration} يوماً موزعة على 6 مراحل PMP، مع بناء جداول المشتريات والمعالم الرئيسية.`);
    } catch (err) {
      alert("⚠️ حدث خطأ أثناء توليد خطة العمل: " + err.message);
    }
  });
}

function openWorkPlanGeneratorModal(prefill = {}) {
  if (!window.projectsStore?.canCreateProject()) {
    openSubscriptionModal();
    alert("⚠️ لقد استنفدت التجربة المجانية لمشروع واحد.\n\nلتوليد وإنشاء مشاريع جديدة غير محدودة بالذكاء الاصطناعي، يرجى تفعيل باقة الاشتراك الشامل بـ 174 ر.س / شهرياً.");
    return;
  }

  const modal = document.getElementById("workplan-generator-modal");
  if (!modal) return;

  const nameInput = document.getElementById("wp-project-name");
  const startDateInput = document.getElementById("wp-start-date");
  const clientInput = document.getElementById("wp-client");
  const contractorInput = document.getElementById("wp-contractor");
  const scopeInput = document.getElementById("wp-scope-text");

  if (currentProject && !prefill.name) {
    const info = currentProject.projectInfo || {};
    if (nameInput) nameInput.value = info.projectNameAr || info.projectName || "";
    if (startDateInput) startDateInput.value = info.startDate || new Date().toISOString().split('T')[0];
    if (clientInput) clientInput.value = info.client || "";
    if (contractorInput) contractorInput.value = info.contractor || "";
    if (scopeInput && currentProject.description) scopeInput.value = currentProject.description;
  } else if (prefill.name) {
    if (nameInput) nameInput.value = prefill.name;
    if (startDateInput) startDateInput.value = prefill.startDate || new Date().toISOString().split('T')[0];
    if (scopeInput) scopeInput.value = prefill.scope || "";
  } else {
    if (startDateInput && !startDateInput.value) startDateInput.value = new Date().toISOString().split('T')[0];
  }

  modal.classList.remove("hidden");
}

// 16. Budget & Cash Flow Settings Modal
function initBudgetModal() {
  const modal = document.getElementById("budget-modal");
  const closeBtn = document.getElementById("btn-close-budget");
  const form = document.getElementById("budget-form");
  const currencySelect = document.getElementById("budget-currency");
  const marginInput = document.getElementById("budget-profit-margin");
  const costInput = document.getElementById("budget-cost-ratio");

  closeBtn?.addEventListener("click", () => modal?.classList.add("hidden"));
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  currencySelect?.addEventListener("change", (e) => {
    const sym = CURRENCY_SYMBOLS[e.target.value] || e.target.value;
    const label = document.getElementById("budget-currency-symbol-label");
    if (label) label.innerText = sym;
  });

  marginInput?.addEventListener("input", (e) => {
    const margin = parseFloat(e.target.value) || 0;
    if (costInput && margin >= 0 && margin <= 90) {
      costInput.value = 100 - margin;
    }
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentProject) return;

    const contractValue = parseFloat(document.getElementById("budget-contract-value")?.value) || 5400000;
    const currency = document.getElementById("budget-currency")?.value || "SAR";
    const advancePaymentPct = parseFloat(document.getElementById("budget-advance-percent")?.value) || 10;
    const retentionPct = parseFloat(document.getElementById("budget-retention-percent")?.value) || 10;
    const marginPct = parseFloat(document.getElementById("budget-profit-margin")?.value) || 20;
    const costRatioPct = parseFloat(document.getElementById("budget-cost-ratio")?.value) || 80;

    currentProject.financialConfig = {
      contractValue: contractValue,
      currency: currency,
      advancePaymentPct: advancePaymentPct,
      retentionPct: retentionPct,
      marginPct: marginPct,
      costRatio: costRatioPct / 100
    };

    if (currentProject.projectInfo) {
      currentProject.projectInfo.budget = contractValue;
    }

    saveActiveProjectState();
    modal?.classList.add("hidden");
    renderCashFlowView();
    alert("✅ تم حفظ وتطبيق إعدادات ميزانية المشروع والتدفق النقدي بنجاح!");
  });
}

function openBudgetModal() {
  if (!currentProject) {
    alert("⚠️ يرجى اختيار أو رفع مشروع أولاً لتعديل ميزانيته.");
    return;
  }
  const modal = document.getElementById("budget-modal");
  if (!modal) return;

  const cfg = currentProject.financialConfig || {};
  const info = currentProject.projectInfo || {};

  const contractValInput = document.getElementById("budget-contract-value");
  const currencySelect = document.getElementById("budget-currency");
  const advInput = document.getElementById("budget-advance-percent");
  const retInput = document.getElementById("budget-retention-percent");
  const marginInput = document.getElementById("budget-profit-margin");
  const costInput = document.getElementById("budget-cost-ratio");
  const symLabel = document.getElementById("budget-currency-symbol-label");

  if (contractValInput) contractValInput.value = cfg.contractValue || info.budget || 5400000;
  if (currencySelect) currencySelect.value = cfg.currency || "SAR";
  if (advInput) advInput.value = cfg.advancePaymentPct !== undefined ? cfg.advancePaymentPct : 10;
  if (retInput) retInput.value = cfg.retentionPct !== undefined ? cfg.retentionPct : 10;
  if (marginInput) marginInput.value = cfg.marginPct !== undefined ? cfg.marginPct : 20;
  if (costInput) costInput.value = cfg.costRatio !== undefined ? Math.round(cfg.costRatio * 100) : 80;

  const cur = currencySelect ? currencySelect.value : "SAR";
  if (symLabel) symLabel.innerText = CURRENCY_SYMBOLS[cur] || cur;

  modal.classList.remove("hidden");
}

// 17. Attach Additional Files to Existing Project
let selectedAttachFiles = [];

function initAttachFilesModal() {
  const modal = document.getElementById("attach-files-modal");
  const closeBtn = document.getElementById("btn-close-attach-modal");
  const dropZone = document.getElementById("attach-drop-zone");
  const fileInput = document.getElementById("attach-file-input");

  closeBtn?.addEventListener("click", () => modal?.classList.add("hidden"));
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  dropZone?.addEventListener("click", () => fileInput?.click());

  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-zinc-800", "bg-zinc-100");
  });

  dropZone?.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-zinc-800", "bg-zinc-100");
  });

  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-zinc-800", "bg-zinc-100");
    if (e.dataTransfer.files.length > 0) {
      addAttachFiles(e.dataTransfer.files);
    }
  });

  fileInput?.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      addAttachFiles(e.target.files);
    }
  });
}

function openAttachFilesModal() {
  if (!currentProject) {
    alert("⚠️ يرجى اختيار أو فتح مشروع أولاً لإرفاق ملفات إضافية إليه.");
    return;
  }
  selectedAttachFiles = [];
  renderAttachFilesQueue();
  const statusEl = document.getElementById("attach-status");
  if (statusEl) statusEl.classList.add("hidden");
  document.getElementById("attach-files-modal")?.classList.remove("hidden");
}

function addAttachFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!selectedAttachFiles.some(f => f.name === file.name && f.size === file.size)) {
      selectedAttachFiles.push(file);
    }
  }
  renderAttachFilesQueue();
}

function removeAttachFile(idx) {
  selectedAttachFiles.splice(idx, 1);
  renderAttachFilesQueue();
}

function renderAttachFilesQueue() {
  const container = document.getElementById("attach-files-list-container");
  const itemsEl = document.getElementById("attach-files-items");
  const countEl = document.getElementById("attach-files-count");

  if (!container || !itemsEl) return;

  if (selectedAttachFiles.length === 0) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  if (countEl) countEl.innerText = `${selectedAttachFiles.length} ملفات`;

  itemsEl.innerHTML = selectedAttachFiles.map((f, i) => `
    <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-zinc-200 shadow-xs">
      <div class="flex items-center gap-2 truncate">
        <span>${getFileIcon(f.name)}</span>
        <span class="font-bold text-zinc-900 text-xs truncate">${f.name}</span>
        <span class="text-[10px] text-zinc-400">(${(f.size / 1024).toFixed(1)} KB)</span>
      </div>
      <button type="button" onclick="removeAttachFile(${i})" class="text-zinc-400 hover:text-rose-600 font-bold p-1">✕</button>
    </div>
  `).join('');
}

async function handleEnrichCurrentProject() {
  if (!currentProject) return;
  if (selectedAttachFiles.length === 0) {
    alert("⚠️ يرجى اختيار ملف إضافي واحد على الأقل للإرفاق.");
    return;
  }

  const statusEl = document.getElementById("attach-status");
  const submitBtn = document.getElementById("btn-submit-attach");
  if (statusEl) statusEl.classList.remove("hidden");

  statusEl.innerHTML = `
    <div class="flex items-center gap-2 text-zinc-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-bold">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-950"></div>
      <span>جاري قراءة الملفات الجديدة ودمجها مع نطاق المشروع بالذكاء الاصطناعي...</span>
    </div>
  `;
  if (submitBtn) submitBtn.disabled = true;

  try {
    const formData = new FormData();
    selectedAttachFiles.forEach(f => formData.append("projectFiles", f));
    formData.append("existingProject", JSON.stringify(currentProject));

    const apiKey = geminiService.getApiKey();
    const headers = {};
    if (apiKey) headers["x-gemini-key"] = apiKey;

    const res = await fetch("/api/enrich-project", {
      method: "POST",
      headers: headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "فشل إرفاق ودمج الملفات");
    }

    const data = await res.json();
    if (data.projectData) {
      currentProject = data.projectData;
      scheduler = new PMTaskScheduler(currentProject);
      saveActiveProjectState();
      refreshAppState();
    }

    document.getElementById("attach-files-modal")?.classList.add("hidden");
    alert(`🎉 تم إرفاق ودمج (${selectedAttachFiles.length}) ملفات بنجاح في المشروع الحالي! تم تحديث المهام وجداول المشتريات والمعالم.`);
    selectedAttachFiles = [];
  } catch (err) {
    console.error("Enrich error:", err);
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
          ❌ خطأ: ${err.message}
        </div>
      `;
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}
