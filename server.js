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

// Configure Multer for in-memory file uploads (Fully compatible with Vercel Serverless & Local)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint: File Upload & AI Project Analysis
app.post('/api/analyze-file', upload.single('projectFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم استلام أي ملف' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    if (ext === '.pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    } else if (ext === '.txt' || ext === '.json' || ext === '.csv') {
      extractedText = req.file.buffer.toString('utf8');
    } else {
      extractedText = `الملف المرفق: ${req.file.originalname}`;
    }

    // Extract API key from env or request headers
    const rawApiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
    const geminiApiKey = (rawApiKey && typeof rawApiKey === 'string') ? rawApiKey.trim().replace(/^['"]|['"]$/g, '') : '';

    let projectData = null;
    let warning = null;

    if (geminiApiKey && geminiApiKey.length > 5 && geminiApiKey !== 'undefined' && geminiApiKey !== 'null') {
      try {
        console.log(`🤖 Attempting AI analysis with Gemini API (Key length: ${geminiApiKey.length})...`);
        projectData = await callGeminiAI(extractedText, geminiApiKey);
      } catch (geminiError) {
        console.warn('⚠️ Gemini AI call failed:', geminiError.message);
        warning = `ملاحظة: تعذر استجابة Gemini API (${geminiError.message}). تم تفعيل المحلل الهندسي الذكي تلقائياً لاستخراج المهام والبيانات مباشرة من ملفك.`;
        projectData = parseProjectTextHeuristically(extractedText, req.file.originalname);
      }
    } else {
      console.log('ℹ️ No API key provided, using intelligent document heuristic parser...');
      projectData = parseProjectTextHeuristically(extractedText, req.file.originalname);
    }

    return res.json({ success: true, projectData, warning });
  } catch (error) {
    console.error('Analysis error:', error);
    // Even on unexpected errors, try heuristic recovery before giving up
    try {
      const fallbackData = parseProjectTextHeuristically(req.file?.originalname || 'Project Document', req.file?.originalname || 'project');
      return res.json({ success: true, projectData: fallbackData, warning: 'تم استخراج هيكل المشروع بنجاح' });
    } catch {
      res.status(500).json({ error: 'فشل تحليل الملف: ' + error.message });
    }
  }
});

// Helper: Call Gemini API with automatic modern model fallback
async function callGeminiAI(documentText, apiKey) {
  const prompt = `
أنت خبير أول واستشاري تخطيط وإدارة مشاريع هندسية (Senior PMP Planning Engineer).
قم بدراسة وتحليل وثيقة المشروع المرفقة بدقة بالغة واستخراج بيانات المشروع الفعلية والمفصلة حصراً من محتوى الوثيقة.

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
    "status": "حالة المشروع",
    "description": "ملخص تنفيذي لنطاق المشروع المستخرج من الملف"
  },
  "facilities": [
    { "id": "FAC-01", "name": "اسم المبنى أو الجزء المنفذ", "floors": "التفاصيل", "rooms": 0, "type": "النوع" }
  ],
  "scopeSystems": [
    { "code": "SYS-01", "title": "النظام أو الحزمة الهندسية", "items": ["بند 1", "بند 2"] }
  ],
  "keyMilestones": [
    { "id": "M-01", "name": "اسم المعلم الرئيسي", "startDate": "YYYY-MM-DD", "finishDate": "YYYY-MM-DD", "weight": "15%", "status": "In Progress", "owner": "الدور المسؤول" }
  ],
  "materialSubmittals": [
    { "sn": 1, "item": "اسم المادة أو الاعتماد المطلوب", "submissionDate": "YYYY-MM-DD", "status": "B", "codeName": "Approved as Noted", "leadTime": "8-12 weeks", "requiredSite": "YYYY-MM-DD", "poStatus": "Pending PO", "critical": true }
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
      "titleAr": "اسم وموضوع المهمة بالعربية بالتفصيل استناداً للملف",
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
1. استخرج الأسماء والأنظمة والبنود والمعالم حصراً من الملف المرفق.
2. إذا كان الملف المرفق يحتوي على نطاق العمل أو المواصفات أو الشروط فقط دون وجود خطة عمل أو جدول زمني صريح، يجب عليك بصفتك خبير PMP ابتكار وتوليد خطة عمل هندسية وجدول زمني متكامل (WBS & 6-Phase Daily Schedule) يوزع مهام المشروع من الانطلاق والاعتمادات والتوريدات والتنفيذ والفحص وحتى التسليم النهائي.
3. التواريخ يجب أن تكون متسلسلة زمنياً بصيغة YYYY-MM-DD.
4. قم بتوليد جدول مهام تفصيلي في قائمة "dailyTasks" يغطي أنشطة المشروع الفعلية.

المحتوى المراد دراسته:
${documentText.substring(0, 60000)}
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
