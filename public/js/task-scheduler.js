/**
 * AI PM Task Scheduler Engine
 * خوارزمية ذكية وديناميكية لتوزيع مهام أي مشروع يومياً بناءً على بيانات ونطاق المشروع الحقيقي المستخرج بالـ AI
 */

class PMTaskScheduler {
  constructor(projectData) {
    this.project = projectData || {};
    this.tasks = [];
    this.initSchedule();
  }

  initSchedule() {
    this.tasks = this.generateDailySchedule(this.project);
  }

  /**
   * خوارزمية توليد وتوزيع المهام اليومية بناءً على معالم ومشتريات ونطاق المشروع الحقيقي
   */
  generateDailySchedule(proj) {
    // 1. إذا كان الذكاء الاصطناعي قد استخرج المهام اليومية المخصصة للمشروع مسبقاً، نستخدمها مباشرة
    if (proj.dailyTasks && Array.isArray(proj.dailyTasks) && proj.dailyTasks.length > 0) {
      return proj.dailyTasks.map((t, idx) => ({
        id: t.id || `TSK-${String(idx + 1).padStart(4, '0')}`,
        date: t.date || proj.projectInfo?.startDate || "2026-01-01",
        phase: t.phase || "Project Execution",
        category: t.category || "Engineering",
        titleAr: t.titleAr || t.title || t.taskName || "مهمة تنفيذية",
        titleEn: t.titleEn || t.title || t.taskName || "Executive Task",
        owner: t.owner || "Project Manager",
        facility: t.facility || "Site / الموقع",
        priority: t.priority || "High",
        status: t.status || "Pending",
        progress: t.progress || (t.status === 'Completed' ? 100 : t.status === 'In Progress' ? 50 : 0),
        deliverable: t.deliverable || "تقرير ومخرج العمل"
      }));
    }

    const dailyTasks = [];
    const info = proj.projectInfo || {};
    const startDate = info.startDate || "2026-01-01";
    const finishDate = info.finishDate || "2026-12-31";

    // 2. توليد ديناميكي بحت من المعالم والأنظمة والمشتريات الحقيقية المذكورة في ملف المستخدم
    
    // أ) مهام انطلاق المشروع والتهيئة (Mobilization)
    dailyTasks.push({
      date: startDate,
      phase: "Mobilization & Kick-off",
      category: "Management",
      titleAr: `عقد الاجتماع التنسيقي لانطلاق مشروع: ${info.projectNameAr || info.projectName || 'المشروع'} واعتماد خطة العمل`,
      titleEn: `Conduct Project Kick-off Meeting for: ${info.projectName || 'Project'} & Finalize Project Management Plan`,
      owner: "Project Manager",
      facility: "General / عام",
      priority: "Critical",
      status: "Completed",
      deliverable: "Signed Kick-off Minutes & Project Charter",
      progress: 100
    });

    // ب) مهام مستخرجة من المعالم الرئيسية الحقيقية للمشروع (Key Milestones)
    if (proj.keyMilestones && Array.isArray(proj.keyMilestones) && proj.keyMilestones.length > 0) {
      proj.keyMilestones.forEach((m, idx) => {
        // مهمة عند بداية المعلم
        dailyTasks.push({
          date: m.startDate || startDate,
          phase: "Milestone Execution",
          category: "Planning & Engineering",
          titleAr: `بدء تنفيذ أنشطة المعلم الرئيسي: ${m.name}`,
          titleEn: `Commence activities for milestone: ${m.name}`,
          owner: m.owner || "Technical Lead",
          facility: "Project Site",
          priority: m.status === 'Critical' ? 'Critical' : 'High',
          status: m.status === 'Completed' ? 'Completed' : m.status === 'In Progress' ? 'In Progress' : 'Pending',
          deliverable: `Milestone Commencement Transmittal (${m.weight || '10%'})`,
          progress: m.status === 'Completed' ? 100 : m.status === 'In Progress' ? 50 : 0
        });

        // مهمة عند نهاية/تسليم المعلم
        if (m.finishDate && m.finishDate !== m.startDate) {
          dailyTasks.push({
            date: m.finishDate,
            phase: "Milestone Completion",
            category: "QA/QC & Delivery",
            titleAr: `استكمال ومراجعة مخرجات وتسليمات المعلم: ${m.name}`,
            titleEn: `Finalize and deliver outputs for milestone: ${m.name}`,
            owner: m.owner || "Project Manager",
            facility: "Project Site",
            priority: "Critical",
            status: m.status === 'Completed' ? 'Completed' : 'Pending',
            deliverable: `Consultant Approval & Milestone Sign-off Sheet`,
            progress: m.status === 'Completed' ? 100 : 0
          });
        }
      });
    }

    // ج) مهام مستخرجة من بنود المواد والمشتريات الحقيقية (Material Submittals & Procurement)
    if (proj.materialSubmittals && Array.isArray(proj.materialSubmittals) && proj.materialSubmittals.length > 0) {
      proj.materialSubmittals.forEach((mts) => {
        if (mts.submissionDate) {
          dailyTasks.push({
            date: mts.submissionDate,
            phase: "Engineering & Procurement",
            category: "Material Submittal (MTS)",
            titleAr: `تقديم واعتماد عينات ومواصفات مادة/نظام: ${mts.item}`,
            titleEn: `Submit Material Submittal & Compliance for: ${mts.item}`,
            owner: "Technical Manager",
            facility: "Engineering Office",
            priority: mts.critical ? "Critical" : "High",
            status: mts.status === 'A' || mts.status === 'B' ? 'Completed' : 'In Progress',
            deliverable: `MTS Package (Status Code: ${mts.status || 'B'})`,
            progress: mts.status === 'A' || mts.status === 'B' ? 100 : 40
          });
        }

        if (mts.requiredSite) {
          dailyTasks.push({
            date: mts.requiredSite,
            phase: "Site Delivery & Logistics",
            category: "Material Receiving",
            titleAr: `وصول واستلام وفحص توريدات مادة/نظام: ${mts.item} في الموقع`,
            titleEn: `Site Delivery & Material Inspection Request (MIR) for: ${mts.item}`,
            owner: "Procurement Manager",
            facility: "Main Warehouse / Site",
            priority: mts.critical ? "Critical" : "High",
            status: "Pending",
            deliverable: `Material Inspection Request (MIR) Sign-off`,
            progress: 0
          });
        }
      });
    }

    // د) مهام مستخرجة من بنود نطاق العمل (Scope Systems)
    if (proj.scopeSystems && Array.isArray(proj.scopeSystems) && proj.scopeSystems.length > 0) {
      proj.scopeSystems.forEach((sys) => {
        const sysItems = Array.isArray(sys.items) ? sys.items.join("، ") : (sys.items || "");
        dailyTasks.push({
          date: finishDate,
          phase: "Site Testing & Integration",
          category: sys.title || "Systems",
          titleAr: `الفحص النهائي والتشغيل التجريبي لنظام: ${sys.title} (${sysItems.substring(0, 80)})`,
          titleEn: `Final Testing & Commissioning for: ${sys.title}`,
          owner: "Lead Site Engineer",
          facility: "Project Site",
          priority: "High",
          status: "Pending",
          deliverable: `System Testing & Commissioning Certificate`,
          progress: 0
        });
      });
    }

    // هـ) مهام مستخرجة من القرارات والبنود المعلقة (Action Items)
    if (proj.actionItems && Array.isArray(proj.actionItems) && proj.actionItems.length > 0) {
      proj.actionItems.forEach((act) => {
        dailyTasks.push({
          date: act.targetDate || startDate,
          phase: "Action Items & Coordination",
          category: "Coordination",
          titleAr: `متابعة إغلاق البند المعلق: ${act.taskAr || act.task}`,
          titleEn: `Resolve Action Item: ${act.task || act.taskAr}`,
          owner: act.owner || "Project Manager",
          facility: "Management",
          priority: act.priority || "High",
          status: act.status || "Open",
          deliverable: `Action Item Resolution Report`,
          progress: act.status === 'Completed' ? 100 : 25
        });
      });
    }

    // و) مهمة التسليم النهائي (Final Handover)
    dailyTasks.push({
      date: finishDate,
      phase: "Closing Out & Handover",
      category: "Final Handover",
      titleAr: `الفحص النهائي وتوقيع محضر الاستلام الابتدائي (TOC) وإغلاق مشروع: ${info.projectNameAr || info.projectName || 'المشروع'}`,
      titleEn: `Final Handover, Taking-Over Certificate (TOC) Sign-off for: ${info.projectName || 'Project'}`,
      owner: "Project Director",
      facility: "Entire Project Site",
      priority: "Critical",
      status: "Pending",
      deliverable: "Signed Taking-Over Certificate (TOC) & As-Built Transmittals",
      progress: 0
    });

    // Sort chronologically by date
    dailyTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Re-index task IDs sequentially
    dailyTasks.forEach((t, i) => {
      t.id = `TSK-${String(i + 1).padStart(4, '0')}`;
    });

    return dailyTasks;
  }

