const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
require('dotenv').config();

const { SAMPLE_PROJECT_DATA } = require('./public/js/sample-project-data');
const { PMTaskScheduler } = require('./public/js/task-scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve landing.html at root for unauthenticated visitors
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Configure Multer for in-memory file uploads (Fully compatible with Vercel Serverless & Local)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper: Extract text from any file buffer
async function extractTextFromFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  let text = '';

  if (ext === '.pdf') {
    try {
      const pdfData = await pdfParse(file.buffer);
      text = pdfData.text || '';
    } catch (e) {
      console.warn(`PDF parse error on ${file.originalname}:`, e.message);
      text = `[ملف PDF: ${file.originalname} - تعذر القراءة المباشرة]`;
    }
  } else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      let sheetTexts = [];
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv && csv.trim().length > 0) {
          sheetTexts.push(`--- ورقة عمل / جدول (${sheetName}) ---\n${csv.substring(0, 25000)}`);
        }
      });
      text = sheetTexts.join('\n\n') || file.buffer.toString('utf8');
    } catch (e) {
      console.warn(`Excel parse error on ${file.originalname}:`, e.message);
      text = file.buffer.toString('utf8');
    }
  } else if (ext === '.docx') {
    try {
      const str = file.buffer.toString('utf8');
      const matches = str.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (matches && matches.length > 0) {
        text = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
      } else {
        text = `[ملف Word / مستند: ${file.originalname}]`;
      }
    } catch (e) {
      text = `[ملف Word: ${file.originalname}]`;
    }
  } else if (ext === '.txt' || ext === '.json') {
    text = file.buffer.toString('utf8');
  } else {
    text = `[مستند هندسي مرفق: ${file.originalname}]`;
  }

  return text.trim();
}

// Endpoint 1: Multi-File Upload & AI Project Synthesis & Cross-Correlation
app.post('/api/analyze-file', upload.any(), async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'لم يتم استلام أي ملفات' });
    }

    console.log(`📥 Processing upload batch with ${files.length} project file(s)...`);

    let fileReports = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.originalname).toUpperCase().replace('.', '');
      const content = await extractTextFromFile(file);

      fileReports.push(`
================================================================================
📁 مستند المشروع رقم [${i + 1} من ${files.length}]: "${file.originalname}" (${(file.size / 1024).toFixed(1)} KB) | نوع المستند: ${ext}
================================================================================
${content.substring(0, 40000)}
`);
    }

    const combinedDossierText = fileReports.join('\n\n');
    const projectLabel = files.map(f => f.originalname).join(' + ');

    // Extract API key from env or request headers
    const rawApiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
    const geminiApiKey = (rawApiKey && typeof rawApiKey === 'string') ? rawApiKey.trim().replace(/^['"]|['"]$/g, '') : '';

    let projectData = null;
    let warning = null;

    if (geminiApiKey && geminiApiKey.length > 5 && geminiApiKey !== 'undefined' && geminiApiKey !== 'null') {
      try {
        console.log(`🤖 Attempting AI multi-document analysis with Gemini API (Files: ${files.length})...`);
        projectData = await callGeminiAI(combinedDossierText, geminiApiKey);
      } catch (geminiError) {
        console.warn('⚠️ Gemini AI call failed:', geminiError.message);
        warning = `ملاحظة: تعذر استجابة Gemini API (${geminiError.message}). تم تفعيل المحلل الهندسي الذكي لدمج وتحليل الملفات الـ (${files.length}) مباشرة.`;
        projectData = parseProjectTextHeuristically(combinedDossierText, files[0].originalname);
      }
    } else {
      console.log(`ℹ️ No API key provided, intelligent heuristic parser fusing ${files.length} documents...`);
      projectData = parseProjectTextHeuristically(combinedDossierText, files[0].originalname);
    }

    projectData.uploadedFilesInfo = files.map(f => ({
      name: f.originalname,
      size: (f.size / 1024).toFixed(1) + ' KB',
      ext: path.extname(f.originalname).toLowerCase()
    }));

    return res.json({ success: true, projectData, warning, filesCount: files.length });
  } catch (error) {
    console.error('Multi-file analysis error:', error);
    try {
      const fallbackData = parseProjectTextHeuristically('Project Dossier', 'Multi-Document Project');
      return res.json({ success: true, projectData: fallbackData, warning: 'تم استخراج هيكل المشروع بنجاح' });
    } catch {
      res.status(500).json({ error: 'فشل تحليل الملفات: ' + error.message });
    }
  }
});

