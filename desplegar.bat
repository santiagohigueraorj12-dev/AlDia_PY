@echo off
chcp 65001 >nul
title AlDia - Produccion
rem =====================================================================
rem  Despliega AlDia en modo produccion con doble clic (Windows).
rem  1. Instala las librerias si faltan.
rem  2. Compila la app web (app\dist).
rem  3. Enciende UN solo servidor que entrega la app y la API en el
rem     puerto 4000. Desde otros equipos o celulares de la misma red se
rem     abre con http://IP-DE-ESTE-COMPUTADOR:4000
rem  Requisitos: Node.js, MariaDB encendido y backend\.env con una
rem  JWT_SECRETO propia (larga y aleatoria).
rem =====================================================================
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Descargalo de https://nodejs.org ^(version LTS^).
  pause
  exit /b 1
)

if not exist "backend\.env" (
  echo Falta backend\.env. Copia backend\.env.example como backend\.env y cambia JWT_SECRETO.
  pause
  exit /b 1
)

if not exist "backend\node_modules" ( pushd backend & call npm install --omit=dev & popd )
if not exist "app\node_modules" ( pushd app & call npm install & popd )

echo Compilando la app web (tarda un par de minutos)...
pushd app
call npm run build:web
if errorlevel 1 (
  popd
  echo No se pudo compilar la app.
  pause
  exit /b 1
)
popd

echo.
echo Direcciones para abrir AlDia:
echo   En este computador: http://localhost:4000
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do echo   En la red local:   http:%%i:4000 ^(quita el espacio despues de http:^)
echo.
echo Para apagar el servidor cierra esta ventana o presiona Ctrl+C.
cd backend
set NODE_ENV=production
call npm start
pause
