@echo off
chcp 65001 >nul
title AlDia - Restaurar respaldo
rem =====================================================================
rem  Restaura el respaldo mas reciente de la carpeta respaldos\
rem  (o el que se arrastre sobre este archivo).
rem  REEMPLAZA la base de datos y los archivos subidos actuales, por eso
rem  pide confirmacion y antes guarda un respaldo de seguridad.
rem  Apaga el backend antes de restaurar y vuelve a encenderlo despues.
rem =====================================================================
cd /d "%~dp0backend"
call npm run bd:restaurar -- %1
pause
