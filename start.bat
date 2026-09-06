@echo off
chcp 65001 > nul
title AI PM Smart Sheet - نظام إدارة المشاريع الذكي
echo =======================================================
echo    ⚡ AI PM Smart Sheet - نظام الجدولة اليومية الذكي
echo =======================================================
echo جاري تشغيل خادم النظام المحلي...
start "" "http://localhost:3001"
start "" "http://localhost:3000"
node server.js
pause
