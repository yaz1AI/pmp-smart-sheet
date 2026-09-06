/**
 * YAZ AI - Executive PDF Report Exporter
 * يقوم بتوليد تقرير تنفيذي هندسي رسمي وفخم بدقة عالية بصيغة PDF قابلة للطباعة والتنزيل
 */

class PMPdfExporter {

  /**
   * توليد كود الـ HTML المتكامل لتقرير A4 التنفيذي
   */
  static generateReportHTML(projectData, scheduler, options = {}) {
    const info = projectData?.projectInfo || {};
    const kpis = scheduler ? scheduler.getProjectKPIs() : { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, pendingTasks: 0, criticalTasks: 0, completionRate: 0 };
    const cf = projectData?.cashFlow || {};
    const submittals = projectData?.materialSubmittals || [];
    const milestones = projectData?.keyMilestones || [];
    const allTasks = scheduler ? scheduler.getAllTasks() : [];

    const reportType = options.reportType || "comprehensive"; // 'comprehensive' or 'weekly'
    const includeFinancials = options.includeFinancials !== false;
    const includeProcurement = options.includeProcurement !== false;
    const includeSignatures = options.includeSignatures !== false;
    const customNotes = options.customNotes || "";

    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    const refNumber = `YAZ-PMP-${today.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const sym = cf.currency || "ر.س";
    const formattedContractVal = cf.contractValue ? new Intl.NumberFormat('en-US').format(cf.contractValue) : (info.budget ? new Intl.NumberFormat('en-US').format(info.budget) : 'غير محدد');

    // Upcoming critical tasks (next 10 tasks or critical ones)
    const criticalOrUpcomingTasks = allTasks
      .filter(t => t.priority === 'Critical' || t.status === 'In Progress' || t.status === 'Pending')
      .slice(0, reportType === 'weekly' ? 8 : 12);

    // Critical procurement items (Lead Time 8-12 weeks or critical)
    const criticalProcurement = submittals.filter(m => m.critical || (m.leadTime || '').includes('8-12')).slice(0, 8);

    return `
      <div id="yaz-pdf-report-content" class="yaz-pdf-document" dir="rtl" style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; color: #0f172a; background: #ffffff; padding: 28px 32px; box-sizing: border-box; width: 100%; max-width: 800px; margin: 0 auto; line-height: 1.4; font-size: 11px;">
        
        <!-- HEADER / BRANDING -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #090a0f; padding-bottom: 14px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="assets/logo.jpg" alt="YAZ AI" style="width: 46px; height: 46px; border-radius: 12px; object-fit: cover; border: 1px solid #06b6d4;" />
            <div>
              <div style="font-size: 18px; font-weight: 900; color: #090a0f; letter-spacing: -0.5px;">YAZ AI <span style="font-size: 12px; color: #0891b2; font-weight: 700;">| المنظومة التنفيذية لإدارة المشاريع</span></div>
              <div style="font-size: 10px; color: #64748b; font-weight: 600;">Executive Engineering Project Status Report</div>
            </div>
          </div>

          <div style="text-align: left; font-size: 10px; color: #475569;">
            <div style="font-weight: 800; color: #090a0f;">المرجع: <span style="font-family: monospace; color: #0284c7;">${refNumber}</span></div>
            <div>تاريخ الإصدار: <strong>${formattedDate}</strong></div>
            <div style="display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; font-weight: 700; color: #334155; margin-top: 3px;">
              ${reportType === 'weekly' ? 'ملخص الموقف الأسبوعي (Weekly Summary)' : 'تقرير الحالة التنفيذي الشامل (Comprehensive Report)'}
            </div>
          </div>
        </div>

        <!-- PROJECT SUMMARY CARD -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a;">${info.projectNameAr || info.projectName || 'مشروع هندسي'}</div>
              <div style="font-size: 10px; color: #64748b; font-family: monospace;">${info.projectName || ''} | رقم العقد: <strong>${info.projectNumber || 'PRJ-2026'}</strong></div>
            </div>
            <div style="background: #090a0f; color: #fef08a; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800;">
              ${info.status || 'Active - قيد التنفيذ'}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            <div>
              <span style="color: #64748b; display: block;">المالك / العميل:</span>
              <strong style="color: #0f172a;">${info.client || 'غير محدد'}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block;">المقاول الرئيسي:</span>
              <strong style="color: #0f172a;">${info.contractor || 'غير محدد'}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block;">الجدول الزمني:</span>
              <strong style="color: #0f172a;">${info.startDate || '-'} ⬅ ${info.finishDate || '-'}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block;">المدة الكلية:</span>
              <strong style="color: #0f172a;">${info.totalScheduleDays || 365} يوماً تقويمياً</strong>
            </div>
          </div>
        </div>

        <!-- EXECUTIVE KPIS & PROGRESS SECTION -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 900; color: #090a0f; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>📊</span> <span>مؤشرات الإنجاز والأداء الرئيسية (Project KPIs)</span>
          </div>

          <!-- Progress Bar -->
          <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px; font-weight: 800;">
              <span>نسبة الإنجاز العامة المخططة (Overall Planned Completion Rate):</span>
              <span style="color: #090a0f; font-size: 13px;">${kpis.completionRate}%</span>
            </div>
            <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; width: 100%;">
              <div style="background: linear-gradient(90deg, #0284c7, #06b6d4, #10b981); height: 100%; width: ${kpis.completionRate}%; border-radius: 5px;"></div>
            </div>
          </div>

          <!-- KPI Mini Grid -->
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 4px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">إجمالي المهام</div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 2px;">${kpis.totalTasks}</div>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 4px;">
              <div style="font-size: 9px; color: #065f46; font-weight: 700;">المهام المكتملة</div>
              <div style="font-size: 15px; font-weight: 900; color: #047857; margin-top: 2px;">${kpis.completedTasks}</div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 4px;">
              <div style="font-size: 9px; color: #1e40af; font-weight: 700;">جاري التنفيذ</div>
              <div style="font-size: 15px; font-weight: 900; color: #1d4ed8; margin-top: 2px;">${kpis.inProgressTasks}</div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 4px;">
              <div style="font-size: 9px; color: #92400e; font-weight: 700;">المهام المخططة</div>
              <div style="font-size: 15px; font-weight: 900; color: #b45309; margin-top: 2px;">${kpis.pendingTasks}</div>
            </div>
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 8px 4px;">
              <div style="font-size: 9px; color: #9f1239; font-weight: 700;">🚨 المسار الحرج</div>
              <div style="font-size: 15px; font-weight: 900; color: #be123c; margin-top: 2px;">${kpis.criticalTasks}</div>
            </div>
          </div>
        </div>

        ${includeFinancials ? `
        <!-- FINANCIAL & CASH FLOW SUMMARY -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 900; color: #090a0f; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>💵</span> <span>الموقف المالي والتدفقات النقدية (Financial Summary & Cash Flow)</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">قيمة العقد الإجمالية</div>
              <div style="font-size: 12px; font-weight: 900; color: #0f172a; margin-top: 2px;">${formattedContractVal} ${sym}</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">الدفعة المقدمة</div>
              <div style="font-size: 12px; font-weight: 900; color: #0284c7; margin-top: 2px;">${cf.advancePaymentPct || 10}% (${cf.advancePayment ? new Intl.NumberFormat('en-US').format(cf.advancePayment) : '-'} ${sym})</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">نسبة الضمان والاستقطاع</div>
              <div style="font-size: 12px; font-weight: 900; color: #d97706; margin-top: 2px;">${cf.retentionPct || 10}% (تُصرف عند التسليم)</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">هامش الربح المستهدف</div>
              <div style="font-size: 12px; font-weight: 900; color: #059669; margin-top: 2px;">${cf.marginPct || 20}%</div>
            </div>
          </div>

          <!-- Mini Monthly Breakdown Preview -->
          ${(cf.monthlyBreakdown && cf.monthlyBreakdown.length > 0) ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: center; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead style="background: #090a0f; color: #ffffff;">
              <tr>
                <th style="padding: 5px;">الشهر</th>
                <th style="padding: 5px;">الفترة</th>
                <th style="padding: 5px;">الإنجاز الشهري</th>
                <th style="padding: 5px;">التراكمي %</th>
                <th style="padding: 5px;">المستخلص المتوقع (${sym})</th>
                <th style="padding: 5px;">التكاليف التشغيلية (${sym})</th>
                <th style="padding: 5px;">صافي التدفق (${sym})</th>
                <th style="padding: 5px;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${cf.monthlyBreakdown.slice(0, 6).map((m, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 4px; font-weight: 700;">M${String(m.monthIndex).padStart(2, '0')}</td>
                  <td style="padding: 4px; color: #475569;">${m.monthLabel}</td>
                  <td style="padding: 4px; font-weight: 700;">${m.progressPct}%</td>
                  <td style="padding: 4px; font-weight: 800; color: #d97706;">${m.cumulativeProgressPct}%</td>
                  <td style="padding: 4px; font-weight: 700; color: #059669;">${new Intl.NumberFormat('en-US').format(m.inflow)}</td>
                  <td style="padding: 4px; font-weight: 700; color: #dc2626;">${new Intl.NumberFormat('en-US').format(m.outflow)}</td>
                  <td style="padding: 4px; font-weight: 800; color: ${m.netFlow >= 0 ? '#059669' : '#dc2626'};">${m.netFlow >= 0 ? '+' : ''}${new Intl.NumberFormat('en-US').format(m.netFlow)}</td>
                  <td style="padding: 4px; font-size: 8.5px;">${m.statusAr || m.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${cf.monthlyBreakdown.length > 6 ? `<div style="text-align: left; font-size: 8.5px; color: #94a3b8; margin-top: 3px;">* تم عرض أول 6 دورات مالية، باقي الجداول متوفرة في شيت المنظومة.</div>` : ''}
          ` : ''}
        </div>
        ` : ''}

        ${(includeProcurement && criticalProcurement.length > 0) ? `
        <!-- CRITICAL PROCUREMENT MATRIX -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 900; color: #090a0f; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>🚢</span> <span>التوريدات الحرجة طويلة الأجل (Long-Lead Critical Procurement Items)</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; border: 1px solid #e2e8f0;">
            <thead style="background: #1e293b; color: #ffffff;">
              <tr>
                <th style="padding: 5px; text-align: right;">البند / المادة (Material Item)</th>
                <th style="padding: 5px; text-align: center;">تاريخ التقديم</th>
                <th style="padding: 5px; text-align: center;">حالة الاعتماد</th>
                <th style="padding: 5px; text-align: center;">مدة التوريد (Lead Time)</th>
                <th style="padding: 5px; text-align: center;">المطلوب بالموقع</th>
                <th style="padding: 5px; text-align: center;">أمر الشراء (PO)</th>
              </tr>
            </thead>
            <tbody>
              ${criticalProcurement.map((m, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 5px; font-weight: 700; color: #0f172a;">${m.item}</td>
                  <td style="padding: 5px; text-align: center; color: #64748b;">${m.submissionDate || '-'}</td>
                  <td style="padding: 5px; text-align: center;"><strong style="color: ${m.status === 'A' ? '#059669' : m.status === 'B' ? '#d97706' : '#dc2626'};">Code ${m.status || 'B'}</strong></td>
                  <td style="padding: 5px; text-align: center; font-weight: 700; color: #b45309;">${m.leadTime || '8-12 أسبوع'} ⚠️</td>
                  <td style="padding: 5px; text-align: center; font-weight: 800; color: #0f172a;">${m.requiredSite || '-'}</td>
                  <td style="padding: 5px; text-align: center; color: #475569;">${m.poStatus || 'Planned'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- UPCOMING TASKS & IMMEDIATE PRIORITIES -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 900; color: #090a0f; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <span>⚡</span> <span>مهام وأولويات المرحلة القادمة (Immediate Action Priorities)</span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; border: 1px solid #e2e8f0;">
            <thead style="background: #0f172a; color: #ffffff;">
              <tr>
                <th style="padding: 5px; text-align: center; width: 60px;">الرمز</th>
                <th style="padding: 5px; text-align: center; width: 75px;">التاريخ</th>
                <th style="padding: 5px; text-align: right;">المهمة والتسليمات المطلوبة</th>
                <th style="padding: 5px; text-align: center; width: 85px;">المسؤول</th>
                <th style="padding: 5px; text-align: center; width: 60px;">الأولوية</th>
                <th style="padding: 5px; text-align: center; width: 50px;">الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              ${criticalOrUpcomingTasks.map((t, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 5px; text-align: center; font-family: monospace; font-weight: 700; color: #64748b;">${t.id}</td>
                  <td style="padding: 5px; text-align: center; font-weight: 700; color: #334155;">${t.date}</td>
                  <td style="padding: 5px;">
                    <div style="font-weight: 800; color: #0f172a;">${t.titleAr || t.titleEn}</div>
                    <div style="font-size: 8.5px; color: #64748b;">${t.deliverable || ''}</div>
                  </td>
                  <td style="padding: 5px; text-align: center; color: #475569;">${t.owner}</td>
                  <td style="padding: 5px; text-align: center;">
                    <span style="display: inline-block; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 8.5px; ${t.priority === 'Critical' ? 'background: #ffe4e6; color: #be123c;' : 'background: #f1f5f9; color: #334155;'}">
                      ${t.priority}
                    </span>
                  </td>
                  <td style="padding: 5px; text-align: center; font-weight: 800; color: ${t.progress === 100 ? '#059669' : '#0f172a'};">${t.progress || 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${customNotes ? `
        <!-- CUSTOM EXECUTIVE NOTES -->
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 10px;">
          <strong style="color: #92400e; display: block; margin-bottom: 4px;">📝 ملاحظات وتوجيهات الإدارة التنفيذية:</strong>
          <p style="color: #78350f; margin: 0; white-space: pre-wrap;">${customNotes}</p>
        </div>
        ` : ''}

        ${includeSignatures ? `
        <!-- OFFICIAL SIGNATURES & APPROVALS BLOCK -->
        <div style="border-top: 2px solid #cbd5e1; padding-top: 14px; margin-top: 16px;">
          <div style="font-size: 10.5px; font-weight: 800; color: #475569; margin-bottom: 12px; text-align: center;">
            الاعتمادات والمصادقة الرسمية (Formal Project Approvals & Signatures)
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; text-align: center; font-size: 9.5px;">
            
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px;">
              <div style="font-weight: 800; color: #0f172a;">مدير المشروع (Project Manager)</div>
              <div style="color: #64748b; font-size: 9px; margin-top: 2px;">${info.contractor || 'المقاول المنفذ'}</div>
              <div style="height: 36px; border-bottom: 1px solid #94a3b8; margin: 8px 16px 4px;"></div>
              <div style="color: #94a3b8; font-size: 8.5px;">التوقيع والتاريخ</div>
            </div>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px;">
              <div style="font-weight: 800; color: #0f172a;">مهندس التخطيط والتحكم (Lead Planner)</div>
              <div style="color: #64748b; font-size: 9px; margin-top: 2px;">Planning & PMO Team</div>
              <div style="height: 36px; border-bottom: 1px solid #94a3b8; margin: 8px 16px 4px;"></div>
              <div style="color: #94a3b8; font-size: 8.5px;">التوقيع والتاريخ</div>
            </div>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px;">
              <div style="font-weight: 800; color: #0f172a;">استشاري المشروع / المالك (Consultant / Client)</div>
              <div style="color: #64748b; font-size: 9px; margin-top: 2px;">${info.client || 'جهة الإشراف والاعتماد'}</div>
              <div style="height: 36px; border-bottom: 1px solid #94a3b8; margin: 8px 16px 4px;"></div>
              <div style="color: #94a3b8; font-size: 8.5px;">الختم والاعتماد</div>
            </div>

          </div>
        </div>
        ` : ''}

        <!-- DOCUMENT FOOTER -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 16px; font-size: 8.5px; color: #94a3b8;">
          <div>تم التوليد آلياً عبر منظومة <strong>YAZ AI</strong> لإدارة المشاريع الذكية والجدولة الهندسية</div>
          <div>وثيقة مشروع رسمية وسرية | Confidential Engineering Status Document</div>
        </div>

      </div>
    `;
  }

  /**
   * تنزيل التقرير بصيغة PDF عالية الدقة
   */
  static async downloadPdf(projectData, scheduler, options = {}) {
    if (typeof html2pdf === 'undefined') {
      alert("⚠️ مكتبة توليد PDF غير متوفرة. يرجى التأكد من اتصال الإنترنت.");
      return;
    }

    const info = projectData?.projectInfo || {};
    const projectName = (info.projectNameAr || info.projectName || "Project").replace(/[/\\?%*:|"<>]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `YAZ_AI_Executive_Report_${projectName}_${dateStr}.pdf`;

    // Create a hidden container for rendering
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "800px";
    tempContainer.innerHTML = this.generateReportHTML(projectData, scheduler, options);
    document.body.appendChild(tempContainer);

    const element = tempContainer.querySelector("#yaz-pdf-report-content");

    const opt = {
      margin: [8, 8, 8, 8],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("⚠️ حدث خطأ أثناء تنزيل ملف الـ PDF: " + err.message);
    } finally {
      document.body.removeChild(tempContainer);
    }
  }

  /**
   * فتح نافذة الطباعة المباشرة
   */
  static printReport(projectData, scheduler, options = {}) {
    const reportHTML = this.generateReportHTML(projectData, scheduler, options);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("⚠️ يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>YAZ AI - Executive Project Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { margin: 0; padding: 0; font-family: 'Cairo', sans-serif; background: #fff; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${reportHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}

// Attach globally
window.PMPdfExporter = PMPdfExporter;
