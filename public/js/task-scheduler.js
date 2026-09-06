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

  // Static AI Work Plan Generator from Scope
  static generateCompleteWorkPlan({
    projectName = "مشروع هندسي جديد",
    projectNameEn = "New Engineering Project",
    domain = "construction",
    startDate = new Date().toISOString().split('T')[0],
    durationDays = 180,
    client = "مالك المشروع / العميل",
    contractor = "المقاول المنفذ",
    scopeText = "",
    workDaysPerWeek = 6
  } = {}) {
    const start = new Date(startDate);
    const duration = parseInt(durationDays, 10) || 180;
    const end = new Date(start.getTime() + duration * 86400000);
    const finishDate = end.toISOString().split('T')[0];

    const calcDate = (ratio) => {
      const d = new Date(start.getTime() + Math.round(duration * ratio) * 86400000);
      return d.toISOString().split('T')[0];
    };

    // Extract custom scope lines if provided
    const customLines = (scopeText || "")
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 3);

    // Domain Presets
    const domainPresets = {
      construction: {
        titleAr: "مشاريع الإنشاءات والمقاولات المدنية",
        facilities: [{ id: "BLD-01", name: "المبنى الرئيسي والموقع العام", floors: "قبو + أرضي + متكرر", rooms: 0, type: "Commercial / Residential" }],
        scopeSystems: [
          { code: "CIV-01", title: "الأعمال الترابية والخرسانات", items: ["الحفر والإحلال", "القواعد والأساسات", "الأعمدة والأسقف الخرسانية"] },
          { code: "ARC-01", title: "أعمال البلوك والعزل والمباني", items: ["بناء البلوك", "العزل المائي والحراري", "اللياسة الداخلية والخارجية"] },
          { code: "FIN-01", title: "أعمال الواجهات والتشطيبات", items: ["الواجهات الزجاجية والكلادينج", "أعمال البلاط والأرضيات", "الدهانات والأبواب"] }
        ],
        milestones: [
          { name: "اعتماد المخططات التنفيذية وإصدار رخص الموقع", ratio: 0.10, weight: "15%", owner: "Project Manager" },
          { name: "إتمام صب القواعد والهيكل الخرساني بالكامل", ratio: 0.45, weight: "35%", owner: "Structural Engineer" },
          { name: "إتمام أعمال المباني والعزل واللياسة والتمديدات", ratio: 0.75, weight: "25%", owner: "Site Engineer" },
          { name: "الفحص النهائي والتسليم الابتدائي للمشروع (TOC)", ratio: 1.0, weight: "25%", owner: "Project Director" }
        ],
        submittals: [
          { item: "اعتماد وتوريد حديد التسليح والخرسانة الجاهزة", lead: "2-4 weeks", code: "A", statusName: "Approved", critical: true, subRatio: 0.05, siteRatio: 0.15 },
          { item: "اعتماد أنظمة العزل المائي للأساسات والأسطح", lead: "3-5 weeks", code: "A", statusName: "Approved", critical: false, subRatio: 0.10, siteRatio: 0.25 },
          { item: "اعتماد وتوريد قطاعات الألمنيوم والواجهات الزجاجية (Long Lead)", lead: "8-12 weeks", code: "B", statusName: "Approved as Noted", critical: true, subRatio: 0.15, siteRatio: 0.55 },
          { item: "اعتماد أبواب الطوارئ المقاومة للحريق والأبواب الخشبية", lead: "6-8 weeks", code: "B", statusName: "Approved as Noted", critical: false, subRatio: 0.25, siteRatio: 0.65 }
        ],
        coreTasks: [
          { phase: "Mobilization & Kick-off", titleAr: "عقد اجتماع الانطلاق واستلام الموقع وتثبيت النقاط المساحية", titleEn: "Site Handover & Benchmark Survey", owner: "Project Manager", prio: "Critical", ratio: 0.02 },
          { phase: "Engineering & Submittals", titleAr: "تقديم واعتماد المخططات التنفيذية (Shop Drawings) للهيكل الإنشائي", titleEn: "Structural Shop Drawings Approval", owner: "Planning Engineer", prio: "High", ratio: 0.08 },
          { phase: "Site Execution", titleAr: "تنفيذ أعمال الحفر والدمك وصب خرسانة النظافة والقواعد", titleEn: "Excavation, Blinding & Foundation Pouring", owner: "Site Engineer", prio: "Critical", ratio: 0.20 },
          { phase: "Site Execution", titleAr: "صب الأعمدة وجدران القص وبلاطات الأسقف الخرسانية", titleEn: "Columns & Slab Concrete Pouring", owner: "Site Engineer", prio: "Critical", ratio: 0.38 },
          { phase: "Site Execution", titleAr: "تنفيذ أعمال بناء البلوك الداخلي والخارجي وتثبيت العتبات", titleEn: "Blockwork & Lintel Installation", owner: "Site Engineer", prio: "High", ratio: 0.50 },
          { phase: "Site Execution", titleAr: "تنفيذ أعمال العزل المائي وفحص الغمر بالماء 48 ساعة", titleEn: "Waterproofing & 48h Ponding Test", owner: "QA/QC Engineer", prio: "Critical", ratio: 0.62 },
          { phase: "Site Execution", titleAr: "تنفيذ أعمال اللياسة والجبس وتركيب بلاط الأرضيات", titleEn: "Plastering, Gypsum & Tiling Works", owner: "Site Engineer", prio: "Medium", ratio: 0.75 },
          { phase: "Testing & Commissioning", titleAr: "الفحوصات الهندسية الشاملة واختبارات الجودة والسلامة", titleEn: "Comprehensive QC & Safety Inspection", owner: "QA/QC Manager", prio: "Critical", ratio: 0.90 },
          { phase: "Handover & Closeout", titleAr: "معالجة بنود الملاحظات (Snag List) وتوقيع الاستلام الابتدائي TOC", titleEn: "Snag List Clearance & Taking-Over Certificate", owner: "Project Director", prio: "Critical", ratio: 1.0 }
        ]
      },

      fitout: {
        titleAr: "مشاريع التشطيبات والديكور الداخلي والتأثيث",
        facilities: [{ id: "FIT-01", name: "المساحات الداخلية والمكاتب/الأجنحة", floors: "أدوار التشطيب", rooms: 0, type: "Fit-Out & Interior" }],
        scopeSystems: [
          { code: "INT-01", title: "أعمال القواطع والأسقف الجبسية", items: ["القواطع الجبسية العازلة للحرائق", "الأسقف المعلقة", "أعمال الدهانات الديكورية"] },
          { code: "FLR-01", title: "أعمال الأرضيات والرخام والباركيه", items: ["الأرضيات الرخامية", "أرضيات الباركيه والفينيل", "الوزرات الديكورية"] },
          { code: "JOIN-01", title: "الأعمال الخشبية والتأثيث والتكسيات", items: ["الأبواب الديكورية", "التكسيات الجدارية (Wall Cladding)", "الأثاث المكتبي والمفروشات"] }
        ],
        milestones: [
          { name: "اعتماد عينات المواد ومخططات التصميم الداخلي المعتمدة", ratio: 0.10, weight: "20%", owner: "Interior Architect" },
          { name: "إتمام القواطع الجبسية والأسقف وتأسيسات الكهرباء والتكييف", ratio: 0.50, weight: "30%", owner: "Fit-Out Engineer" },
          { name: "إتمام تركيب الرخام والدهانات والتكسيات الخشبية", ratio: 0.80, weight: "30%", owner: "Site Engineer" },
          { name: "التأثيث والتنظيف العميق والتسليم النهائي للمالك", ratio: 1.0, weight: "20%", owner: "Project Manager" }
        ],
        submittals: [
          { item: "اعتماد عينات الرخام والبورسلان والأرضيات الخشبية", lead: "4-6 weeks", code: "A", statusName: "Approved", critical: false, subRatio: 0.08, siteRatio: 0.35 },
          { item: "اعتماد وحدات الإنارة الديكورية وأنظمة الإضاءة المخفية (Long Lead)", lead: "8-10 weeks", code: "B", statusName: "Approved as Noted", critical: true, subRatio: 0.12, siteRatio: 0.60 },
          { item: "اعتماد وتوريد الأبواب والتكسيات الخشبية المصنعة", lead: "6-8 weeks", code: "B", statusName: "Approved as Noted", critical: true, subRatio: 0.18, siteRatio: 0.68 }
        ],
        coreTasks: [
          { phase: "Mobilization & Kick-off", titleAr: "استلام المساحات ورفع المقاسات الميدانية (As-Built Survey)", titleEn: "Site Survey & Dimensions Verification", owner: "Project Manager", prio: "Critical", ratio: 0.03 },
          { phase: "Engineering & Submittals", titleAr: "تقديم واعتماد الرسومات التنفيذية المعمارية وتفاصيل الديكور", titleEn: "Architectural Shop Drawings Submittal", owner: "Interior Designer", prio: "High", ratio: 0.12 },
          { phase: "Site Execution", titleAr: "تركيب شاسيهات القواطع الجبسية وأعمال الأسقف المستعارة", titleEn: "Gypsum Board Partitions & False Ceilings", owner: "Site Engineer", prio: "High", ratio: 0.35 },
          { phase: "Site Execution", titleAr: "تركيب الأرضيات الرخامية والبورسلان وعمل الجلي والتلميع", titleEn: "Marble & Porcelain Flooring Installation", owner: "Site Engineer", prio: "Critical", ratio: 0.55 },
          { phase: "Site Execution", titleAr: "تنفيذ طبقات المعجون والدهانات الديكورية المعتمدة", titleEn: "Primer, Putty & Decorative Painting", owner: "Site Engineer", prio: "Medium", ratio: 0.70 },
          { phase: "Site Execution", titleAr: "تركيب الأبواب والكسوات الخشبية ووحدات الإنارة والسبوت لايت", titleEn: "Doors, Joinery & Lighting Fixtures Fix", owner: "Site Engineer", prio: "High", ratio: 0.82 },
          { phase: "Testing & Commissioning", titleAr: "الفحص التفصيلي لجودة التشطيب والتنظيف العميق للوحدات", titleEn: "Deep Cleaning & Architectural Quality Check", owner: "QA/QC Engineer", prio: "High", ratio: 0.94 },
          { phase: "Handover & Closeout", titleAr: "تسليم المشروع للمالك وإصدار شهادة الإنجاز النهائي", titleEn: "Final Client Inspection & Handover Sign-off", owner: "Project Manager", prio: "Critical", ratio: 1.0 }
        ]
      },

      mep: {
        titleAr: "مشاريع الأعمال الكهروميكانيكية والتكييف والسباكة (MEP)",
        facilities: [{ id: "MEP-01", name: "غرف الخدمات الميكانيكية وشبكات المبنى", floors: "كافة الأدوار", rooms: 0, type: "MEP Infrastructure" }],
        scopeSystems: [
          { code: "HVAC-01", title: "أنظمة التكييف والتهوية وتصريف الهواء", items: ["وحدات التكييف المركزية (AHUs/FCUs)", "مجاري الهواء (Ductwork)", "مواسير المياه المثلجة (Chilled Water)"] },
          { code: "ELEC-01", title: "أنظمة القوى الكهربائية واللوحات", items: ["لوحات التوزيع الرئيسية (MDBs)", "تمديد الكابلات وتأريض المبنى", "أنظمة الإنارة والمخارج"] },
          { code: "PLUMB-01", title: "أنظمة السباكة ومكافحة الحريق", items: ["شبكة التغذية والصرف الصحي", "شبكة الرش الآلي ومضخات الحريق", "خزانات المياه والمضخات"] }
        ],
        milestones: [
          { name: "اعتماد الحسابات الهندسية ومخططات التنسيق المشترك (CSD)", ratio: 0.15, weight: "20%", owner: "MEP Coordinator" },
          { name: "إتمام التمديدات المعلقة لمجاري الهواء ومواسير الحريق والتغذية", ratio: 0.55, weight: "35%", owner: "Mechanical Lead" },
          { name: "سحب الكابلات وتركيب لوحات الكهرباء ووحدات التكييف", ratio: 0.80, weight: "25%", owner: "Electrical Lead" },
          { name: "اختبارات التوازن الهيدروليكي (TAB) وفحص الدفاع المدني والتسليم", ratio: 1.0, weight: "20%", owner: "Project Manager" }
        ],
        submittals: [
          { item: "اعتماد وتوريد وحدات مناولة الهواء وتبريد المياه (Chillers/AHUs)", lead: "10-14 weeks", code: "A", statusName: "Approved", critical: true, subRatio: 0.05, siteRatio: 0.50 },
          { item: "اعتماد لوحات التوزيع الكهربائية ومفاتيح القواطع الرئيسية (MDBs)", lead: "8-12 weeks", code: "B", statusName: "Approved as Noted", critical: true, subRatio: 0.10, siteRatio: 0.60 },
          { item: "اعتماد مضخات مكافحة الحريق المعتمدة من UL/FM", lead: "8-10 weeks", code: "A", statusName: "Approved", critical: true, subRatio: 0.12, siteRatio: 0.58 }
        ],
        coreTasks: [
          { phase: "Mobilization & Kick-off", titleAr: "عقد الاجتماع التنسيقي المشترك ومراجعة أحمال التكييف والكهرباء", titleEn: "MEP Kickoff & Load Calculation Review", owner: "Project Manager", prio: "Critical", ratio: 0.03 },
          { phase: "Engineering & Submittals", titleAr: "إعداد وتقديم مخططات التنسيق الكهروميكانيكي (Combined Services CSD)", titleEn: "Combined Services Drawings Submittal", owner: "MEP Coordinator", prio: "Critical", ratio: 0.14 },
          { phase: "Site Execution", titleAr: "تركيب حوامل الكابلات (Cable Trays) ومجاري الهواء ومواسير الصرف", titleEn: "Cable Trays, Ducting & Drainage First Fix", owner: "Mechanical Engineer", prio: "High", ratio: 0.35 },
          { phase: "Site Execution", titleAr: "تمديد وسحب كابلات القوى والتحكم الرئيسية والفرعية", titleEn: "Main & Submain Power Cable Pulling", owner: "Electrical Engineer", prio: "High", ratio: 0.52 },
          { phase: "Site Execution", titleAr: "اختبار الضغط الهيدروليكي لشبكات السباكة ومكافحة الحريق 24 ساعة", titleEn: "Hydrostatic Pressure Testing for Piping", owner: "QA/QC Engineer", prio: "Critical", ratio: 0.68 },
          { phase: "Site Execution", titleAr: "تثبيت وربط لوحات الكهرباء الرئيسية (MDBs) ووحدات الـ FCUs", titleEn: "Panelboards & FCU Terminations", owner: "Electrical Engineer", prio: "Critical", ratio: 0.80 },
          { phase: "Testing & Commissioning", titleAr: "إجراء اختبارات التوازن الهوائي والمائي (Testing, Adjusting & Balancing TAB)", titleEn: "TAB Air & Water Balancing Testing", owner: "Commissioning Specialist", prio: "Critical", ratio: 0.92 },
          { phase: "Handover & Closeout", titleAr: "الفحص المشترك مع استشاري المشروع وتسليم رخص الدفاع المدني", titleEn: "Civil Defense Inspection & Final Handover", owner: "Project Manager", prio: "Critical", ratio: 1.0 }
        ]
      },

      smart_systems: {
        titleAr: "مشاريع الأنظمة الذكية والتيار الخفيف والتحكم الرقمي (ICT / Low Current)",
        facilities: [{ id: "DAT-01", name: "غرفة البيانات الرئيسية (MDF) ونقاط التوزيع", floors: "كافة المباني", rooms: 0, type: "Data Center & Automation" }],
        scopeSystems: [
          { code: "SEC-01", title: "أنظمة المراقبة الأمنية والتحكم بالدخول", items: ["كاميرات المراقبة الذكية (AI CCTV)", "بوابات الدخول الذكية (Access Control)", "حواجز المركبات الذكية (ANPR)"] },
          { code: "NET-01", title: "البنية التحتية للشبكات والاتصالات", items: ["كوابل الألياف البصرية والفئة 6A", "موزعات الشبكة (Core/Access Switches)", "نقاط الوصول اللاسلكية (WiFi 6)"] },
          { code: "BMS-01", title: "أنظمة إدارة المباني والتحكم بالطاقة (BMS / GRMS)", items: ["لوحات DDC الميدانية", "حساسات الحرارة والرطوبة", "برمجيات المراقبة والتحكم المركزي"] }
        ],
        milestones: [
          { name: "اعتماد المخططات التنفيذية واعتمادات المواد التقنية", ratio: 0.15, weight: "20%", owner: "Lead Systems Architect" },
          { name: "إتمام تمديد مسارات الكوابل وإنهاء نقاط الشبكة (UTP/Fiber)", ratio: 0.50, weight: "30%", owner: "Telecom Lead" },
          { name: "تركيب الكاميرات والمحولات وبرمجة خوادم التحكم المركزي", ratio: 0.80, weight: "30%", owner: "Systems Engineer" },
          { name: "التشغيل التجريبي والتكامل بين الأنظمة والتسليم النهائي", ratio: 1.0, weight: "20%", owner: "Project Manager" }
        ],
        submittals: [
          { item: "اعتماد وتوريد خوادم المراقبة وسيرفرات التخزين المركزية (NVR/VMS)", lead: "8-12 weeks", code: "A", statusName: "Approved", critical: true, subRatio: 0.08, siteRatio: 0.52 },
          { item: "اعتماد كاميرات المراقبة بدقة 4K والذكاء الاصطناعي (AI CCTV)", lead: "8-10 weeks", code: "A", statusName: "Approved", critical: true, subRatio: 0.10, siteRatio: 0.58 },
          { item: "اعتماد أجهزة سويتشات الشبكة المدارة (Core Switches & SFP Modules)", lead: "6-8 weeks", code: "B", statusName: "Approved as Noted", critical: false, subRatio: 0.12, siteRatio: 0.50 }
        ],
        coreTasks: [
          { phase: "Mobilization & Kick-off", titleAr: "عقد ورشة العمل التقنية ومطابقة متطلبات شبكة الاتصالات والأمان", titleEn: "ICT & Security Integration Workshop", owner: "Project Manager", prio: "Critical", ratio: 0.03 },
          { phase: "Engineering & Submittals", titleAr: "تقديم واعتماد مخططات مسارات الكوابل ونقاط الكاميرات (Device Schedule)", titleEn: "ELV Containment & Device Schedule Submittal", owner: "Low Current Engineer", prio: "High", ratio: 0.12 },
          { phase: "Site Execution", titleAr: "تمديد كوابل الفايبر (Fiber Optic) وكوابل الشبكة Cat6A في المسارات", titleEn: "Fiber & Structured Cabling Pulling", owner: "Telecom Engineer", prio: "High", ratio: 0.38 },
          { phase: "Site Execution", titleAr: "إنهاء ولحام كوابل الألياف البصرية وفحص Fluke Test لجميع النقاط", titleEn: "Fiber Splicing & Fluke Certification Testing", owner: "QA/QC Engineer", prio: "Critical", ratio: 0.55 },
          { phase: "Site Execution", titleAr: "تثبيت كاميرات المراقبة وقارئات البطاقات الذكية وحساسات الـ BMS", titleEn: "CCTV, Access Readers & Sensors Mounting", owner: "Site Technician", prio: "High", ratio: 0.72 },
          { phase: "Site Execution", titleAr: "تجهيز راكات غرفة البيانات (MDF) وبرمجة السيرفرات والسويتشات", titleEn: "Data Center Rack Integration & Configuration", owner: "Network Specialist", prio: "Critical", ratio: 0.82 },
          { phase: "Testing & Commissioning", titleAr: "اختبار سيناريوهات التكامل بين إنذار الحريق والتحكم بالأبواب والـ BMS", titleEn: "Integrated Systems Testing & Commissioning", owner: "Systems Lead", prio: "Critical", ratio: 0.92 },
          { phase: "Handover & Closeout", titleAr: "تدريب فريق الصيانة والتشغيل وتسليم كتيبات O&M ومفاتيح النظام", titleEn: "Client Training, O&M Manuals & TOC Sign-off", owner: "Project Manager", prio: "Critical", ratio: 1.0 }
        ]
      },

      it_software: {
        titleAr: "مشاريع البرمجيات والأنظمة السحابية والتحول الرقمي",
        facilities: [{ id: "ENV-01", name: "البيئات السحابية والإنتاجية (Dev / Staging / Prod)", floors: "Cloud Infrastructure", rooms: 0, type: "Digital Platform" }],
        scopeSystems: [
          { code: "DEV-01", title: "تطوير واجهات المستخدم وتجربة العميل (UI/UX & Frontend)", items: ["تصاميم Figma التفاعلية", "تطوير واجهات الويب وتطبيق الجوال", "ربط الواجهات بالـ APIs"] },
          { code: "BE-01", title: "تطوير الواجهات الخلفية وقواعد البيانات (Backend & APIs)", items: ["بناء الـ Microservices", "تصميم هيكل البيانات وقواعد البيانات", "تطبيق معايير التشفير والأمان"] },
          { code: "DEVOPS-01", title: "البنية السحابية وإدارة النشر (Cloud & CI/CD)", items: ["إعداد بيئات AWS/GCP/Azure", "بناء مسارات النشر الآلي CI/CD", "المراقبة وسجلات الأداء"] }
        ],
        milestones: [
          { name: "اعتماد وثيقة المتطلبات البرمجية (SRS) وهندسة النظام", ratio: 0.15, weight: "20%", owner: "Solution Architect" },
          { name: "إتمام تطوير النسخة التجريبية الأولية (Alpha / MVP Release)", ratio: 0.50, weight: "30%", owner: "Tech Lead" },
          { name: "إتمام اختبارات قبول المستخدم (UAT) وفحص الثغرات الأمنية", ratio: 0.80, weight: "30%", owner: "QA Lead" },
          { name: "الإطلاق الرسمي للنظام في البيئة الإنتاجية (Production Go-Live)", ratio: 1.0, weight: "20%", owner: "Project Director" }
        ],
        submittals: [
          { item: "اعتماد تصاميم واجهات المستخدم والنماذج التفاعلية (UI/UX Prototypes)", lead: "2-3 weeks", code: "A", statusName: "Approved", critical: true, subRatio: 0.08, siteRatio: 0.20 },
          { item: "تقرير الفحص الأمني واختبار الاختراق (Penetration Test Report)", lead: "3-4 weeks", code: "A", statusName: "Approved", critical: true, subRatio: 0.65, siteRatio: 0.85 }
        ],
        coreTasks: [
          { phase: "Mobilization & Kick-off", titleAr: "عقد ورشة عمل جمع المتطلبات وتحديد نطاق المنتجات والـ User Stories", titleEn: "Requirements Gathering & Product Backlog Definition", owner: "Project Manager", prio: "Critical", ratio: 0.03 },
          { phase: "Engineering & Submittals", titleAr: "اعتماد التصميم المعماري للبرمجيات وهيكل قواعد البيانات (DB Schema)", titleEn: "Architecture Design & DB Schema Approval", owner: "Solution Architect", prio: "High", ratio: 0.12 },
          { phase: "Site Execution", titleAr: "تطوير خدمات الـ API الخلفية وربط عمليات المصادقة والأمان", titleEn: "Core Backend APIs & Authentication Development", owner: "Backend Engineer", prio: "High", ratio: 0.35 },
          { phase: "Site Execution", titleAr: "تطوير شاشات الواجهة الأمامية وربطها بالبيانات الحية", titleEn: "Frontend Screens Implementation & State Management", owner: "Frontend Engineer", prio: "High", ratio: 0.52 },
          { phase: "Testing & Commissioning", titleAr: "إجراء اختبارات التكامل والأداء واختبارات الجودة المؤتمتة (QA Testing)", titleEn: "Automated & Performance Integration Testing", owner: "QA Lead", prio: "Critical", ratio: 0.72 },
          { phase: "Testing & Commissioning", titleAr: "جلسات اختبار قبول العميل والمستخدمين النهائيين (UAT Sign-off)", titleEn: "User Acceptance Testing (UAT) Sessions", owner: "Product Owner", prio: "Critical", ratio: 0.86 },
          { phase: "Handover & Closeout", titleAr: "النشر على بيئة الإنتاج السحابية وتفعيل المراقبة الحية (Go-Live)", titleEn: "Production Cloud Deployment & Live Monitoring", owner: "DevOps Engineer", prio: "Critical", ratio: 0.96 },
          { phase: "Handover & Closeout", titleAr: "تسليم الكود المصدري ووثائق النظام والتدريب النهائي", titleEn: "Source Code Handover & Technical Documentation", owner: "Project Manager", prio: "High", ratio: 1.0 }
        ]
      },

      general: {
        titleAr: "مشاريع هندسية واستشارية عامة",
        facilities: [{ id: "GEN-01", name: "موقع نطاق المشروع العام", floors: "نطاق العمل", rooms: 0, type: "General Engineering" }],
        scopeSystems: [
          { code: "GEN-01", title: "حزم الأعمال الرئيسية لنطاق المشروع", items: ["الدراسات والتخطيط", "التنفيذ والمتابعة", "التسليم والاعتماد"] }
        ],
        milestones: [
          { name: "انطلاق المشروع واعتماد خطة الإدارة التنفيذية", ratio: 0.10, weight: "15%", owner: "Project Manager" },
          { name: "إنجاز 50% من مخرجات النطاق المعتمد", ratio: 0.50, weight: "35%", owner: "Technical Lead" },
          { name: "إتمام الفحوصات وضمان الجودة واختبارات القبول", ratio: 0.80, weight: "25%", owner: "QA/QC Lead" },
          { name: "التسليم النهائي وإغلاق كافة التزامات المشروع", ratio: 1.0, weight: "25%", owner: "Project Director" }
        ],
        submittals: [
          { item: "اعتماد خطة إدارة الجودة والسلامة للمشروع", lead: "2-4 weeks", code: "A", statusName: "Approved", critical: false, subRatio: 0.05, siteRatio: 0.15 },
          { item: "اعتماد المواد والتوريدات الرئيسية المرتبطة بالنطاق", lead: "8-10 weeks", code: "B", statusName: "Approved as Noted", critical: true, subRatio: 0.10, siteRatio: 0.50 }
        ],
        coreTasks: [
          { phase: "Mobilization & Kick-off", titleAr: "عقد اجتماع الانطلاق واعتماد مصفوفة المسؤوليات وخطة العمل", titleEn: "Project Kick-off & Responsibility Matrix Sign-off", owner: "Project Manager", prio: "Critical", ratio: 0.03 },
          { phase: "Engineering & Submittals", titleAr: "مراجعة واعتماد المخططات والمواصفات والمتطلبات الهندسية", titleEn: "Specifications & Technical Documents Review", owner: "Planning Engineer", prio: "High", ratio: 0.15 },
          { phase: "Site Execution", titleAr: "بدء تنفيذ الأنشطة الرئيسية لنطاق العمل المعتمد في الموقع", titleEn: "Commence Main Execution Activities On-Site", owner: "Site Engineer", prio: "Critical", ratio: 0.40 },
          { phase: "Site Execution", titleAr: "متابعة نسب الإنجاز الميداني واختبارات الجودة الدورية", titleEn: "Progress Monitoring & Routine Quality Inspections", owner: "Lead Engineer", prio: "High", ratio: 0.65 },
          { phase: "Testing & Commissioning", titleAr: "الفحص الشامل لجميع المخرجات والتأكد من مطابقتها للمواصفات", titleEn: "Comprehensive Deliverable Acceptance Testing", owner: "QA/QC Manager", prio: "Critical", ratio: 0.85 },
          { phase: "Handover & Closeout", titleAr: "إعداد تقرير الإغلاق النهائي وتوقيع محاضر الاستلام والتسليم", titleEn: "Final Project Closeout Report & Acceptance Sign-off", owner: "Project Manager", prio: "Critical", ratio: 1.0 }
        ]
      }
    };

    const selectedPreset = domainPresets[domain] || domainPresets.construction;

    // Generate Key Milestones
    const keyMilestones = selectedPreset.milestones.map((m, idx) => ({
      id: `M-0${idx + 1}`,
      name: m.name,
      startDate: calcDate(m.ratio * 0.8),
      finishDate: calcDate(m.ratio),
      weight: m.weight,
      status: idx === 0 ? "In Progress" : "Pending",
      owner: m.owner
    }));

    // Generate Material Submittals
    const materialSubmittals = selectedPreset.submittals.map((s, idx) => ({
      sn: idx + 1,
      item: s.item,
      submissionDate: calcDate(s.subRatio),
      status: s.code,
      codeName: s.statusName,
      leadTime: s.lead,
      requiredSite: calcDate(s.siteRatio),
      poStatus: idx === 0 ? "Issued" : "Pending PO",
      critical: s.critical
    }));

    // Generate Daily Tasks
    const dailyTasks = [];
    let taskCounter = 1;

    // A) Core Presets Tasks
    selectedPreset.coreTasks.forEach(t => {
      dailyTasks.push({
        id: `TSK-${String(taskCounter++).padStart(4, '0')}`,
        date: calcDate(t.ratio),
        phase: t.phase,
        category: "Work Plan Activity",
        titleAr: t.titleAr,
        titleEn: t.titleEn,
        owner: t.owner,
        facility: selectedPreset.facilities[0]?.name || "موقع المشروع",
        priority: t.prio,
        status: t.ratio <= 0.05 ? "In Progress" : "Pending",
        progress: t.ratio <= 0.05 ? 60 : 0,
        deliverable: `مخرج ومعتمد نشاط (${t.titleAr})`
      });
    });

    // B) If custom scope lines provided, weave them seamlessly across the timeline!
    if (customLines.length > 0) {
      customLines.forEach((line, i) => {
        const ratio = 0.20 + (i / (customLines.length + 1)) * 0.55; // Spread between 20% and 75%
        dailyTasks.push({
          id: `TSK-${String(taskCounter++).padStart(4, '0')}`,
          date: calcDate(ratio),
          phase: "Site Execution",
          category: "Custom Scope Item",
          titleAr: `تنفيذ ومتابعة بند: ${line}`,
          titleEn: `Execute & Monitor: ${line.substring(0, 50)}`,
          owner: "Site Engineer",
          facility: selectedPreset.facilities[0]?.name || "موقع المشروع",
          priority: i % 2 === 0 ? "Critical" : "High",
          status: "Pending",
          progress: 0,
          deliverable: `تقرير إنجاز ومطابقة بند: ${line.substring(0, 40)}`
        });
      });
    }

    // Sort chronologically
    dailyTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    dailyTasks.forEach((t, i) => {
      t.id = `TSK-${String(i + 1).padStart(4, '0')}`;
    });

    return {
      projectInfo: {
        projectName: projectNameEn || projectName,
        projectNameAr: projectName,
        projectNumber: "PRJ-" + Math.floor(100000 + Math.random() * 900000),
        client: client,
        contractor: contractor,
        startDate: startDate,
        finishDate: finishDate,
        originalDurationDays: duration,
        totalScheduleDays: duration,
        status: "Active / مجدول بالذكاء الاصطناعي",
        description: customLines.length > 0
          ? customLines.slice(0, 4).join(' | ')
          : `خطة عمل هندسية شاملة مجدولة وفق معايير PMP لمجال: ${selectedPreset.titleAr}`
      },
      facilities: selectedPreset.facilities,
      scopeSystems: selectedPreset.scopeSystems,
      keyMilestones,
      materialSubmittals,
      actionItems: [
        { id: "ACT-01", task: `Coordinate kick-off protocols and approve baseline schedule`, taskAr: `اعتماد خطة العمل والجدول الزمني الأساسي (Baseline Schedule)`, owner: "Project Manager", targetDate: startDate, status: "Open", priority: "High" },
        { id: "ACT-02", task: `Finalize long-lead procurement orders`, taskAr: `إصدار أوامر الشراء للتوريدات ذات الفترات الحرجة (Long Lead Items)`, owner: "Procurement Lead", targetDate: calcDate(0.25), status: "Open", priority: "High" }
      ],
      teamMembers: [
        { role: "Project Manager", name: "مدير المشروع", location: "On-Site" },
        { role: "Planning Engineer", name: "مهندس التخطيط والجدولة", location: "On-Site" },
        { role: "QA/QC Manager", name: "مدير الجودة والسلامة", location: "On-Site" }
      ],
      dailyTasks
    };
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

  // PMP Cash Flow & S-Curve Financial Engine
  getCashFlowForecast(config = {}) {
    const info = this.project.projectInfo || {};
    const budgetConfig = this.project.financialConfig || config;
    
    const contractValue = parseFloat(budgetConfig.contractValue || info.budget || 5400000);
    const currency = budgetConfig.currency || "SAR";
    const advancePaymentPct = parseFloat(budgetConfig.advancePaymentPct !== undefined ? budgetConfig.advancePaymentPct : 10);
    const retentionPct = parseFloat(budgetConfig.retentionPct !== undefined ? budgetConfig.retentionPct : 10);
    const costRatio = parseFloat(budgetConfig.costRatio !== undefined ? budgetConfig.costRatio : 0.80);

    const startDateStr = info.startDate || "2026-01-01";
    const finishDateStr = info.finishDate || "2026-06-30";
    const start = new Date(startDateStr);
    const finish = new Date(finishDateStr);
    
    let totalMonths = (finish.getFullYear() - start.getFullYear()) * 12 + (finish.getMonth() - start.getMonth()) + 1;
    if (totalMonths < 2) totalMonths = 6;
    if (totalMonths > 36) totalMonths = 36;

    // S-Curve Bell Curve weights
    let rawWeights = [];
    let weightSum = 0;
    for (let i = 0; i < totalMonths; i++) {
      const angle = (Math.PI * (i + 0.5)) / totalMonths;
      const w = Math.sin(angle) ** 1.8;
      rawWeights.push(w);
      weightSum += w;
    }

    const monthlyPct = rawWeights.map(w => (w / weightSum) * 100);
    const advancePaymentAmount = (contractValue * advancePaymentPct) / 100;
    const totalRetentionAmount = (contractValue * retentionPct) / 100;
    const recoveryMonths = Math.max(1, totalMonths - 2);
    const monthlyAdvanceRecovery = advancePaymentAmount / recoveryMonths;

    let cumulativePlannedValue = 0;
    let cumulativeInflow = 0;
    let cumulativeOutflow = 0;
    let cumulativeNet = 0;
    let cumulativeProgressPct = 0;

    const monthlyBreakdown = [];

    for (let m = 0; m < totalMonths; m++) {
      const monthDate = new Date(start.getFullYear(), start.getMonth() + m, 1);
      const monthLabel = monthDate.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' });
      const monthLabelEn = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const pct = monthlyPct[m];
      cumulativeProgressPct += pct;

      const plannedValue = (contractValue * pct) / 100;
      cumulativePlannedValue += plannedValue;

      // Inflow calculation
      let grossIPC = plannedValue;
      let advanceRecovery = (m > 0 && m <= recoveryMonths) ? monthlyAdvanceRecovery : 0;
      let retentionDeduction = (grossIPC * retentionPct) / 100;
      let monthlyInflow = grossIPC - advanceRecovery - retentionDeduction;

      if (m === 0 && advancePaymentAmount > 0) {
        monthlyInflow += advancePaymentAmount;
      }
      if (m === totalMonths - 1 && totalRetentionAmount > 0) {
        monthlyInflow += totalRetentionAmount;
      }

      let monthlyOutflow = plannedValue * costRatio;
      if (m === 0) monthlyOutflow += advancePaymentAmount * 0.35;

      const netMonthlyCashFlow = monthlyInflow - monthlyOutflow;
      cumulativeInflow += monthlyInflow;
      cumulativeOutflow += monthlyOutflow;
      cumulativeNet += netMonthlyCashFlow;

      const today = new Date();
      let status = "Planned";
      let statusAr = "مخطط";
      if (monthDate <= today) {
        status = "Paid / Invoiced";
        statusAr = "معتمد ومفوتر";
      } else if (m === 0 || m === 1) {
        status = "Under Review";
        statusAr = "قيد المعالجة";
      }

      monthlyBreakdown.push({
        monthIndex: m + 1,
        monthDate: monthDate.toISOString().split('T')[0],
        monthLabel: `${monthLabel} (${monthLabelEn})`,
        progressPct: Math.round(pct * 10) / 10,
        cumulativeProgressPct: Math.min(100, Math.round(cumulativeProgressPct * 10) / 10),
        plannedValue: Math.round(plannedValue),
        inflow: Math.round(monthlyInflow),
        outflow: Math.round(monthlyOutflow),
        netFlow: Math.round(netMonthlyCashFlow),
        cumulativeInflow: Math.round(cumulativeInflow),
        cumulativeOutflow: Math.round(cumulativeOutflow),
        cumulativeNet: Math.round(cumulativeNet),
        status,
        statusAr
      });
    }

    const totalProfit = cumulativeInflow - cumulativeOutflow;
    const profitMarginPct = Math.round((totalProfit / contractValue) * 100);

    return {
      currency,
      contractValue,
      totalInflow: Math.round(cumulativeInflow),
      totalOutflow: Math.round(cumulativeOutflow),
      netCashFlow: Math.round(cumulativeNet),
      totalProfit: Math.round(totalProfit),
      profitMarginPct,
      advancePaymentAmount,
      advancePaymentPct,
      totalRetentionAmount,
      retentionPct,
      totalMonths,
      monthlyBreakdown
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PMTaskScheduler };
}
