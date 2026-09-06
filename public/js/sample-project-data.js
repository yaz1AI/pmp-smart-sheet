/**
 * بيانات مشروع تجريبي وهمي نموذجي لإدارة المشاريع
 * Project: Horizon Smart Tower & Business Suites (مشروع برج الأفق الذكي للأعمال والفندقة)
 */
const SAMPLE_PROJECT_DATA = {
  projectInfo: {
    projectName: "Horizon Smart Business Tower & Luxury Suites",
    projectNameAr: "مشروع برج الأفق الذكي للأعمال والفندقة",
    projectNumber: "HST-2026-901",
    client: "شركة الأفق العقارية القابضة (Horizon Group)",
    contractor: "شركة الإعمار والتقنية المتقدمة (Apex Contracting Co.)",
    startDate: "2025-10-01",
    finishDate: "2027-04-15",
    originalDurationDays: 450,
    totalScheduleDays: 560,
    status: "Active Execution / جاري التنفيذ",
    description: "مشروع متكامل لإنشاء وتجهيز برج أعمال وفندقة ذكي يضم 40 طابقاً، يشمل تنفيذ البنية التحتية للاتصالات، شبكات التيار الخفيف ELV، أنظمة المراقبة والذكاء الاصطناعي، وإنترنت الأشياء IoT."
  },
  facilities: [
    { id: "TWR-A", name: "برج الأعمال والمكاتب الذكية (Tower A - Corporate)", floors: "40 طابقاً + 3 أدوار قبو", rooms: 140, type: "Smart Offices & HQ" },
    { id: "TWR-B", name: "برج الأجنحة الفندقية الفاخرة (Tower B - Hotel Suites)", floors: "25 طابقاً", rooms: 220, type: "Luxury Hotel Suites" },
    { id: "POD-01", name: "منصة البوديوم والمؤتمرات (Podium & Conference Center)", floors: "4 أدوار", rooms: 30, type: "Retail & Event Halls" }
  ],
  scopeSystems: [
    {
      code: "PS 01",
      title: "شبكات الاتصالات والتيار الخفيف (ICT & ELV Works)",
      items: [
        "شبكة الألياف الضوئية وكابلات Cat 6A فائقة السرعة",
        "مراكز البيانات المدمجة (Edge Micro Data Centers)",
        "أنظمة نقاط الاتصال اللاسلكية Wi-Fi 7",
        "نظام إدارة الغرف والمكاتب الذكية (GRMS / Smart Office)",
        "أنظمة أقفال الأبواب الذكية البيومترية"
      ]
    },
    {
      code: "PS 02",
      title: "المنظومة الأمنية والتحكم بالدخول (Security & ACS Works)",
      items: [
        "كاميرات المراقبة بدقة 4K مع تحليلات الذكاء الاصطناعي (AI CCTV)",
        "بوابات الدخول الذكية وبوابات الفحص الأمني السريعة",
        "مركز القيادة والتحكم الأمني الموحد (SCC)",
        "حواجز المركبات الهيدروليكية ونظام قراءة اللوحات (ANPR)",
        "تكامل المنظومة مع اشتراطات الأمن الصناعي والدفاع المدني"
      ]
    },
    {
      code: "PS 03",
      title: "الأنظمة السمعية والبصرية والإذاعة (AV & BGM Systems)",
      items: [
        "شاشات العرض الرقمية التفاعلية وجدران الفيديو (Video Walls)",
        "نظام الإذاعة الصوتية والموسيقى الخلفية (BGM)",
        "أنظمة قاعات المؤتمرات والاجتماعات الهجينة",
        "نظام البث والتلفزيون التفاعلي IPTV"
      ]
    }
  ],
  keyMilestones: [
    { id: "M-01", name: "انطلاق المشروع والتهيئة الميدانية (Project Mobilization)", startDate: "2025-10-01", finishDate: "2025-12-20", weight: "5%", status: "Completed", owner: "Project Manager" },
    { id: "M-02", name: "المخططات الهندسية واعتمادات المواد (MTS Approvals)", startDate: "2025-11-15", finishDate: "2026-08-30", weight: "20%", status: "In Progress", owner: "Technical Manager" },
    { id: "M-03", name: "نمذجة معلومات البناء وتنسيق BIM (BIM Coordination)", startDate: "2025-12-01", finishDate: "2026-07-15", weight: "10%", status: "In Progress", owner: "BIM Lead" },
    { id: "M-04", name: "اعتماد المخططات الأمنية من الجهات المختصة (Security Clearance)", startDate: "2026-08-01", finishDate: "2026-08-20", weight: "5%", status: "Completed", owner: "QA/QC Director" },
    { id: "M-05", name: "إصدار أوامر الشراء للمواد طويلة التوريد (Procurement Long-Lead POs)", startDate: "2026-03-01", finishDate: "2026-10-25", weight: "20%", status: "Critical", owner: "Procurement Manager" },
    { id: "M-06", name: "تنفيذ التأسيسات والتمديدات الأولية بالقبو والبوديوم (Basement & Podium First Fix)", startDate: "2026-08-15", finishDate: "2026-11-30", weight: "8%", status: "In Progress", owner: "Construction Manager" },
    { id: "M-07", name: "تنفيذ أعمال الأبراج والمكاتب (Tower A & B Execution)", startDate: "2026-09-01", finishDate: "2027-01-30", weight: "12%", status: "Planned", owner: "Site Engineers" },
    { id: "M-08", name: "الفحص والتشغيل والتكامل بين الأنظمة (Testing, Commissioning & Integration)", startDate: "2026-12-01", finishDate: "2027-03-25", weight: "15%", status: "Planned", owner: "Technical Manager" },
    { id: "M-09", name: "التسليم الابتدائي والإغلاق النهائي (Handover & Final Closeout)", startDate: "2027-03-01", finishDate: "2027-04-15", weight: "5%", status: "Planned", owner: "Project Director" }
  ],
  materialSubmittals: [
    { sn: 1, item: "نظام إدارة المفاتيح وخزائن الحفظ الذكية – Traka", submissionDate: "2026-01-15", status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: "2026-11-10", poStatus: "Pending PO", critical: true },
    { sn: 2, item: "منظومة الهواتف والاتصال المؤسسي IP-Telephony", submissionDate: "2026-02-10", status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: "2026-10-25", poStatus: "Pending PO", critical: true },
    { sn: 3, item: "شاشات العرض وجدران الفيديو للمؤتمرات Video Wall Package", submissionDate: "2026-02-22", status: "C", codeName: "Revise & Resubmit", leadTime: "8-10 weeks", requiredSite: "2026-11-05", poStatus: "Pending Revision", critical: true },
    { sn: 4, item: "أنظمة الصوتيات والمرئيات الاحترافية AV Systems", submissionDate: "2026-02-28", status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: "2026-10-30", poStatus: "Pending PO", critical: true },
    { sn: 5, item: "نظام الموسيقى والإذاعة الصوتية العامة BGM Package", submissionDate: "2026-03-05", status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: "2026-10-20", poStatus: "Pending PO", critical: true },
    { sn: 6, item: "كابلات التيار الخفيف ومسارات التمديد المقاومة للحريق", submissionDate: "2026-01-05", status: "A", codeName: "Approved", leadTime: "Stock Item", requiredSite: "2026-08-20", poStatus: "Delivered to Site", critical: false },
    { sn: 7, item: "نظام التحكم بإضاءة وتكييف المكاتب والغرف GRMS", submissionDate: "2026-05-12", status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: "2026-11-01", poStatus: "Pending PO", critical: true },
    { sn: 8, item: "وحدات التغذية الكهربائية غير المنقطعة UPS Systems", submissionDate: "2026-01-20", status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: "2026-10-28", poStatus: "Pending PO", critical: true },
    { sn: 9, item: "أقفال الأبواب الذكية وبطاقات الوصول RFID Smart Locks", submissionDate: "2026-03-18", status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: "2026-10-15", poStatus: "Pending PO", critical: true },
    { sn: 10, item: "حواجز المداخل الهيدروليكية وبوابات المركبات Security Barriers", submissionDate: "2026-04-10", status: "C", codeName: "Revise & Resubmit", leadTime: "6-8 weeks", requiredSite: "2026-11-20", poStatus: "Under Resubmission", critical: false },
    { sn: 11, item: "كاميرات المراقبة الذكية وخوادم التخزين السحابية AI CCTV & Storage", submissionDate: "2026-04-15", status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: "2026-11-05", poStatus: "Pending PO", critical: true },
    { sn: 12, item: "مفاتيح الشبكات والموجهات الأساسية Core & Edge Network Switches", submissionDate: "2026-05-20", status: "C", codeName: "Revise & Resubmit", leadTime: "8-12 weeks", requiredSite: "2026-11-01", poStatus: "Under Resubmission", critical: true }
  ],
  actionItems: [
    {
      id: "ACT-01",
      task: "Final verification of cable tray fill ratios based on latest IFC design",
      taskAr: "إعادة التحقق من نسب إشغال مجاري الكابلات (Trunking Fill Ratio) بناءً على مخططات IFC المعتمدة",
      owner: "استشاري المشروع / فريق التصميم",
      targetDate: "2026-09-12",
      status: "Open",
      priority: "High"
    },
    {
      id: "ACT-02",
      task: "Approval of finalized Door Schedule for smart biometric access locks",
      taskAr: "اعتماد جدول الأبواب النهائي لتمكين فريق التركيبات من إنهاء مخططات التأسيس للأقفال الذكية",
      owner: "المالك / المطور العقاري",
      targetDate: "2026-09-10",
      status: "Critical",
      priority: "Critical"
    },
    {
      id: "ACT-03",
      task: "Method Statements (MOS) and Inspection Plans (ITP) submission",
      taskAr: "تقديم خطط الفحص والاختبار (ITP) وطرق العمل (MOS) لغرف الخوادم وشبكات الألياف",
      owner: "المقاول المنفذ (مدير الجودة)",
      targetDate: "2026-09-18",
      status: "In Progress",
      priority: "High"
    },
    {
      id: "ACT-04",
      task: "Release POs for Long Lead items based on approved Quantity Take-Off",
      taskAr: "إصدار أوامر الشراء الرسمية للمواد ذات فترات التوريد الطويلة (8-12 أسبوع) بعد حصر الكميات النهائي",
      owner: "إدارة المشتريات والعقود",
      targetDate: "2026-09-15",
      status: "Critical",
      priority: "Critical"
    }
  ],
  teamMembers: [
    { role: "Project Director", name: "م. إبراهيم السالم", location: "Off-Site" },
    { role: "Senior Project Manager", name: "م. فهد القحطاني", location: "On-Site Dedicated" },
    { role: "Technical Lead", name: "م. ياسر النجار", location: "On-Site Dedicated" },
    { role: "QA/QC Manager", name: "م. سامي الحربي", location: "On-Site Dedicated" },
    { role: "Planning Manager", name: "م. كمال عبد الرحيم", location: "Off-Site" },
    { role: "Procurement Manager", name: "أ. ماجد الشهري", location: "Head Office" },
    { role: "Site Construction Lead", name: "م. عبد الله العمري", location: "On-Site Dedicated" }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_PROJECT_DATA };
}
