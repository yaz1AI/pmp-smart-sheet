/**
 * YAZ AI - Executive PDF Report Exporter (Arabic Native High-Fidelity Engine)
 * يقوم بتوليد تقرير تنفيذي هندسي رسمي متناسق تماماً مع الخطوط العربية ومعايير الطباعة A4
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
    const allTasks = scheduler ? scheduler.getAllTasks() : [];

    const reportType = options.reportType || "comprehensive";
    const includeFinancials = options.includeFinancials !== false;
    const includeProcurement = options.includeProcurement !== false;
    const includeSignatures = options.includeSignatures !== false;
    const customNotes = options.customNotes || "";

    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    const refNumber = `YAZ-PMP-${today.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const sym = cf.currency || "ر.س";
    const formattedContractVal = cf.contractValue ? new Intl.NumberFormat('en-US').format(cf.contractValue) : (info.budget ? new Intl.NumberFormat('en-US').format(info.budget) : 'غير محدد');

    // Upcoming critical tasks
    const criticalOrUpcomingTasks = allTasks
      .filter(t => t.priority === 'Critical' || t.status === 'In Progress' || t.status === 'Pending')
      .slice(0, reportType === 'weekly' ? 8 : 12);

    // Critical procurement items
    const criticalProcurement = submittals.filter(m => m.critical || (m.leadTime || '').includes('8-12')).slice(0, 8);

    return `
      <div id="yaz-pdf-report-content" class="yaz-pdf-document" dir="rtl" style="font-family: 'Cairo', system-ui, -apple-system, sans-serif; color: #0f172a; background: #ffffff; padding: 24px 28px; box-sizing: border-box; width: 100%; max-width: 800px; margin: 0 auto; line-height: 1.5; font-size: 11px; direction: rtl; text-align: right;">
        
        <!-- HEADER / BRANDING -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #090a0f; padding-bottom: 12px; margin-bottom: 14px;">
          
          <!-- Logo & Brand Title -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="assets/logo.jpg" alt="YAZ AI" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 1px solid #06b6d4; flex-shrink: 0;" />
            <div>
              <div style="font-size: 17px; font-weight: 900; color: #090a0f; margin-bottom: 1px;">
                YAZ AI <span style="font-size: 12px; color: #0891b2; font-weight: 700;">- المنظومة التنفيذية لإدارة المشاريع</span>
              </div>
              <div style="font-size: 10px; color: #64748b; font-weight: 600; direction: ltr; text-align: right;">
                Executive Engineering Project Status Report
              </div>
            </div>
          </div>

          <!-- Metadata & Issue Date -->
          <div style="text-align: left; font-size: 10px; color: #475569; direction: rtl;">
            <div style="margin-bottom: 2px;">
              <span style="color: #64748b;">المرجع:</span> <strong style="color: #0284c7; font-family: monospace;">${refNumber}</strong>
            </div>
            <div style="margin-bottom: 3px;">
              <span style="color: #64748b;">تاريخ الإصدار:</span> <strong style="color: #0f172a;">${formattedDate}</strong>
            </div>
            <div style="display: inline-block; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 6px; font-weight: 700; color: #334155; font-size: 9.5px;">
              ${reportType === 'weekly' ? 'ملخص الموقف الأسبوعي' : 'تقرير الحالة التنفيذي الشامل'}
            </div>
          </div>

        </div>

        <!-- PROJECT SUMMARY CARD -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 900; color: #0f172a;">${info.projectNameAr || info.projectName || 'مشروع هندسي'}</div>
              <div style="font-size: 10.5px; color: #64748b; margin-top: 1px;">
                <span>${info.projectName || ''}</span>
                ${info.projectNumber ? ` <span style="color: #94a3b8;">|</span> <span>رقم العقد: <strong>${info.projectNumber}</strong></span>` : ''}
              </div>
            </div>
            <div style="background: #090a0f; color: #fef08a; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; white-space: nowrap;">
              ${info.status || 'Active - قيد التنفيذ'}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr 0.8fr; gap: 8px; font-size: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            <div>
              <span style="color: #64748b; display: block; margin-bottom: 1px;">المالك / العميل:</span>
              <strong style="color: #0f172a;">${info.client || 'غير محدد'}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block; margin-bottom: 1px;">المقاول الرئيسي:</span>
              <strong style="color: #0f172a;">${info.contractor || 'غير محدد'}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block; margin-bottom: 1px;">الجدول الزمني المخطط:</span>
              <strong style="color: #0f172a;">${info.startDate || '-'} إلى ${info.finishDate || '-'}</strong>
            </div>
            <div>
              <span style="color: #64748b; display: block; margin-bottom: 1px;">المدة الكلية:</span>
              <strong style="color: #0f172a;">${info.totalScheduleDays || 365} يوماً</strong>
            </div>
          </div>

        </div>

        <!-- EXECUTIVE KPIS & PROGRESS SECTION -->
        <div style="margin-bottom: 14px;">
          
          <div style="font-size: 11.5px; font-weight: 900; color: #090a0f; margin-bottom: 6px;">
            📊 مؤشرات الإنجاز والأداء الرئيسية (Project KPIs)
          </div>

          <!-- Progress Bar -->
          <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 11px; font-weight: 800;">
              <span>نسبة الإنجاز العامة المخططة:</span>
              <span style="color: #090a0f; font-size: 13px; font-weight: 900;">${kpis.completionRate}%</span>
            </div>
            <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; width: 100%;">
              <div style="background: #0284c7; height: 100%; width: ${kpis.completionRate}%; border-radius: 4px;"></div>
            </div>
          </div>

          <!-- KPI Mini Grid -->
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; text-align: center;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 2px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">إجمالي المهام</div>
              <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px;">${kpis.totalTasks}</div>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 6px 2px;">
              <div style="font-size: 9px; color: #065f46; font-weight: 700;">المهام المكتملة</div>
              <div style="font-size: 14px; font-weight: 900; color: #047857; margin-top: 2px;">${kpis.completedTasks}</div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 6px 2px;">
              <div style="font-size: 9px; color: #1e40af; font-weight: 700;">جاري التنفيذ</div>
              <div style="font-size: 14px; font-weight: 900; color: #1d4ed8; margin-top: 2px;">${kpis.inProgressTasks}</div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 6px 2px;">
              <div style="font-size: 9px; color: #92400e; font-weight: 700;">المهام المخططة</div>
              <div style="font-size: 14px; font-weight: 900; color: #b45309; margin-top: 2px;">${kpis.pendingTasks}</div>
            </div>
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 6px 2px;">
              <div style="font-size: 9px; color: #9f1239; font-weight: 700;">🚨 المسار الحرج</div>
              <div style="font-size: 14px; font-weight: 900; color: #be123c; margin-top: 2px;">${kpis.criticalTasks}</div>
            </div>
          </div>

        </div>

        ${includeFinancials ? `
        <!-- FINANCIAL & CASH FLOW SUMMARY -->
        <div style="margin-bottom: 14px;">
          
          <div style="font-size: 11.5px; font-weight: 900; color: #090a0f; margin-bottom: 6px;">
            💵 الموقف المالي والتدفقات النقدية (Financial Summary)
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">قيمة العقد الإجمالية</div>
              <div style="font-size: 11.5px; font-weight: 900; color: #0f172a; margin-top: 1px;">${formattedContractVal} ${sym}</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">الدفعة المقدمة</div>
              <div style="font-size: 11.5px; font-weight: 900; color: #0284c7; margin-top: 1px;">${cf.advancePaymentPct || 10}% (${cf.advancePayment ? new Intl.NumberFormat('en-US').format(cf.advancePayment) : '-'} ${sym})</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">نسبة الاستقطاع والضمان</div>
              <div style="font-size: 11.5px; font-weight: 900; color: #d97706; margin-top: 1px;">${cf.retentionPct || 10}% (تُصرف عند التسليم)</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px;">
              <div style="font-size: 9px; color: #64748b; font-weight: 700;">هامش الربح المستهدف</div>
              <div style="font-size: 11.5px; font-weight: 900; color: #059669; margin-top: 1px;">${cf.marginPct || 20}%</div>
            </div>
          </div>

          <!-- Mini Monthly Breakdown Preview -->
          ${(cf.monthlyBreakdown && cf.monthlyBreakdown.length > 0) ? `
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: center; border: 1px solid #cbd5e1; border-radius: 6px;">
            <thead style="background: #090a0f; color: #ffffff;">
              <tr>
                <th style="padding: 4px;">الشهر</th>
                <th style="padding: 4px;">الفترة</th>
                <th style="padding: 4px;">الإنجاز</th>
                <th style="padding: 4px;">التراكمي %</th>
                <th style="padding: 4px;">المستخلص المتوقع</th>
                <th style="padding: 4px;">التكاليف التشغيلية</th>
                <th style="padding: 4px;">صافي التدفق (${sym})</th>
                <th style="padding: 4px;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${cf.monthlyBreakdown.slice(0, 5).map((m, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 3.5px; font-weight: 700;">M${String(m.monthIndex).padStart(2, '0')}</td>
                  <td style="padding: 3.5px; color: #475569;">${m.monthLabel}</td>
                  <td style="padding: 3.5px; font-weight: 700;">${m.progressPct}%</td>
                  <td style="padding: 3.5px; font-weight: 800; color: #d97706;">${m.cumulativeProgressPct}%</td>
                  <td style="padding: 3.5px; font-weight: 700; color: #059669;">${new Intl.NumberFormat('en-US').format(m.inflow)}</td>
                  <td style="padding: 3.5px; font-weight: 700; color: #dc2626;">${new Intl.NumberFormat('en-US').format(m.outflow)}</td>
                  <td style="padding: 3.5px; font-weight: 800; color: ${m.netFlow >= 0 ? '#059669' : '#dc2626'};">${m.netFlow >= 0 ? '+' : ''}${new Intl.NumberFormat('en-US').format(m.netFlow)}</td>
                  <td style="padding: 3.5px; font-size: 8.5px;">${m.statusAr || m.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

        </div>
        ` : ''}

        ${(includeProcurement && criticalProcurement.length > 0) ? `
        <!-- CRITICAL PROCUREMENT MATRIX -->
        <div style="margin-bottom: 14px;">
          
          <div style="font-size: 11.5px; font-weight: 900; color: #090a0f; margin-bottom: 6px;">
            🚢 التوريدات الحرجة طويلة الأجل (Critical Procurement Items)
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1;">
            <thead style="background: #1e293b; color: #ffffff;">
              <tr>
                <th style="padding: 4px; text-align: right;">البند والمادة المطلوبة</th>
                <th style="padding: 4px; text-align: center;">تقديم الاعتماد</th>
                <th style="padding: 4px; text-align: center;">كود الاعتماد</th>
                <th style="padding: 4px; text-align: center;">المطلوب بالموقع</th>
                <th style="padding: 4px; text-align: center;">طلب PO</th>
                <th style="padding: 4px; text-align: center;">اعتماد PO</th>
                <th style="padding: 4px; text-align: center;">إصدار PO</th>
                <th style="padding: 4px; text-align: center;">حالة أمر الشراء (PO)</th>
              </tr>
            </thead>
            <tbody>
              ${criticalProcurement.map((m, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 4px 6px; font-weight: 700; color: #0f172a;">${m.item}</td>
                  <td style="padding: 4px; text-align: center; color: #64748b;">${m.submissionDate || '-'}</td>
                  <td style="padding: 4px; text-align: center;"><strong style="color: ${m.status === 'A' ? '#059669' : m.status === 'B' ? '#d97706' : '#dc2626'};">Code ${m.status || 'B'}</strong></td>
                  <td style="padding: 4px; text-align: center; font-weight: 800; color: #0f172a;">${m.requiredSite || '-'}</td>
                  <td style="padding: 4px; text-align: center; color: #1e40af; font-family: monospace;">${m.poRequestDate || '-'}</td>
                  <td style="padding: 4px; text-align: center; color: #b45309; font-family: monospace;">${m.poApprovalDate || '-'}</td>
                  <td style="padding: 4px; text-align: center; color: #047857; font-family: monospace; font-weight: 700;">${m.poIssuanceDate || '-'}</td>
                  <td style="padding: 4px; text-align: center; font-weight: 700; color: ${m.poStatus === 'Issued' || m.poStatus === 'Delivered to Site' ? '#059669' : m.poStatus === 'Pending Approval' ? '#d97706' : '#dc2626'};">${m.poStatus || 'Planned'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

        </div>
        ` : ''}

        <!-- UPCOMING TASKS & IMMEDIATE PRIORITIES -->
        <div style="margin-bottom: 14px;">
          
          <div style="font-size: 11.5px; font-weight: 900; color: #090a0f; margin-bottom: 6px;">
            ⚡ مهام وأولويات المرحلة القادمة (Action Priorities)
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; border: 1px solid #cbd5e1;">
            <thead style="background: #0f172a; color: #ffffff;">
              <tr>
                <th style="padding: 4px; text-align: center; width: 65px;">الرمز</th>
                <th style="padding: 4px; text-align: center; width: 75px;">التاريخ</th>
                <th style="padding: 4px; text-align: right;">المهمة والتسليمات</th>
                <th style="padding: 4px; text-align: center; width: 85px;">المسؤول</th>
                <th style="padding: 4px; text-align: center; width: 60px;">الأولوية</th>
                <th style="padding: 4px; text-align: center; width: 50px;">الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              ${criticalOrUpcomingTasks.map((t, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 4px; text-align: center; font-family: monospace; font-weight: 700; color: #64748b;">${t.id}</td>
                  <td style="padding: 4px; text-align: center; font-weight: 700; color: #334155;">${t.date}</td>
                  <td style="padding: 4px 6px;">
                    <div style="font-weight: 800; color: #0f172a;">${t.titleAr || t.titleEn}</div>
                    <div style="font-size: 8.5px; color: #64748b;">${t.deliverable || ''}</div>
                  </td>
                  <td style="padding: 4px; text-align: center; color: #475569;">${t.owner}</td>
                  <td style="padding: 4px; text-align: center;">
                    <span style="display: inline-block; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 8.5px; ${t.priority === 'Critical' ? 'background: #ffe4e6; color: #be123c;' : 'background: #f1f5f9; color: #334155;'}">
                      ${t.priority}
                    </span>
                  </td>
                  <td style="padding: 4px; text-align: center; font-weight: 800; color: ${t.progress === 100 ? '#059669' : '#0f172a'};">${t.progress || 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

        </div>

        ${customNotes ? `
        <!-- CUSTOM EXECUTIVE NOTES -->
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; font-size: 10px;">
          <strong style="color: #92400e; display: block; margin-bottom: 2px;">📝 توجيهات وملاحظات الإدارة:</strong>
          <p style="color: #78350f; margin: 0; white-space: pre-wrap;">${customNotes}</p>
        </div>
        ` : ''}

        ${includeSignatures ? `
        <!-- OFFICIAL SIGNATURES & APPROVALS BLOCK -->
        <div style="border-top: 2px solid #cbd5e1; padding-top: 10px; margin-top: 12px;">
          
          <div style="font-size: 10px; font-weight: 800; color: #475569; margin-bottom: 8px; text-align: center;">
            الاعتمادات والمصادقة الرسمية (Formal Project Approvals)
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; font-size: 9px;">
            
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px;">
              <div style="font-weight: 800; color: #0f172a;">مدير المشروع (Project Manager)</div>
              <div style="color: #64748b; font-size: 8.5px; margin-top: 1px;">${info.contractor || 'المقاول المنفذ'}</div>
              <div style="height: 28px; border-bottom: 1px solid #94a3b8; margin: 4px 12px 2px;"></div>
              <div style="color: #94a3b8; font-size: 8px;">التوقيع والتاريخ</div>
            </div>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px;">
              <div style="font-weight: 800; color: #0f172a;">مهندس التخطيط والتحكم (Lead Planner)</div>
              <div style="color: #64748b; font-size: 8.5px; margin-top: 1px;">Planning & PMO Team</div>
              <div style="height: 28px; border-bottom: 1px solid #94a3b8; margin: 4px 12px 2px;"></div>
              <div style="color: #94a3b8; font-size: 8px;">التوقيع والتاريخ</div>
            </div>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 8px;">
              <div style="font-weight: 800; color: #0f172a;">استشاري المشروع / المالك (Consultant / Client)</div>
              <div style="color: #64748b; font-size: 8.5px; margin-top: 1px;">${info.client || 'جهة الإشراف والاعتماد'}</div>
              <div style="height: 28px; border-bottom: 1px solid #94a3b8; margin: 4px 12px 2px;"></div>
              <div style="color: #94a3b8; font-size: 8px;">الختم والاعتماد</div>
            </div>

          </div>

        </div>
        ` : ''}

        <!-- DOCUMENT FOOTER -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 12px; font-size: 8.5px; color: #94a3b8;">
          <div>تم التوليد آلياً عبر منظومة <strong>YAZ AI</strong> لإدارة المشاريع الذكية والجدولة الهندسية</div>
          <div style="direction: ltr; font-family: monospace;">Confidential Project Document</div>
        </div>

      </div>
    `;
  }

  /**
   * فتح نافذة الطباعة / الحفظ كـ PDF عبر محرك المتصفح العالي الدقة (Zero Overlap & Vector Arabic Font)
   */
  static printReport(projectData, scheduler, options = {}) {
    const info = projectData?.projectInfo || {};
    const projectName = (info.projectNameAr || info.projectName || "Project").replace(/[/\\?%*:|"<>]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const docTitle = `YAZ_AI_Executive_Report_${projectName}_${dateStr}`;

    const reportHTML = this.generateReportHTML(projectData, scheduler, options);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("⚠️ يرجى السماح بالنوافذ المنبثقة (Popups) لتصدير وحفظ ملف الـ PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${docTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          * {
            box-sizing: border-box;
            font-family: 'Cairo', system-ui, sans-serif !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
            direction: rtl;
            text-align: right;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${reportHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  /**
   * التنزيل المباشر كـ PDF
   */
  static async downloadPdf(projectData, scheduler, options = {}) {
    // We trigger the native Vector PDF Print / Save engine which preserves perfect Arabic shaping and crisp vector quality
    this.printReport(projectData, scheduler, options);
  }
}

// Attach globally
window.PMPdfExporter = PMPdfExporter;
