@echo off
chcp 65001 >nul
title AlDia
rem =====================================================================
rem  Enciende AlDia con doble clic (Windows).
rem  1. Revisa que Node.js este instalado.
rem  2. Instala las librerias la primera vez (npm install).
rem  3. Abre el backend en otra ventana: al encenderse crea la base de
rem     datos y las tablas solo (migraciones), si no existen.
rem  4. Abre la app en el navegador (Chrome, Edge...).
rem  Requisito: MariaDB encendido (XAMPP, HeidiSQL/MariaDB o Laragon).
rem =====================================================================
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Descargalo de https://nodejs.org ^(version LTS^) y vuelve a abrir este archivo.
  pause
  exit /b 1
)

if not exist "backend\node_modules" (
  echo Instalando las librerias del backend ^(solo la primera vez^)...
  pushd backend & call npm install & popd
)
if not exist "app\node_modules" (
  echo Instalando las librerias de la app ^(solo la primera vez, tarda unos minutos^)...
  pushd app & call npm install & popd
)

echo Encendiendo el backend en otra ventana...
start "AlDia - Backend" cmd /k "cd /d "%~dp0backend" && npm start"

echo Encendiendo la app. Se abrira en el navegador en http://localhost:8081
echo Para apagar todo, cierra las dos ventanas.
cd app
call npx expo start --web
