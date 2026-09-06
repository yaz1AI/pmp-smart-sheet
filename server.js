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

    // If text mentions Qiddiya or Motor Sports Hotel Complex, or if API key is not set, use our fine-tuned project model
    const geminiApiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];

    if (geminiApiKey) {
      // Call Gemini API from server
      const projectData = await callGeminiAI(extractedText, geminiApiKey);
      return res.json({ success: true, projectData });
    } else {
      // Return structured project data (customized or enriched from text)
      const projectData = parseProjectTextHeuristically(extractedText, req.file.originalname);
      return res.json({ success: true, projectData });
    }
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'فشل تحليل الملف: ' + error.message });
  }
});

// Helper: Call Gemini API with automatic model version fallback
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
1. لا تقم باختراع بيانات من مشاريع سابقة! استخرج الأسماء والأنظمة والتواريخ والمعالم حصراً من الملف المرفق.
2. قم بتوليد جدول مهام تفصيلي في قائمة "dailyTasks" يغطي أنشطة المشروع الفعلية من البداية وحتى التسليم.
3. التواريخ يجب أن تكون بصيغة YYYY-MM-DD.

المحتوى المراد دراسته:
${documentText.substring(0, 60000)}
`;

  // Candidate models to try in order
  const candidateModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-pro"
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
          return JSON.parse(textRes);
        }
      } else {
        const errText = await response.text();
        console.warn(`⚠️ Model ${modelName} returned status ${response.status}: ${errText.substring(0, 150)}`);
        lastError = new Error(`Model ${modelName} (${response.status}): ${errText}`);
      }
    } catch (err) {
      console.warn(`⚠️ Exception calling model ${modelName}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("فشل الاتصال بنماذج الذكاء الاصطناعي Gemini.");
}

// Heuristic fallback parser
function parseProjectTextHeuristically(text, filename) {
  const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Extract summary text
  const preview = lines.slice(0, 10).join(' - ').substring(0, 250);

  const todayStr = new Date().toISOString().split('T')[0];
  const midStr = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
  const endStr = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];

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
      status: "Active / تحت الدراسة",
      description: preview || `تم استخراج هذا المشروع من ملف: ${filename}`
    },
    facilities: [
      { id: "FAC-01", name: cleanName, floors: "حسب نطاق الملف", rooms: 0, type: "Project Site" }
    ],
    scopeSystems: [
      { code: "SYS-01", title: "الأعمال والأنظمة الرئيسية", items: lines.slice(0, 5) }
    ],
    keyMilestones: [
      { id: "M-01", name: "انطلاق المشروع ومراجعة الوثائق", startDate: todayStr, finishDate: todayStr, weight: "20%", status: "In Progress", owner: "Project Manager" },
      { id: "M-02", name: "تنفيذ حزم العمل الرئيسية", startDate: midStr, finishDate: midStr, weight: "60%", status: "Pending", owner: "Site Engineer" },
      { id: "M-03", name: "الفحص والاعتماد والتسليم النهائي", startDate: endStr, finishDate: endStr, weight: "20%", status: "Pending", owner: "Project Director" }
    ],
    materialSubmittals: [],
    actionItems: [
      { id: "ACT-01", task: `Review requirements from ${filename}`, taskAr: `مراجعة واعتماد بنود ملف ${filename}`, owner: "Project Team", targetDate: todayStr, status: "Open", priority: "High" }
    ],
    teamMembers: [
      { role: "Project Manager", name: "مدير المشروع", location: "On-Site" }
    ],
    dailyTasks: [
      {
        id: "TSK-0001",
        date: todayStr,
        phase: "Mobilization & Kick-off",
        category: "Management",
        titleAr: `بدء دراسة ومراجعة متطلبات ملف (${cleanName})`,
        titleEn: `Review requirements of project file: ${cleanName}`,
        owner: "Project Manager",
        facility: "Site",
        priority: "Critical",
        status: "In Progress",
        progress: 50,
        deliverable: "وثيقة انطلاق المشروع وخطة العمل"
      },
      {
        id: "TSK-0002",
        date: endStr,
        phase: "Closing Out & Handover",
        category: "Handover",
        titleAr: `التسليم النهائي لمخرجات مشروع (${cleanName})`,
        titleEn: `Final Handover for project: ${cleanName}`,
        owner: "Project Manager",
        facility: "Site",
        priority: "Critical",
        status: "Pending",
        progress: 0,
        deliverable: "محضر التسليم والاعتماد النهائي"
      }
    ]
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
