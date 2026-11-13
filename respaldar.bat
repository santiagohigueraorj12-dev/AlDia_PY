@echo off
chcp 65001 >nul
title AlDia - Respaldo
rem =====================================================================
rem  Hace un respaldo de AlDia: base de datos (archivo .sql) y archivos
rem  subidos. Queda en la carpeta respaldos\AAAA-MM-DD_HHMM
rem  Se guardan los ultimos 14 respaldos; los mas viejos se borran solos.
rem  Para programarlo todos los dias ver docs\respaldo\AlDia_Plan_de_Respaldo.pdf
rem =====================================================================
cd /d "%~dp0backend"
call npm run bd:respaldar
if "%1"=="" pause
