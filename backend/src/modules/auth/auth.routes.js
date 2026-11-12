// Rutas de usuarios:  /api/auth/...
const { Router } = require('express');
const validar = require('../../middlewares/validar');
const { requiereSesion } = require('../../middlewares/auth');
const {
  z, texto, textoOpcional, fecha, correo, passwordNueva, passwordActual,
} = require('../../utils/validaciones');
const c = require('./auth.controller');

const nombre = texto('tu nombre', { min: 2, max: 100 });
const telefono = textoOpcional('el teléfono', { max: 20 })
  .refine((v) => v === null || /^[\d\s+()-]{7,20}$/.test(v), 'El teléfono solo puede tener números (mínimo 7)');

/** Lista de opciones: si viene vacía queda null. */
const opcion = (valores, mensaje) => z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.enum(valores, { errorMap: () => ({ message: mensaje }) }).nullable(),
);

// RF-03: datos del perfil (todos opcionales; las reglas entre campos están en domain/perfil.js)
const datosPerfil = z.object({
  nombre,
  telefono,
  tipo_documento: opcion(['CC', 'CE', 'TI', 'PA', 'PPT'], 'Elige un tipo de documento de la lista'),
  numero_documento: textoOpcional('el número de documento', { max: 15 })
    .refine((v) => v === null || /^[A-Za-z0-9]{5,15}$/.test(v), 'El documento debe tener entre 5 y 15 números o letras, sin puntos ni espacios'),
  fecha_nacimiento: fecha('la fecha de nacimiento', { noFutura: true, opcional: true }),
  departamento: textoOpcional('el departamento', { max: 60 }),
  ciudad: textoOpcional('la ciudad', { max: 80 }),
  direccion: textoOpcional('la dirección', { max: 150 }),
  licencia_categoria: opcion(['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'], 'Elige una categoría de la lista'),
  licencia_vence: fecha('la fecha de vencimiento de la licencia', { opcional: true }),
});

const esquemas = {
  // RF-01: el registro es corto. Los demás datos se llenan después en "Mi perfil".
  registro: z.object({
    nombre,
    correo: correo(),
    password: passwordNueva(),
    aceptaDatos: z.literal(true, { errorMap: () => ({ message: 'Debes autorizar el tratamiento de tus datos para crear la cuenta' }) }),
  }),
  login: z.object({ correo: correo(), password: passwordActual() }),
  recuperar: z.object({ correo: correo() }),
  restablecer: z.object({ token: texto('el código de recuperación'), password: passwordNueva() }),
  perfil: datosPerfil,
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
