/**
 * YAZ AI Copilot - Engineering & PM Intelligent Assistant
 * يقوم بإدارة الشات التفاعلي المباشر مع الذكاء الاصطناعي وربطه بسياق المشروع الحالي
 */

class YAZAICopilot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.activeProject = null;
    this.scheduler = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  setProjectContext(projectData, scheduler) {
    this.activeProject = projectData;
    this.scheduler = scheduler;
    this.updateHeaderStatus();
  }

  updateHeaderStatus() {
    const statusEl = document.getElementById("copilot-project-status");
    if (!statusEl) return;
    if (this.activeProject) {
      const name = this.activeProject.projectInfo?.projectNameAr || this.activeProject.projectInfo?.projectName || "مشروع نشط";
      statusEl.innerHTML = `🟢 متصل بمشروع: <strong class="text-white">${name}</strong>`;
    } else {
      statusEl.innerHTML = `⚪ لا يوجد مشروع محدد حالياً`;
    }
  }

  toggleDrawer() {
    this.isOpen = !this.isOpen;
    const drawer = document.getElementById("copilot-chat-drawer");
    const floatBtn = document.getElementById("copilot-floating-btn");
    if (!drawer) return;

    if (this.isOpen) {
      drawer.classList.remove("hidden");
      floatBtn?.classList.add("scale-90", "opacity-80");
      this.updateHeaderStatus();
      if (this.messages.length === 0) {
        this.sendWelcomeMessage();
      }
      setTimeout(() => {
        document.getElementById("copilot-input")?.focus();
      }, 150);
    } else {
      drawer.classList.add("hidden");
      floatBtn?.classList.remove("scale-90", "opacity-80");
    }
  }

  sendWelcomeMessage() {
    const projName = this.activeProject?.projectInfo?.projectNameAr || this.activeProject?.projectInfo?.projectName || "المشروع";
    const kpis = this.scheduler ? this.scheduler.getProjectKPIs() : { completionRate: 0, totalTasks: 0, criticalTasks: 0 };

    const welcomeHTML = `
أهلاً بك يا باشمهندس! 👷‍♂️ أنا **YAZ AI Copilot** مستشارك الهندسي والتنفيذي الذكي للمشروع: **${projName}**.

📌 **الموقف التنفيذي الحالي:**
- نسبة الإنجاز العامة المخططة: **${kpis.completionRate}%**
- إجمالي المهام المجدولة: **${kpis.totalTasks} مهمة**
- المهام ذات الأولوية الحرجة: **${kpis.criticalTasks} مهام**

💡 **يمكنك سؤالي عن أي شيء، أو الضغط على أحد الاختصارات السريعة بالأسفل:**
    `.trim();

    this.addMessage("model", welcomeHTML);
  }

  addMessage(role, text) {
    this.messages.push({ role, text, timestamp: new Date() });
    this.renderMessages();
  }

  clearHistory() {
    this.messages = [];
    this.sendWelcomeMessage();
  }

  renderMessages() {
    const container = document.getElementById("copilot-messages-container");
    if (!container) return;

    container.innerHTML = this.messages.map((m, idx) => {
      const isUser = m.role === "user";
      const formattedText = this.formatMarkdown(m.text);

      return `
        <div class="flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in text-xs">
          ${!isUser ? `
            <img src="assets/logo.jpg" alt="YAZ AI" class="w-6 h-6 rounded-lg object-cover border border-cyan-500/40 flex-shrink-0 mt-0.5" />
          ` : ''}

          <div class="max-w-[85%] rounded-2xl p-3 ${isUser ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-semibold rounded-br-none shadow-sm' : 'bg-[#181a24] border border-[#242736] text-zinc-100 rounded-bl-none shadow-md'} relative group">
            
            <div class="leading-relaxed break-words prose prose-invert prose-xs text-right">
              ${formattedText}
            </div>

            ${!isUser && m.text.includes("###") ? `
              <div class="mt-2.5 pt-2 border-t border-[#2d303e] flex justify-end">
                <button type="button" onclick="window.yazCopilot.copyMessageText(${idx})" class="px-2.5 py-1 bg-[#12141c] hover:bg-[#202330] text-amber-300 border border-[#2d303e] rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-xs">
                  <span>📋</span> <span>نسخ الخطاب / النص</span>
                </button>
              </div>
            ` : ''}
          </div>

          ${isUser ? `
            <div class="w-6 h-6 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              👤
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  formatMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="font-black text-amber-300 text-xs sm:text-sm my-1.5 border-b border-zinc-700/50 pb-1">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="font-black text-white text-sm my-2">$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-300 font-bold">$1</strong>');
    
    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li class="mr-3 list-disc text-zinc-200 my-0.5">$1</li>');
    html = html.replace(/^\d+\.\s(.*$)/gim, '<li class="mr-3 list-decimal text-zinc-200 my-0.5">$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  copyMessageText(index) {
    const msg = this.messages[index];
    if (msg && msg.text) {
      navigator.clipboard.writeText(msg.text);
      alert("📋 تم نسخ الخطاب / الرد إلى الحافظة بنجاح!");
    }
  }

  sendQuickPrompt(promptText) {
    const input = document.getElementById("copilot-input");
    if (input) input.value = promptText;
    this.handleSendMessage();
  }

  async handleSendMessage() {
    const input = document.getElementById("copilot-input");
    const sendBtn = document.getElementById("copilot-send-btn");
    const message = input ? input.value.trim() : "";
    if (!message) return;

    // Add user message
    this.addMessage("user", message);
    if (input) input.value = "";

    // Show typing state
    this.showTypingIndicator(true);
    if (sendBtn) sendBtn.disabled = true;

    try {
      // Build project context payload
      const kpis = this.scheduler ? this.scheduler.getProjectKPIs() : {};
      const criticalTasks = this.scheduler ? this.scheduler.getAllTasks().filter(t => t.priority === 'Critical') : [];

      const projectContext = {
        projectInfo: this.activeProject?.projectInfo || {},
        kpis: kpis,
        cashFlow: this.activeProject?.cashFlow || {},
        materialSubmittals: this.activeProject?.materialSubmittals || [],
        criticalTasks: criticalTasks
      };

      const apiKey = localStorage.getItem("GEMINI_API_KEY") || "";
      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers["x-gemini-key"] = apiKey;

      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          message: message,
          conversationHistory: this.messages,
          projectContext: projectContext
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "تعذر الحصول على رد من المساعد الذكي");
      }

      const data = await res.json();
      this.addMessage("model", data.reply || "تمت المعالجة بنجاح.");
    } catch (error) {
      console.error("Copilot request error:", error);
      this.addMessage("model", `⚠️ عذراً يا باشمهندس، حدث خطأ: ${error.message}`);
    } finally {
      this.showTypingIndicator(false);
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  showTypingIndicator(show) {
    const indicator = document.getElementById("copilot-typing-indicator");
    if (indicator) {
      indicator.classList.toggle("hidden", !show);
    }
    const container = document.getElementById("copilot-messages-container");
    if (container) container.scrollTop = container.scrollHeight;
  }

  bindEvents() {
    const input = document.getElementById("copilot-input");
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });
  }
}

// Global instance
window.yazCopilot = new YAZAICopilot();
