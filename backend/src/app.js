// =====================================================================
// Configuración de Express: middlewares globales y TODAS las rutas.
// Si quieres saber qué URL atiende cada módulo, mira este archivo.
// =====================================================================
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { query } = require('./config/db');
const { CARPETA } = require('./middlewares/subirArchivo');
const { requiereSesion, requiereAdmin } = require('./middlewares/auth');
const { manejadorErrores, rutaNoEncontrada } = require('./middlewares/errores');

const authRoutes = require('./modules/auth/auth.routes');
const { vehiculos, partes, novedades } = require('./modules/vehiculos/vehiculos.routes');
const { router: documentos } = require('./modules/documentos/documentos.routes');
const panelRoutes = require('./modules/panel/panel.routes');
const notificacionesRoutes = require('./modules/notificaciones/notificaciones.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const asistenteRoutes = require('./modules/asistente/asistente.routes');
const archivosRoutes = require('./modules/archivos/archivos.routes');

const app = express();

// En la nube (Render) las peticiones llegan a través de un proxy; así req.ip es la
// IP real del usuario y el límite de intentos funciona por persona.
app.set('trust proxy', 1);

// Encabezados de seguridad (evitan que la página se meta en un iframe ajeno,
// que el navegador "adivine" tipos de archivo, etc.). La política de contenido
// (CSP) se desactiva porque la app web de Expo usa estilos y scripts en línea.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS: permite que la app abierta en el navegador (otro puerto u otro computador)
// llame a esta API. Es seguro abrirlo a cualquier origen porque la sesión viaja en
// el encabezado Authorization (token JWT), no en cookies.
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(CARPETA)); // adjuntos antiguos guardados en el disco local

// --- Límite de intentos (contra quien prueba contraseñas una y otra vez) ---
// Se cuenta por IP + correo: en un salón donde todos comparten la misma IP,
// los errores de una persona no bloquean a las demás.
const porIpYCorreo = (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.correo || '').toLowerCase()}`;
const mensajeLimite = (texto) => ({ error: texto });

const limiteInicioSesion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,                    // 10 intentos fallidos cada 15 minutos
  skipSuccessfulRequests: true, // los inicios de sesión correctos no cuentan
  keyGenerator: porIpYCorreo,
  message: mensajeLimite('Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.'),
});
const limiteRecuperacion = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,                     // 5 correos de recuperación por hora
  keyGenerator: porIpYCorreo,
  message: mensajeLimite('Ya pediste varios códigos. Revisa tu correo o espera una hora.'),
});
const limiteGeneral = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,                   // 300 peticiones por minuto: de sobra para un uso normal
  message: mensajeLimite('Demasiadas peticiones. Espera un momento.'),
});

// --- Rutas públicas ---
app.get('/api/salud', (req, res) => res.json({ ok: true, app: 'AlDía' }));
app.use('/api', limiteGeneral);
app.use('/api/auth/login', limiteInicioSesion);
app.use(['/api/auth/recuperar', '/api/auth/registro'], limiteRecuperacion);
app.use('/api/auth', authRoutes);
app.use('/api/archivos', archivosRoutes); // fotos y PDF guardados en la base de datos

// --- Rutas que requieren sesión ---
app.use('/api', requiereSesion);
app.get('/api/tipos-vehiculo', async (req, res) => res.json(await query('SELECT id, nombre FROM tipos_vehiculo ORDER BY id')));
app.use('/api/vehiculos', vehiculos);
app.use('/api/partes', partes);
app.use('/api/novedades', novedades);
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
