// Rutas de usuarios:  /api/auth/...
const { Router } = require('express');
const { z } = require('zod');
const validar = require('../../middlewares/validar');
const { requiereSesion } = require('../../middlewares/auth');
const c = require('./auth.controller');

const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres');
const correo = z.string().trim().toLowerCase().email('Correo no válido');

const esquemas = {
  registro: z.object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre'),
    correo,
    telefono: z.string().trim().max(20).optional().nullable(),
    password,
    aceptaDatos: z.boolean(),
  }),
  login: z.object({ correo, password: z.string().min(1, 'Escribe tu contraseña') }),
  recuperar: z.object({ correo }),
  restablecer: z.object({ token: z.string().min(10), password }),
  perfil: z.object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre'),
    telefono: z.string().trim().max(20).optional().nullable(),
  }),
  cambiarPassword: z.object({ actual: z.string().min(1), nueva: password }),
  eliminar: z.object({ password: z.string().min(1, 'Confirma con tu contraseña') }),
};

const router = Router();

// Públicas (RF-01, RF-02)
router.post('/registro', validar(esquemas.registro), c.registrar);
router.post('/login', validar(esquemas.login), c.iniciarSesion);
router.post('/recuperar', validar(esquemas.recuperar), c.solicitarRecuperacion);
router.post('/restablecer', validar(esquemas.restablecer), c.restablecerPassword);
// Nota: "cerrar sesión" se hace en el cliente borrando el token JWT.

// Requieren sesión
router.get('/perfil', requiereSesion, c.perfil);
router.put('/perfil', requiereSesion, validar(esquemas.perfil), c.actualizarPerfil);
router.put('/password', requiereSesion, validar(esquemas.cambiarPassword), c.cambiarPassword);
router.delete('/cuenta', requiereSesion, validar(esquemas.eliminar), c.eliminarCuenta);  // RNF-09

module.exports = router;
