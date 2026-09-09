/**
 * Gemini AI Project Analysis Service
 * يقوم بإرسال مستندات المشروع إلى نماذج Gemini واستخراج بيانات وجدول المشروع بصيغة JSON مهيكلة
 */

class GeminiPMService {
  constructor(apiKey = "") {
    this.apiKey = apiKey || localStorage.getItem("GEMINI_API_KEY") || "";
    this.modelName = "gemini-2.5-flash"; // default fast and accurate model
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    localStorage.setItem("GEMINI_API_KEY", this.apiKey);
  }

  getApiKey() {
    return this.apiKey || localStorage.getItem("GEMINI_API_KEY") || "";
  }

  /**
   * تحليل مستند المشروع وتوليد البيانات المهيكلة
   */
  async analyzeProjectDocument(documentText, customInstructions = "") {
    if (!this.getApiKey()) {
      // If no API key provided, try calling local backend or use fallback
      try {
        const res = await fetch("/api/analyze-direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: documentText, instructions: customInstructions })
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.warn("Backend direct call not available, checking client-side key...");
      }
      throw new Error("يرجى إدخال مفتاح Gemini API Key في الإعدادات للمتابعة أو استخدام النموذج التجريبي المحمل.");
    }

    const systemPrompt = `
أنت خبير محترف ومستشار أول في إدارة المشاريع الهندسية (PMP / PMI Senior Project Management Expert & AI Planning Engineer).
مهمتك دراسة وثائق ومستندات المشروع المرفقة (مثل عروض Kick-off، جداول الـ Primavera، خطط التعافي، كراسات الشروط، وسجلات المواد والمشتريات) وتحويلها إلى هيكل بيانات شامل وتفصيلي للمشروع.

يجب أن تكون المخرجات حصراً بتنسيق JSON صالح وبالمفردات التالية:
{
  "projectInfo": {
    "projectName": "اسم المشروع بالإنجليزية",
    "projectNameAr": "اسم المشروع بالعربية",
    "projectNumber": "رقم العقد أو المشروع",
    "client": "اسم المالك أو العميل",
    "contractor": "اسم المقاول أو المنفذ",
    "startDate": "YYYY-MM-DD",
    "finishDate": "YYYY-MM-DD",
    "originalDurationDays": 400,
    "totalScheduleDays": 500,
    "status": "حالة المشروع الحالية",
    "description": "ملخص تنفيذي لنطاق المشروع بالعربية"
  },
  "facilities": [
    { "id": "H-1", "name": "اسم المبنى أو الجزء", "floors": "عدد الطوابق", "rooms": 100, "type": "نوع المنشأة" }
  ],
  "scopeSystems": [
    { "code": "SYS-01", "title": "اسم النظام أو نطاق العمل", "items": ["بند 1", "بند 2"] }
  ],
  "keyMilestones": [
    { "id": "M-01", "name": "اسم المعلم الرئيسي", "startDate": "YYYY-MM-DD", "finishDate": "YYYY-MM-DD", "weight": "10%", "status": "In Progress", "owner": "اسم الدور المسؤول" }
  ],
  "materialSubmittals": [
    { "sn": 1, "item": "اسم المادة أو النظام", "submissionDate": "YYYY-MM-DD", "status": "B", "codeName": "Approved as Noted", "leadTime": "8-12 weeks", "requiredSite": "YYYY-MM-DD", "poRequestDate": "YYYY-MM-DD", "poApprovalDate": "YYYY-MM-DD", "poIssuanceDate": "YYYY-MM-DD", "poStatusDate": "YYYY-MM-DD", "poStatus": "Issued", "critical": true }
  ],
  "actionItems": [
    { "id": "ACT-01", "task": "Task in English", "taskAr": "المهمة بالعربية", "owner": "المسؤول (المالك/المقاول)", "targetDate": "YYYY-MM-DD", "status": "Open", "priority": "High" }
  ],
  "teamMembers": [
    { "role": "Project Manager", "name": "الاسم إن وجد أو الدور", "location": "On-Site" }
  ]
}

ملاحظات مهمة:
1. استخرج التواريخ بدقة بصيغة YYYY-MM-DD.
2. تتبع دورة المشتريات وأوامر الشراء (PO Tracking) بالكامل لكل مادة: تاريخ طلب الـ PO (poRequestDate)، تاريخ اعتماد الـ PO (poApprovalDate)، تاريخ إصدار الـ PO (poIssuanceDate)، تاريخ الحالة الحالية (poStatusDate)، وحالة أمر الشراء (poStatus: Issued, Delivered to Site, Pending Approval, Pending Revision, Planned).
3. إذا كانت الوثيقة تحتوي على نطاق العمل أو المواصفات فقط دون وجود خطة عمل أو جدول زمني مفصل، قم بتوليد خطة عمل هندسية وجدول مهام يومي PMP متكامل يغطي كافة مراحل المشروع (Mobilization, Engineering, Procurement, Site Execution, Testing & Handover).
4. احرص على استخراج كافة المواد ذات فترات التوريد الطويلة (Long Lead Items: 8-12 weeks) لتضمينها في جدول المشتريات.
5. قم بتعريب المسميات بطريقة هندسية احترافية ملائمة لمدراء المشاريع في الشرق الأوسط والسعودية.
`;

    const userPrompt = `
إليك محتوى ملف المشروع لدراسته وتحليله بالكامل:
---
${documentText.substring(0, 50000)}
---
${customInstructions ? `تعليمات إضافية من مدير المشروع: ${customInstructions}` : ''}

قم بإخراج كود JSON فقط بدون أي نصوص تمهيدية أو تنسيق Markdown خارج JSON.
`;

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
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.getApiKey()}`;

        const requestBody = {
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`Model ${modelName} returned ${response.status}:`, errorData);
          lastError = new Error(`خطأ في استدعاء Gemini API (${response.status}): ${errorData.error?.message || response.statusText}`);
          continue;
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
          continue;
        }

        // Clean possible markdown fences
        let cleaned = responseText.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "");
        else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```/, "").replace(/```$/, "");
        
        const parsedJSON = JSON.parse(cleaned);
        return parsedJSON;
      } catch (parseErr) {
        lastError = parseErr;
      }
    }

    throw lastError || new Error("فشل الاتصال بنماذج الذكاء الاصطناعي Gemini.");
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GeminiPMService };
}
