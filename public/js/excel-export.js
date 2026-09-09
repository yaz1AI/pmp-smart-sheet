/**
 * PM Excel Export Engine
 * يقوم بتوليد وتصدير ملف Excel (.xlsx) احترافي متعدد الصفحات (Multi-Tab Workbook)
 */

class PMExcelExporter {
  static exportProjectWorkbook(projectData, scheduler) {
    if (typeof XLSX === 'undefined') {
      alert("مكتبة XLSX غير محملة");
      return;
    }

    const wb = XLSX.utils.book_new();

    // 1. Dashboard Tab (لوحة المشروع)
    const dashboardData = [
      ["YAZ AI - المنصة التنفيذية لإدارة وجدولة المشاريع الذكية (Executive Summary)", ""],
      ["", ""],
      ["اسم المشروع:", projectData.projectInfo.projectNameAr || projectData.projectInfo.projectName],
      ["Project Name:", projectData.projectInfo.projectName],
      ["رقم العقد / المشروع:", projectData.projectInfo.projectNumber],
      ["المالك / العميل:", projectData.projectInfo.client],
      ["المقاول الرئيسي / المنفذ:", projectData.projectInfo.contractor],
      ["تاريخ البدء المخطط:", projectData.projectInfo.startDate],
      ["تاريخ التسليم النهائي:", projectData.projectInfo.finishDate],
      ["المدة الإجمالية:", `${projectData.projectInfo.totalScheduleDays || 528} يوماً`],
      ["حالة المشروع:", projectData.projectInfo.status],
      ["", ""],
      ["مؤشرات الأداء الرئيسية (KPIs)", "القيمة"],
      ["إجمالي المهام المجدولة:", scheduler.tasks.length],
      ["المهام المكتملة:", scheduler.tasks.filter(t => t.status === 'Completed').length],
      ["المهام الجاري تنفيذها:", scheduler.tasks.filter(t => t.status === 'In Progress').length],
      ["المهام المعلقة / المخططة:", scheduler.tasks.filter(t => t.status === 'Pending').length],
      ["المهام ذات الأولوية الحرجة (Critical):", scheduler.tasks.filter(t => t.priority === 'Critical').length],
      ["نسبة الإنجاز العامة المخططة:", `${scheduler.getProjectKPIs().completionRate}%`],
      ["", ""],
      ["المباني والمنشآت المشمولة في النطاق:", ""],
      ...(projectData.facilities || []).map(f => [`- ${f.name} (${f.id})`, `الطوابق: ${f.floors} | الغرف: ${f.rooms} (${f.type})`]),
      ["", ""],
      ["أنظمة النطاق الهندسي:", ""],
      ...(projectData.scopeSystems || []).map(s => [`[${s.code}] ${s.title}`, s.items.join(" | ")])
    ];
    const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
    wsDashboard['!cols'] = [{ wch: 35 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard_الملخص");

    // 2. Daily Tasks Schedule Tab (جدول المهام اليومي)
    const tasksHeaders = [
      "رمز المهمة (ID)",
      "التاريخ (Date)",
      "المرحلة (Phase)",
      "التصنيف (Category)",
      "اسم المهمة بالعربية (Task Title AR)",
      "Task Title EN",
      "المسؤول (Owner)",
      "الموقع / المبنى (Facility)",
      "الأولوية (Priority)",
      "الحالة (Status)",
      "نسبة الإنجاز %",
      "المخرج والتسليمات (Deliverable)"
    ];

    const tasksRows = scheduler.tasks.map(t => [
      t.id,
      t.date,
      t.phase,
      t.category,
      t.titleAr || t.titleEn,
      t.titleEn || t.titleAr,
      t.owner,
      t.facility,
      t.priority,
      t.status,
      `${t.progress || 0}%`,
      t.deliverable
    ]);

    const wsTasks = XLSX.utils.aoa_to_sheet([tasksHeaders, ...tasksRows]);
    wsTasks['!cols'] = [
      { wch: 12 }, // ID
      { wch: 14 }, // Date
      { wch: 24 }, // Phase
      { wch: 22 }, // Category
      { wch: 45 }, // Title AR
      { wch: 45 }, // Title EN
      { wch: 20 }, // Owner
      { wch: 22 }, // Facility
      { wch: 12 }, // Priority
      { wch: 14 }, // Status
      { wch: 14 }, // Progress
      { wch: 45 }  // Deliverable
    ];
    XLSX.utils.book_append_sheet(wb, wsTasks, "Daily_Schedule_الجدول_اليومي");

    // 3. Key Milestones Tab (المعالم الرئيسية)
    const milestoneHeaders = ["رمز المعلم", "اسم المعلم (Milestone Name)", "تاريخ البدء", "تاريخ الانتهاء", "الوزن النسبي", "الحالة", "المسؤول"];
    const milestoneRows = (projectData.keyMilestones || []).map(m => [
      m.id,
      m.name,
      m.startDate,
      m.finishDate,
      m.weight,
      m.status,
      m.owner
    ]);
    const wsMilestones = XLSX.utils.aoa_to_sheet([milestoneHeaders, ...milestoneRows]);
    wsMilestones['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsMilestones, "Milestones_المعالم");

    // 4. Material Submittals & Procurement Tab (الاعتمادات والمشتريات وتتبع دورة أوامر الشراء)
    const mtsHeaders = [
      "م", 
      "اسم المادة / النظام (Material Submittal)", 
      "تاريخ تقديم الاعتماد", 
      "كود الاعتماد", 
      "وصف الاعتماد", 
      "فترة التوريد (Lead Time)", 
      "مطلوب بالموقع (Required Site)", 
      "تاريخ طلب PO (PO Request Date)",
      "تاريخ اعتماد PO (PO Approval Date)",
      "تاريخ إصدار PO (PO Issuance Date)",
      "تاريخ الحالة (Status Date)",
      "حالة أمر الشراء (PO Status)", 
      "حرج (Critical)"
    ];
    const mtsRows = (projectData.materialSubmittals || []).map(m => [
      m.sn,
      m.item,
      m.submissionDate,
      m.status,
      m.codeName,
      m.leadTime,
      m.requiredSite,
      m.poRequestDate || "-",
      m.poApprovalDate || "-",
      m.poIssuanceDate || "-",
      m.poStatusDate || "-",
      m.poStatus || "Planned",
      m.critical ? "نعم (حرج)" : "عادي"
    ]);
    const wsMTS = XLSX.utils.aoa_to_sheet([mtsHeaders, ...mtsRows]);
    wsMTS['!cols'] = [
      { wch: 5 },  // م
      { wch: 45 }, // اسم المادة
      { wch: 18 }, // تاريخ التقديم
      { wch: 12 }, // كود الاعتماد
      { wch: 22 }, // وصف الاعتماد
      { wch: 22 }, // فترة التوريد
      { wch: 20 }, // مطلوب بالموقع
      { wch: 22 }, // طلب PO
      { wch: 22 }, // اعتماد PO
      { wch: 22 }, // إصدار PO
      { wch: 18 }, // تاريخ الحالة
      { wch: 22 }, // حالة أمر الشراء
      { wch: 14 }  // حرج
    ];
    XLSX.utils.book_append_sheet(wb, wsMTS, "MTS_Procurement_المشتريات");

    // 5. Action Items Tab (بنود الإجراءات المعلقة)
    const actHeaders = ["رمز البند", "وصف الإجراء المطلوب (Task)", "الوصف بالعربية", "المسؤول (Owner)", "تاريخ الاستحقاق", "الأولوية", "الحالة"];
    const actRows = (projectData.actionItems || []).map(a => [
      a.id,
      a.task,
      a.taskAr,
      a.owner,
      a.targetDate,
      a.priority,
      a.status
    ]);
    const wsAction = XLSX.utils.aoa_to_sheet([actHeaders, ...actRows]);
    wsAction['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 45 }, { wch: 22 }, { wch: 15 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsAction, "Action_Items_القرارات_المعلقة");

    // 6. Cash Flow & Financial S-Curve Tab (التدفقات النقدية ومنحنى S-Curve)
    if (scheduler && typeof scheduler.getCashFlowForecast === 'function') {
      const cf = scheduler.getCashFlowForecast();
      const sym = cf.currency || "SAR";

      const cfData = [
        ["تقرير وجدول التدفقات النقدية ومنحنى S-Curve المالي للمشروع", ""],
        ["", ""],
        ["قيمة العقد / الميزانية الإجمالية:", `${cf.contractValue.toLocaleString()} ${sym}`],
        ["إجمالي التدفقات الداخلة (Inflows):", `${cf.totalInflow.toLocaleString()} ${sym}`],
        ["إجمالي المصروفات والتكاليف (Outflows):", `${cf.totalOutflow.toLocaleString()} ${sym}`],
        ["صافي السيولة النقدية (Net Cash Flow):", `${cf.netCashFlow.toLocaleString()} ${sym}`],
        ["صافي الربح المتوقع:", `${cf.totalProfit.toLocaleString()} ${sym}`],
        ["هامش الربح المستهدف:", `${cf.profitMarginPct}%`],
        ["الدفعة المقدمة:", `${cf.advancePaymentPct}% (${cf.advancePaymentAmount.toLocaleString()} ${sym})`],
        ["نسبة الاستقطاع والضمان (Retention):", `${cf.retentionPct}% (${cf.totalRetentionAmount.toLocaleString()} ${sym})`],
        ["", ""],
        [
          "الشهر (Month)",
          "الفترة الزمنية (Period)",
          "نسبة الإنجاز الشهري %",
          "منحنى S-Curve التراكمي %",
          `القيمة المخططة PV (${sym})`,
          `المستخلص الداخل Inflow (${sym})`,
          `المصروفات والتكاليف Outflow (${sym})`,
          `صافي التدفق الشهري Net (${sym})`,
          `التدفق التراكمي الداخل (${sym})`,
          `التكاليف التراكمية (${sym})`,
          `السيولة التراكمية Cumulative Net (${sym})`,
          "الحالة (Status)"
        ],
        ...cf.monthlyBreakdown.map(m => [
          `M${String(m.monthIndex).padStart(2, '0')}`,
          m.monthLabel,
          `${m.progressPct}%`,
          `${m.cumulativeProgressPct}%`,
          m.plannedValue,
          m.inflow,
          m.outflow,
          m.netFlow,
          m.cumulativeInflow,
          m.cumulativeOutflow,
          m.cumulativeNet,
          m.statusAr || m.status
        ])
      ];

      const wsCF = XLSX.utils.aoa_to_sheet(cfData);
      wsCF['!cols'] = [
        { wch: 14 },
        { wch: 25 },
        { wch: 20 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 25 },
        { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, wsCF, "CashFlow_التدفقات_النقدية");
    }

    // Generate filename and trigger download
    const cleanName = (projectData.projectInfo.projectName || "Project").replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_");
    const fileName = `${cleanName}_Daily_Schedule.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PMExcelExporter };
}
