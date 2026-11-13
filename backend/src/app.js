// =====================================================================
// Configuración de Express: middlewares globales y TODAS las rutas.
// Si quieres saber qué URL atiende cada módulo, mira este archivo.
// =====================================================================
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { query } = require('./config/db');
const { CARPETA } = require('./middlewares/subirArchivo');
const { requiereSesion, requiereAdmin } = require('./middlewares/auth');
const { manejadorErrores, rutaNoEncontrada } = require('./middlewares/errores');

const authRoutes = require('./modules/auth/auth.routes');
const { vehiculos, partes } = require('./modules/vehiculos/vehiculos.routes');
const { router: documentos } = require('./modules/documentos/documentos.routes');
const panelRoutes = require('./modules/panel/panel.routes');
const notificacionesRoutes = require('./modules/notificaciones/notificaciones.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const asistenteRoutes = require('./modules/asistente/asistente.routes');

const app = express();

// CORS: permite que la app abierta en el navegador (otro puerto u otro computador)
// llame a esta API. Es seguro abrirlo a cualquier origen porque la sesión viaja en
// el encabezado Authorization (token JWT), no en cookies.
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(CARPETA)); // fotos y documentos adjuntos

// --- Rutas públicas ---
app.get('/api/salud', (req, res) => res.json({ ok: true, app: 'AlDía' }));
app.use('/api/auth', authRoutes);

// --- Rutas que requieren sesión ---
app.use('/api', requiereSesion);
app.get('/api/tipos-vehiculo', async (req, res) => res.json(await query('SELECT id, nombre FROM tipos_vehiculo ORDER BY id')));
app.use('/api/vehiculos', vehiculos);
app.use('/api/partes', partes);
app.use('/api/documentos', documentos);
app.use('/api/panel', panelRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/asistente', asistenteRoutes);
app.use('/api/admin', requiereAdmin, adminRoutes);

// --- App web compilada (producción) ---
// Si existe app/dist (se crea con "npm run build:web" en la carpeta app), este mismo
// servidor entrega la página. Así la app y la API quedan en una sola dirección.
const CARPETA_WEB = process.env.CARPETA_WEB || path.join(__dirname, '..', '..', 'app', 'dist');
const PAGINA = path.join(CARPETA_WEB, 'index.html');
if (fs.existsSync(PAGINA)) {
  app.use(express.static(CARPETA_WEB));
  // Cualquier otra dirección (ej.: /vehiculo/5) la resuelve la app en el navegador
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(PAGINA);
  });
}

// --- Manejo de errores (siempre al final) ---
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

module.exports = app;