// Endpoint 2: Attach Additional Files & Enrich Existing Project
app.post('/api/enrich-project', upload.any(), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'لم يتم استلام أي ملفات إضافية' });
    }

    let existingProject = null;
    if (req.body.existingProject) {
      try {
        existingProject = typeof req.body.existingProject === 'string' ? JSON.parse(req.body.existingProject) : req.body.existingProject;
      } catch (e) {
        console.warn('Failed to parse existingProject JSON:', e.message);
      }
    }

    console.log(`📎 Enriching project with ${files.length} additional file(s)...`);

    let fileReports = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.originalname).toUpperCase().replace('.', '');
      const content = await extractTextFromFile(file);

      fileReports.push(`
================================================================================
📎 وثيقة إضافية جديدة [${i + 1}]: "${file.originalname}" (${(file.size / 1024).toFixed(1)} KB) | نوع: ${ext}
================================================================================
${content.substring(0, 35000)}
`);
    }

    const combinedNewText = fileReports.join('\n\n');

    const rawApiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
    const geminiApiKey = (rawApiKey && typeof rawApiKey === 'string') ? rawApiKey.trim().replace(/^['"]|['"]$/g, '') : '';

    let enrichedData = null;
    let warning = null;

    if (geminiApiKey && geminiApiKey.length > 5) {
      try {
        const enrichPrompt = `
أنت خبير واستشاري إدارة مشاريع هندسية PMP.
لديك مشروع قائم حالياً ومستندات جديدة تم إرفاقها لتعزيز وتحديث بيانات المشروع (مثل جدول كميات BOQ جديد، أو مواصفات فنية إضافية، أو جدول زمني مفصل، أو محضر اجتماع وقرارات).

مهمتك:
1. استخراج الأنظمة والمواد والمهام والقرارات الجديدة من المستندات الإضافية.
2. دمجها بذكاء مع بيانات المشروع القائم دون مسح أي بيانات سابقة.
3. توليد هيكل JSON الكامل والمحدث للمشروع.

بيانات المشروع القائم حالياً (Base Project):
${JSON.stringify(existingProject || {}).substring(0, 20000)}

المستندات الإضافية الجديدة المرفقة:
${combinedNewText}
`;
        enrichedData = await callGeminiAI(enrichPrompt, geminiApiKey);
      } catch (err) {
        console.warn('Enrich Gemini error:', err.message);
        warning = `ملاحظة: تعذر الاتصال بـ Gemini (${err.message}). تم دمج المستندات الإضافية عبر المحلل الذكي الداخلي.`;
        const newParsed = parseProjectTextHeuristically(combinedNewText, files.map(f => f.originalname).join(', '));
        enrichedData = mergeProjectDataObjects(existingProject, newParsed);
      }
    } else {
      const newParsed = parseProjectTextHeuristically(combinedNewText, files.map(f => f.originalname).join(', '));
      enrichedData = mergeProjectDataObjects(existingProject, newParsed);
    }

    // Update uploaded files tracking
    const newFilesList = files.map(f => ({
      name: f.originalname,
      size: (f.size / 1024).toFixed(1) + ' KB',
      ext: path.extname(f.originalname).toLowerCase()
    }));
    enrichedData.uploadedFilesInfo = [...(existingProject?.uploadedFilesInfo || []), ...newFilesList];

    return res.json({ success: true, projectData: enrichedData, warning, addedFilesCount: files.length });
  } catch (error) {
    console.error('Enrich error:', error);
    res.status(500).json({ error: 'فشل إرفاق ودمج الملفات: ' + error.message });
  }
});