  // Helper Methods for UI Filtering and Queries
  getAllTasks() {
    return this.tasks;
  }

  getTasksForDate(dateStr) {
    return this.tasks.filter(t => t.date === dateStr);
  }

  getTasksForDateRange(startDateStr, endDateStr) {
    const s = new Date(startDateStr);
    const e = new Date(endDateStr);
    return this.tasks.filter(t => {
      const d = new Date(t.date);
      return d >= s && d <= e;
    });
  }

  getTasksForMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.tasks.filter(t => t.date.startsWith(prefix));
  }

  getTasksByPhase(phase) {
    return this.tasks.filter(t => t.phase === phase);
  }

  getTasksByOwner(owner) {
    return this.tasks.filter(t => t.owner === owner);
  }

  getProjectKPIs() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.status === 'Completed').length;
    const inProgress = this.tasks.filter(t => t.status === 'In Progress').length;
    const pending = this.tasks.filter(t => t.status === 'Pending').length;
    const critical = this.tasks.filter(t => t.priority === 'Critical').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      pendingTasks: pending,
      criticalTasks: critical,
      completionRate: completionRate,
      projectStartDate: this.project.projectInfo?.startDate || "2026-01-01",
      projectFinishDate: this.project.projectInfo?.finishDate || "2026-12-31",
      totalDurationDays: this.project.projectInfo?.totalScheduleDays || 365
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PMTaskScheduler };
}
