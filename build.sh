#!/usr/bin/env bash
# =====================================================================
# Compilación de AlDía en Render (se ejecuta en cada despliegue).
# 1. Instala las librerías de la app y la compila para web (app/dist).
# 2. Instala las librerías del backend (sin las de pruebas).
# Las tablas y el usuario administrador NO se crean aquí: el backend lo
# hace solo al encender (src/config/prepararBD.js), igual que en local.
# =====================================================================
set -o errexit

echo "==> Compilando la app web"
cd app
npm ci
npm run build:web

echo "==> Instalando el backend"
cd ../backend
npm ci --omit=dev

echo "==> Listo"