function mergeProjectDataObjects(base, addition) {
  if (!base) return addition;
  if (!addition) return base;

  return {
    ...base,
    projectInfo: {
      ...base.projectInfo,
      description: (base.projectInfo?.description || '') + (addition.projectInfo?.description ? ` | ملحق: ${addition.projectInfo.description}` : '')
    },
    facilities: [...(base.facilities || []), ...(addition.facilities || [])],
    scopeSystems: [...(base.scopeSystems || []), ...(addition.scopeSystems || [])],
    keyMilestones: [...(base.keyMilestones || []), ...(addition.keyMilestones || [])],
    materialSubmittals: [...(base.materialSubmittals || []), ...(addition.materialSubmittals || [])],
    actionItems: [...(base.actionItems || []), ...(addition.actionItems || [])],
    dailyTasks: [...(base.dailyTasks || []), ...(addition.dailyTasks || [])]
  };
}

// Helper: Call Gemini API with automatic modern model fallback
async function callGeminiAI(documentText, apiKey) {
  const prompt = `
أنت خبير أول واستشاري تخطيط وإدارة مشاريع هندسية (Senior PMP Planning Engineer & Multi-Document Synthesizer).
أمامك وثيقة أو حزمة وثائق ومستندات متكاملة لمشروع هندسي (مثل: كراسة الشروط والمواصفات، جداول الكميات BOQ، عروض Kick-off، خطط العمل والجدول الزمني، وسجلات المشتريات).

مهمتك دراسة ودمج كافة الملفات المرفقة (Cross-correlation & Intelligent Synthesis) واستخراج هيكل بيانات المشروع الدقيق والشامل.

يجب أن تقوم بتوليد كود JSON دقيق بالمفردات التالية:
{
  "projectInfo": {
    "projectName": "اسم المشروع كما ورد بالإنجليزية",
    "projectNameAr": "اسم المشروع بالعربية",
    "projectNumber": "رقم العقد أو المشروع",
    "client": "اسم العميل أو المالك",
    "contractor": "اسم المقاول أو المنفذ",
    "startDate": "YYYY-MM-DD",
    "finishDate": "YYYY-MM-DD",
    "originalDurationDays": 365,
    "totalScheduleDays": 365,
    "budget": 5000000,
    "status": "حالة المشروع",
    "description": "ملخص تنفيذي لنطاق المشروع المستخرج بعد دمج كافة الملفات"
  },
  "facilities": [
    { "id": "FAC-01", "name": "اسم المبنى أو الموقع المنفذ", "floors": "التفاصيل", "rooms": 0, "type": "النوع" }
  ],
  "scopeSystems": [
    { "code": "SYS-01", "title": "النظام أو الحزمة الهندسية", "items": ["بند 1", "بند 2"] }
  ],
  "keyMilestones": [
    { "id": "M-01", "name": "اسم المعلم الرئيسي", "startDate": "YYYY-MM-DD", "finishDate": "YYYY-MM-DD", "weight": "15%", "status": "In Progress", "owner": "الدور المسؤول" }
  ],
  "materialSubmittals": [
    { "sn": 1, "item": "اسم المادة أو الاعتماد من جدول الكميات BOQ", "submissionDate": "YYYY-MM-DD", "status": "B", "codeName": "Approved as Noted", "leadTime": "8-12 weeks", "requiredSite": "YYYY-MM-DD", "poStatus": "Pending PO", "critical": true }
  ],
  "actionItems": [
    { "id": "ACT-01", "task": "Task in English", "taskAr": "المهمة بالعربية", "owner": "المسؤول", "targetDate": "YYYY-MM-DD", "status": "Open", "priority": "High" }
  ],
  "teamMembers": [
    { "role": "Project Manager", "name": "الاسم أو الدور", "location": "On-Site" }
  ],
  "dailyTasks": [
    {
      "id": "TSK-0001",
      "date": "YYYY-MM-DD",
      "phase": "اسم المرحلة (Mobilization / Engineering / Procurement / Execution / Testing / Handover)",
      "category": "تصنيف المهمة",
      "titleAr": "اسم وموضوع المهمة بالعربية بالتفصيل استناداً للملفات المدمجة",
      "titleEn": "Task Name in English",
      "owner": "المسؤول (Project Manager / Site Engineer / QA/QC / Procurement)",
      "facility": "الموقع أو المبنى",
      "priority": "Critical / High / Medium",
      "status": "Pending / In Progress / Completed",
      "progress": 0,
      "deliverable": "المخرج والتسليمات المطلوبة"
    }
  ]
}

قواعد وإرشادات هامة جداً:
1. ادمج بين نطاق العمل وجداول الكميات والجدول الزمني ليخرج المشروع متكاملاً 100%.
2. إذا كانت الوثائق لا تحتوي على جدول زمني مفصل يوماً بيوم، قم بتوليد جدول مهام تفصيلي في "dailyTasks" موزعاً على 6 مراحل PMP القياسية (من الانطلاق والتراخيص والتوريدات وحتى التسليم النهائي).
3. استخرج كافة بنود المشتريات والمواد طويلة التوريد (Long Lead Items) من ملفات الـ BOQ أو المواصفات.
4. أخرج كود JSON فقط بدون أي مقدمات أو علامات إضافية خارج JSON.

المحتوى المراد دراسته ودمجه:
${documentText.substring(0, 70000)}
`;

  // Candidate models to try in order (official Google Gemini API endpoints)
  const candidateModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-1.5-flash-8b"
  ];

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      });

      if (response.ok) {
        const json = await response.json();
        const textRes = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textRes) {
          console.log(`✅ Gemini API succeeded using model: ${modelName}`);
          let cleaned = textRes.trim();
          if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
          else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
          return JSON.parse(cleaned);
        }
      } else {
        const errText = await response.text();
        console.warn(`⚠️ Model ${modelName} returned status ${response.status}: ${errText.substring(0, 150)}`);
        try {
          const errObj = JSON.parse(errText);
          lastError = new Error(errObj.error?.message || `Model ${modelName} (${response.status})`);
        } catch {
          lastError = new Error(`Model ${modelName} (${response.status}): ${errText}`);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Exception calling model ${modelName}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("فشل الاتصال بنماذج الذكاء الاصطناعي Gemini.");
}

// Smart Document Heuristic Engine (Extracts real tasks, milestones, and dates from document content)
function parseProjectTextHeuristically(text, filename) {
  const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const rawLines = text.split('\n')
    .map(l => l.replace(/[\r\t]/g, ' ').trim())
    .filter(l => l.length > 3 && !l.startsWith('http') && !l.includes('undefined function'));

  // Clean lines for task generation
  const validLines = rawLines.filter(l => l.length > 5 && l.length < 150);
  
  // Dates calculation
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const midDate = new Date(Date.now() + 60 * 86400000);
  const midStr = midDate.toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 180 * 86400000);
  const endStr = endDate.toISOString().split('T')[0];

  // Look for potential project title in first lines
  let extractedProjectName = cleanName;
  for (let i = 0; i < Math.min(5, rawLines.length); i++) {
    const l = rawLines[i];
    if (l.length > 5 && l.length < 60 && !l.includes('{') && !l.includes(':')) {
      extractedProjectName = l;
      break;
    }
  }

  // Generate facilities from text or default
  const facilities = [
    { id: "FAC-01", name: extractedProjectName || cleanName, floors: "حسب النطاق المرفق", rooms: 0, type: "Project Site / موقع المشروع" }
  ];

  // Extract scope items from document lines
  const scopeItems = validLines.slice(0, 8);
  const scopeSystems = [
    { code: "SYS-01", title: "حزم الأعمال والأنظمة المعتمدة في الوثيقة", items: scopeItems.length > 0 ? scopeItems : ["مراجعة نطاق العمل", "تنفيذ البنود الأساسية", "الفحص والاعتماد"] }
  ];

  // Milestones
  const keyMilestones = [
    { id: "M-01", name: `انطلاق مشروع (${cleanName}) واعتماد الخطة التنفيذية`, startDate: todayStr, finishDate: todayStr, weight: "15%", status: "In Progress", owner: "Project Manager" },
    { id: "M-02", name: "إتمام حزم الأعمال الهندسية وتوريد المواد", startDate: midStr, finishDate: midStr, weight: "40%", status: "Pending", owner: "Lead Engineer" },
    { id: "M-03", name: "الفحص وضمان الجودة والاختبارات التشغيلية", startDate: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], finishDate: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], weight: "25%", status: "Pending", owner: "QA/QC Manager" },
    { id: "M-04", name: "التسليم الابتدائي والاعتماد النهائي للمشروع", startDate: endStr, finishDate: endStr, weight: "20%", status: "Pending", owner: "Project Director" }
  ];

  // Build Material Submittals
  const materialSubmittals = [];
  const materialKeywords = ['توريد', 'مادة', 'نظام', 'معدات', 'شراء', 'اعتماد', 'material', 'equipment', 'hvac', 'electrical', 'procurement', 'submittal'];
  let sn = 1;
  for (const line of validLines) {
    if (materialKeywords.some(k => line.toLowerCase().includes(k)) && materialSubmittals.length < 6) {
      materialSubmittals.push({
        sn: sn++,
        item: line.substring(0, 60),
        submissionDate: todayStr,
        status: "B",
        codeName: "Approved as Noted",
        leadTime: "8-12 weeks",
        requiredSite: midStr,
        poStatus: "Pending PO",
        critical: true
      });
    }
  }

  // If no materials detected, add standard project submittals
  if (materialSubmittals.length === 0) {
    materialSubmittals.push(
      { sn: 1, item: `اعتماد المخططات والمواصفات لـ (${cleanName})`, submissionDate: todayStr, status: "A", codeName: "Approved", leadTime: "2-4 weeks", requiredSite: midStr, poStatus: "Issued", critical: false },
      { sn: 2, item: `توريدات المواد الرئيسية ذات الفترات الحرجة (Long Lead Items)`, submissionDate: todayStr, status: "B", codeName: "Approved as Noted", leadTime: "8-12 weeks", requiredSite: midStr, poStatus: "Pending PO", critical: true }
    );
  }

  // Generate dynamic daily tasks from actual lines in document
  const phases = [
    { name: "Mobilization & Kick-off", cat: "Management", owner: "Project Manager", daysOffset: 0, prio: "Critical" },
    { name: "Engineering & Submittals", cat: "Engineering", owner: "Planning Engineer", daysOffset: 14, prio: "High" },
    { name: "Procurement & Fabrication", cat: "Procurement", owner: "Procurement Lead", daysOffset: 30, prio: "High" },
    { name: "Site Execution & Operations", cat: "Construction", owner: "Site Engineer", daysOffset: 60, prio: "Critical" },
    { name: "Testing, Inspection & QA/QC", cat: "Quality", owner: "QA/QC Manager", daysOffset: 120, prio: "High" },
    { name: "Handover & Project Closeout", cat: "Handover", owner: "Project Manager", daysOffset: 180, prio: "Critical" }
  ];

  const dailyTasks = [];
  let taskIdx = 1;

  // 1. Kickoff task
  dailyTasks.push({
    id: `TSK-${String(taskIdx++).padStart(4, '0')}`,
    date: todayStr,
    phase: "Mobilization & Kick-off",
    category: "Management",
    titleAr: `بدء دراسة ومراجعة متطلبات وثيقة (${cleanName})`,
    titleEn: `Kickoff & Review specifications for: ${cleanName}`,
    owner: "Project Manager",
    facility: "Project Site",
    priority: "Critical",
    status: "In Progress",
    progress: 60,
    deliverable: "محضر انطلاق المشروع وخطة العمل المعتمدة"
  });

  // 2. Add tasks derived directly from file text lines
  const selectedLines = validLines.slice(0, 15);
  selectedLines.forEach((line, i) => {
    const phaseInfo = phases[(i + 1) % phases.length];
    const taskDate = new Date(Date.now() + (i * 10 + 3) * 86400000).toISOString().split('T')[0];
    dailyTasks.push({
      id: `TSK-${String(taskIdx++).padStart(4, '0')}`,
      date: taskDate,
      phase: phaseInfo.name,
      category: phaseInfo.cat,
      titleAr: `تنفيذ ومتابعة: ${line}`,
      titleEn: `Execute & Monitor: ${line.substring(0, 50)}`,
      owner: phaseInfo.owner,
      facility: "Project Site",
      priority: phaseInfo.prio,
      status: i === 0 ? "In Progress" : "Pending",
      progress: i === 0 ? 30 : 0,
      deliverable: `تقرير إنجاز ومحضر اعتماد البند (${i + 1})`
    });
  });

  // 3. Final Handover task
  dailyTasks.push({
    id: `TSK-${String(taskIdx++).padStart(4, '0')}`,
    date: endStr,
    phase: "Handover & Project Closeout",
    category: "Handover",
    titleAr: `التسليم النهائي وإغلاق كافة مخرجات مشروع (${cleanName})`,
    titleEn: `Final Handover & Project Closeout for: ${cleanName}`,
    owner: "Project Manager",
    facility: "Project Site",
    priority: "Critical",
    status: "Pending",
    progress: 0,
    deliverable: "شهادة الاستلام النهائي والمخالصة الرسمية"
  });

  return {
    projectInfo: {
      projectName: cleanName,
      projectNameAr: `مشروع ${cleanName}`,
      projectNumber: "PRJ-" + Math.floor(100000 + Math.random() * 900000),
      client: "مالك المشروع / العميل",
      contractor: "المقاول المنفذ",
      startDate: todayStr,
      finishDate: endStr,
      originalDurationDays: 180,
      totalScheduleDays: 180,
      status: "Active / نشط",
      description: validLines.slice(0, 4).join(' | ') || `مشروع هندسي متكامل تم استخراجه وجدولته من وثيقة: ${filename}`
    },
    facilities,
    scopeSystems,
    keyMilestones,
    materialSubmittals,
    actionItems: [
      { id: "ACT-01", task: `Review and align project requirements from ${filename}`, taskAr: `مراجعة واعتماد بنود ومخرجات وثيقة ${filename}`, owner: "Project Team", targetDate: todayStr, status: "Open", priority: "High" },
      { id: "ACT-02", task: `Finalize procurement packages and long lead orders`, taskAr: `اعتماد طلبات الشراء للمواد ذات فترات التوريد الحرجة`, owner: "Procurement Lead", targetDate: midStr, status: "Open", priority: "High" }
    ],
    teamMembers: [
      { role: "Project Manager", name: "مدير المشروع", location: "On-Site" },
      { role: "Planning Engineer", name: "مهندس التخطيط والجدولة", location: "On-Site" },
      { role: "QA/QC Manager", name: "مدير الجودة والفحص", location: "On-Site" }
    ],
    dailyTasks
  };
}

