// Rutas de usuarios:  /api/auth/...
const { Router } = require('express');
const validar = require('../../middlewares/validar');
const { requiereSesion } = require('../../middlewares/auth');
const {
  z, texto, textoOpcional, correo, passwordNueva, passwordActual,
} = require('../../utils/validaciones');
const c = require('./auth.controller');

const nombre = texto('tu nombre', { min: 2, max: 100 });
const telefono = textoOpcional('el teléfono', { max: 20 });

const esquemas = {
  registro: z.object({
    nombre,
    correo: correo(),
    telefono,
    password: passwordNueva(),
    aceptaDatos: z.literal(true, { errorMap: () => ({ message: 'Debes autorizar el tratamiento de tus datos para crear la cuenta' }) }),
  }),
  login: z.object({ correo: correo(), password: passwordActual() }),
  recuperar: z.object({ correo: correo() }),
  restablecer: z.object({ token: texto('el código de recuperación'), password: passwordNueva() }),
  perfil: z.object({ nombre, telefono }),
  cambiarPassword: z.object({ actual: passwordActual('Escribe tu contraseña actual'), nueva: passwordNueva() }),
  eliminar: z.object({ password: passwordActual('Confirma con tu contraseña') }),
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
