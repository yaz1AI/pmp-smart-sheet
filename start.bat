@echo off
chcp 65001 > nul
title AI PM Smart Sheet - نظام إدارة المشاريع الذكي
echo =======================================================
echo    ⚡ AI PM Smart Sheet - نظام الجدولة اليومية الذكي
echo =======================================================
echo جاري تشغيل خادم النظام المحلي...
set PORT=3003
start "" "http://localhost:3003"
node server.js
pause