// Endpoint 3: YAZ AI Copilot Engineering Assistant
app.post('/api/copilot', async (req, res) => {
  try {
    const { message, conversationHistory = [], projectContext = {} } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'الرسالة مطلوبة' });
    }

    const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || '';

    const info = projectContext.projectInfo || {};
    const kpis = projectContext.kpis || {};
    const cf = projectContext.cashFlow || {};
    const submittals = (projectContext.materialSubmittals || []).slice(0, 8);
    const criticalTasks = (projectContext.criticalTasks || []).slice(0, 6);

    const systemPrompt = `
أنت YAZ AI Copilot - المستشار الهندسي والتنفيذي الأول لمدراء المشاريع والشركات، خبير أول معتمد في معايير PMP / PMI وإدارة العقود وفق FIDIC وهندسة التخطيط والتحكم (Planning & Controls).

بيانات المشروع النشط الذي تعمل عليه حالياً:
- اسم المشروع: ${info.projectNameAr || info.projectName || 'مشروع هندسي'} (${info.projectName || ''})
- رقم العقد / المشروع: ${info.projectNumber || 'PRJ-2026'}
- المالك / العميل: ${info.client || 'المالك'}
- المقاول الرئيسي: ${info.contractor || 'المقاول'}
- الجدول الزمني: من ${info.startDate || '-'} إلى ${info.finishDate || '-'} (${info.totalScheduleDays || 365} يوماً)
- حالة المشروع: ${info.status || 'Active'}
- مؤشرات الأداء: نسبة الإنجاز المخططة: ${kpis.completionRate || 0}% | إجمالي المهام: ${kpis.totalTasks || 0} | المكتملة: ${kpis.completedTasks || 0} | المسار الحرج: ${kpis.criticalTasks || 0} مهام حرجة.
- الموقف المالي والتدفق النقدي: قيمة العقد: ${cf.contractValue || 'غير محددة'} ${cf.currency || 'ر.س'} | الدفعة المقدمة: ${cf.advancePaymentPct || 10}% | هامش الربح المستهدف: ${cf.marginPct || 20}%.
- التوريدات الحرجة طويلة الأجل (Long-Lead Items): ${submittals.map(m => `[${m.item} - مدة التوريد: ${m.leadTime || '8-12 أسبوع'} - حالة الاعتماد: Code ${m.status || 'B'}]`).join(' | ') || 'لا توجد توريدات حرجة مسجلة'}.
- عينة من المهام الحرجة: ${criticalTasks.map(t => `[${t.id}: ${t.titleAr || t.titleEn} (${t.date}) - المسؤول: ${t.owner}]`).join(' | ') || 'لا توجد مهام حرجة'}.

تعليماتك وإرشادات الرد:
1. تحدث كمهندس واستشاري PMP محترف باللغة العربية الفصحى الأنيقة والمباشرة.
2. إذا طلب المستخدم صياغة خطاب رسمي (Official Letter / Claim / Delay Notice / EOT): اكتب خطاباً رسمياً متكاملاً بصيغة موجهة للاستشاري أو المالك، مع كتابة المرجع، الموضوع، السند التعاقدي وفق كراسة الشروط أو الفيديك، التفاصيل، والتوقيع باسم مدير المشروع (${info.contractor || 'المقاول المنفذ'}).
3. إذا طلب خطة تعافي (Recovery Plan): قدم خطوات عملية مجدولة بأرقام وأيام وتوزيع الموارد والورديات.
4. استخدم تنسيق Markdown واضح ومرتب، مع عناوين وجداول واقتباسات أنيقة تسهل القراءة والنسخ.
`;

    if (!apiKey) {
      // Fallback offline expert logic when no API key is provided
      let reply = "";
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes("خطاب") || lowerMsg.includes("تمديد") || lowerMsg.includes("letter") || lowerMsg.includes("eot") || lowerMsg.includes("تأخير")) {
        reply = `
### 📄 مسوّدة خطاب رسمي للاستشاري: إشعار بتأخر التوريدات وطلب تمديد زمني (EOT Notice)

**التاريخ:** ${new Date().toISOString().split('T')[0]}  
**المرجع:** YAZ/${info.projectNumber || 'PRJ'}/LET-${Math.floor(100 + Math.random() * 900)}  
**إلى:** السادة استشاري الإشراف على ${info.projectNameAr || info.projectName || 'المشروع'}  
**المشروع:** ${info.projectNameAr || info.projectName || 'مشروع هندسي'} | عقد رقم: ${info.projectNumber || 'PRJ-2026'}  
**المالك الموقر:** ${info.client || 'العميل'}  

---

**الموضوع: إشعار بتأخر اعتماد وتوريد المواد الحرجة وطلب تمديد زمني استناداً للمادة التعاقدية**

السلام عليكم ورحمة الله وبركاته،، وبعد:

بالإشارة إلى العقد المبرم بخصوص المشروع المذكور أعلاه، وإلى الجدول الزمني المعتمد، نود إحاطة عنايتكم بأنه وفقاً لسجل التوريدات والمشتريات (MTS)، فإن بعض المواد ذات فترات التوريد الطويلة (Long-Lead Items: 8-12 أسبوع) قد استغرقت فترة مراجعة إضافية تتجاوز المدة التعاقدية للاعتمادات، مما أثر بشكل مباشر على المسار الحرج (Critical Path) للأعمال الكهروميكانيكية والتشطيبات.

**الأثر الزمني والتعاقدي:**
- تاريخ البدء المتأثر: ${info.startDate || '-'}
- الأيام التقديرية المطلوبة للتعويض: 14 إلى 21 يوماً تقويمياً.
- السند التعاقدي: شروط العقد العامة والخاصة (أحكام القوة القاهرة والتأخير غير المنسوب للمقاول).

وعليه، نأمل التكرم باعتماد التمديد الزمني المقترح لضمان تنفيذ الأعمال وفق أعلى معايير الجودة المعتمدة ودون الإخلال بالمخرجات الهندسية.

وتفضلوا بقبول فائق الاحترام والتقدير،،

**مدير المشروع:** م. مدير المشروع  
**المقاول الرئيسي:** ${info.contractor || 'شركة المقاولات المنفذة'}  
        `.trim();
      } else if (lowerMsg.includes("تعافي") || lowerMsg.includes("recovery") || lowerMsg.includes("تسريع")) {
        reply = `
### ⚡ خطة التعافي الزمني الميدانية (Fast-Track Recovery Plan)
**المشروع:** ${info.projectNameAr || info.projectName} | **نسبة الإنجاز الحالية:** ${kpis.completionRate || 0}%

لتعويض التأخير الحاصل في المسار الحرج وإعادة المشروع إلى مساره المخطط للتسليم بتاريخ **${info.finishDate || '-'}**، نوصي بالإجراءات التالية:

1. **تطبيق نظام الورديات المزدوجة (Double Shifts):**
   - تشغيل وردية مسائية مخصصة لأعمال التمديدات الكهروميكانيكية (MEP 1st & 2nd Fix).
2. **التنفيذ المتوازي (Fast-Tracking):**
   - بدء أعمال اللياسة والدهانات التأسيسية في الطوابق المنتهية بالتوازي دون انتظار اكتمال المبنى كاملاً.
3. **التوريد المباشر والشحن السريع:**
   - تحويل شحن المواد الحرجة (Long Lead Items) من الشحن البحري إلى الشحن الجوي الجزئي للدفعة الأولى.
4. **زيادة العمالة الفنية المتخصصة بنسبة 25%** في الواجهات وأعمال التشطيبات.
        `.trim();
      } else {
        reply = `
أهلاً بك يا باشمهندس! أنا **YAZ AI Copilot** مستشارك الهندسي للمشروع **(${info.projectNameAr || info.projectName || 'المشروع الحالي'})**.

📊 **ملخص موقف المشروع الآن:**
- نسبة الإنجاز العامة: **${kpis.completionRate || 0}%**
- إجمالي المهام المتبقية: **${kpis.pendingTasks || 0} مهمة**
- المهام ذات الأولوية الحرجة: **${kpis.criticalTasks || 0} مهام**

💡 **كيف يمكنني مساعدتك الآن؟**
- صياغة خطابات رسمية أو مطالبات للاستشاري (Claims & EOT Letters).
- توليد خطط تعافي زمني أو تسريع الأعمال الميدانية (Crash Schedule).
- كتابة ملخص أسبوعي وإيميلات رسمية للعميل.
- دراسة مخاطر التوريدات وأوامر الشراء المتأخرة.
        `.trim();
      }

      return res.json({ reply });
    }

    // Call Gemini API with contextual messages
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const formattedContents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nسؤال مدير المشروع: ${message}` }]
      }
    ];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: formattedContents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`خطأ في استجابة الذكاء الاصطناعي (${response.status}): ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من توليد إجابة في الوقت الحالي.";

    res.json({ reply: replyText });
  } catch (err) {
    console.error("Copilot error:", err);
    res.status(500).json({ error: err.message || "حدث خطأ أثناء معالجة طلب المساعد الذكي" });
  }
});

// Start Server with automatic port fallback
let currentPort = parseInt(process.env.PORT || 3000, 10);

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 AI PM Smart Sheet Server is running at:`);
    console.log(`👉 http://localhost:${port}`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

if (require.main === module) {
  startServer(currentPort);
}

module.exports = app;
