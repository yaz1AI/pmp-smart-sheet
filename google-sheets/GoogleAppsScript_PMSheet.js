/**
 * =========================================================================================
 * 🤖 AI PM Smart Sheet for Google Sheets
 * كود Google Apps Script لربط Google Sheets بنماذج Gemini AI وتوليد جداول المهام اليومية
 * =========================================================================================
 * طريقة الاستخدام:
 * 1. افتح أي ملف Google Sheets جديد.
 * 2. اضغط من القائمة العلوية على: إضافات (Extensions) -> Apps Script.
 * 3. امسح أي كود موجود والصق هذا الكود بالكامل ثم اضغط حفظ (Ctrl + S).
 * 4. أعد تحديث صفحة Google Sheet، ستظهر لك قائمة جديدة باسم: "🤖 الذكاء الاصطناعي للمشاريع".
 * 5. اضغط على "⚙️ تعيين مفتاح Gemini API" ثم اختر "📥 دراسة مستند المشروع وتوليد الشيت".
 * =========================================================================================
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🤖 الذكاء الاصطناعي للمشاريع')
    .addItem('📥 دراسة مستند المشروع وتوليد الشيت بالكامل', 'promptAnalyzeProject')
    .addSeparator()
    .addItem('🗓️ إعادة توليد جدول المهام اليومية', 'generateDailyTasksTab')
    .addItem('📊 تحديث لوحة المؤشرات (Dashboard)', 'updateDashboard')
    .addSeparator()
    .addItem('⚙️ تعيين مفتاح Gemini API Key', 'setGeminiApiKey')
    .addToUi();
}

function setGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('إعدادات الذكاء الاصطناعي', 'يرجى إدخال مفتاح Google Gemini API Key الخاص بك:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() === ui.Button.OK) {
    const key = response.getResponseText().trim();
    if (key) {
      PropertiesService.getUserProperties().setProperty('GEMINI_API_KEY', key);
      ui.alert('✅ تم حفظ مفتاح API بنجاح في حسابك!');
    }
  }
}

function promptAnalyzeProject() {
  const ui = SpreadsheetApp.getUi();
  const apiKey = PropertiesService.getUserProperties().getProperty('GEMINI_API_KEY');
  
  if (!apiKey) {
    ui.alert('⚠️ يرجى تعيين مفتاح Gemini API أولاً من القائمة: "⚙️ تعيين مفتاح Gemini API Key"');
    return;
  }

  const response = ui.prompt(
    'دراسة المشروع بالذكاء الاصطناعي',
    'قم بلصق محتوى وثيقة المشروع أو ملخص الـ Kick-off أو الجدول هنا لدراسته وتوليد الشيت:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const text = response.getResponseText().trim();
    if (!text) {
      ui.alert('❌ لم يتم إدخال أي نص.');
      return;
    }

    ui.alert('⏳ جاري دراسة المشروع عبر الذكاء الاصطناعي وبناء الشيت... قد يستغرق هذا بضع ثوانٍ.');
    try {
      const projectData = callGeminiForProject(text, apiKey);
      buildCompleteProjectSheet(projectData);
      ui.alert('🎉 تم إنشاء الشيت الذكي وجدول المهام اليومي بنجاح!');
    } catch (e) {
      ui.alert('❌ حدث خطأ: ' + e.message);
    }
  }
}

function callGeminiForProject(docText, apiKey) {
  const prompt = `
أنت خبير أول في إدارة المشاريع الهندسية (PMP). قم بتحليل وثيقة المشروع واستخراج هيكل بيانات JSON يحتوي على:
{
  "projectInfo": {
    "projectName": "Name EN",
    "projectNameAr": "الاسم بالعربية",
    "projectNumber": "رقم المشروع",
    "client": "العميل",
    "contractor": "المقاول",
    "startDate": "YYYY-MM-DD",
    "finishDate": "YYYY-MM-DD",
    "totalScheduleDays": 400,
    "status": "Active",
    "description": "الوصف"
  },
  "keyMilestones": [
    { "id": "M-01", "name": "اسم المعلم", "startDate": "YYYY-MM-DD", "finishDate": "YYYY-MM-DD", "weight": "10%", "status": "In Progress", "owner": "Project Manager" }
  ],
  "materialSubmittals": [
    { "sn": 1, "item": "اسم المادة", "submissionDate": "YYYY-MM-DD", "status": "B", "leadTime": "8-12 weeks", "requiredSite": "YYYY-MM-DD", "poRequestDate": "YYYY-MM-DD", "poApprovalDate": "YYYY-MM-DD", "poIssuanceDate": "YYYY-MM-DD", "poStatusDate": "YYYY-MM-DD", "poStatus": "Issued" }
  ],
  "actionItems": [
    { "id": "ACT-01", "task": "المهمة", "owner": "المسؤول", "targetDate": "YYYY-MM-DD", "status": "Open", "priority": "High" }
  ]
}

محتوى وثيقة المشروع:
${docText.substring(0, 40000)}
`;

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('API Error: ' + response.getContentText());
  }

  const json = JSON.parse(response.getContentText());
  const textOut = json.candidates[0].content.parts[0].text;
  return JSON.parse(textOut);
}

function buildCompleteProjectSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Dashboard Tab
  let dashSheet = ss.getSheetByName('لوحة_المشروع') || ss.insertSheet('لوحة_المشروع');
  dashSheet.clear();
  dashSheet.setRightToLeft(true);
  
  const p = data.projectInfo;
  dashSheet.getRange('A1:B1').merge().setValue('⚡ لوحة تحكم ومتابعة المشروع (AI Project Dashboard)')
    .setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff').setFontSize(14);
  
  const pData = [
    ['اسم المشروع بالعربية:', p.projectNameAr || p.projectName],
    ['Project Name (EN):', p.projectName],
    ['رقم العقد / المشروع:', p.projectNumber],
    ['المالك / العميل:', p.client],
    ['المقاول المنفذ:', p.contractor],
    ['تاريخ البدء المخطط:', p.startDate],
    ['تاريخ التسليم النهائي:', p.finishDate],
    ['المدة الإجمالية:', (p.totalScheduleDays || 500) + ' يوماً'],
    ['حالة المشروع:', p.status]
  ];
  dashSheet.getRange(3, 1, pData.length, 2).setValues(pData);
  dashSheet.getRange(3, 1, pData.length, 1).setFontWeight('bold').setBackground('#f1f5f9');
  dashSheet.autoResizeColumns(1, 2);

  // 2. Daily Tasks Tab
  let tasksSheet = ss.getSheetByName('جدول_المهام_اليومي') || ss.insertSheet('جدول_المهام_اليومي');
  tasksSheet.clear();
  tasksSheet.setRightToLeft(true);

  const headers = ['رمز المهمة', 'التاريخ', 'المرحلة', 'اسم المهمة بالعربية', 'المسؤول', 'الموقع', 'الأولوية', 'الحالة', 'نسبة الإنجاز', 'المخرج المطلوب'];
  tasksSheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');

  // Insert sample tasks template or generated tasks
  const sampleTasks = [
    ['TSK-0001', p.startDate || '2025-09-22', 'Mobilization', 'عقد اجتماع انطلاق المشروع (Kick-off) وتوزيع الصلاحيات', 'Project Manager', 'الموقع العام', 'Critical', 'Completed', '100%', 'محضر الاجتماع'],
    ['TSK-0002', '2026-09-08', 'Engineering & Submittals', 'متابعة إعادة تقديم الـ MTS للأنظمة ذات الكود C', 'Technical Lead', 'الموقع العام', 'Critical', 'In Progress', '30%', 'اعتماد الاستشاري'],
    ['TSK-0003', '2026-09-10', 'Procurement', 'إصدار أمر الشراء (PO) لأنظمة الصوتيات والمرئيات AV و BGM', 'Procurement Manager', 'المكتب الرئيسي', 'Critical', 'Pending', '0%', 'أمر الشراء المعتمد'],
    ['TSK-0004', '2026-09-18', 'Site Construction', 'سحب كابلات الشبكة Cat 6A لمبنى الشقق الفندقية H-27', 'Site Supervisor', 'Serviced Apartments H-27', 'High', 'Pending', '0%', 'محضر فحص WIR'],
    ['TSK-0005', '2026-11-20', 'Testing & Commissioning', 'إطلاق التيار الدائم وتشغيل وحدات الـ UPS ومفاتيح الشبكة', 'Sr. ICT Active Eng', 'غرفة الخوادم الرئيسية', 'Critical', 'Pending', '0%', 'تقرير التشغيل واختبار Ping'],
    ['TSK-0006', p.finishDate || '2027-03-03', 'Handover', 'توقيع محضر الاستلام الابتدائي للمشروع (TOC)', 'Project Director', 'المشروع بالكامل', 'Critical', 'Pending', '0%', 'شهادة TOC الموقعة']
  ];
  tasksSheet.getRange(2, 1, sampleTasks.length, headers.length).setValues(sampleTasks);
  tasksSheet.autoResizeColumns(1, headers.length);

  // 3. MTS & Procurement Tab
  if (data.materialSubmittals && data.materialSubmittals.length > 0) {
    let mtsSheet = ss.getSheetByName('المشتريات_والمواد_MTS') || ss.insertSheet('المشتريات_والمواد_MTS');
    mtsSheet.clear();
    mtsSheet.setRightToLeft(true);
    
    const mtsHeaders = ['م', 'اسم المادة / النظام', 'تاريخ التقديم', 'كود الاعتماد', 'فترة التوريد (Lead Time)', 'مطلوب بالموقع', 'طلب PO', 'اعتماد PO', 'إصدار PO', 'تاريخ حالة PO', 'حالة أمر الشراء (PO)', 'تاريخ حالة BO', 'حالة أمر الميزانية (BO)'];
    mtsSheet.getRange(1, 1, 1, mtsHeaders.length).setValues([mtsHeaders])
      .setFontWeight('bold').setBackground('#0284c7').setFontColor('#ffffff');

    const mtsRows = data.materialSubmittals.map(m => [
      m.sn, m.item, m.submissionDate, m.status, m.leadTime, m.requiredSite,
      m.poRequestDate || '-', m.poApprovalDate || '-', m.poIssuanceDate || '-', m.poStatusDate || '-', m.poStatus || 'Planned',
      m.boStatusDate || '-', m.boStatus || 'Pending BO'
    ]);
    mtsSheet.getRange(2, 1, mtsRows.length, mtsHeaders.length).setValues(mtsRows);
    mtsSheet.autoResizeColumns(1, mtsHeaders.length);
  }
}
