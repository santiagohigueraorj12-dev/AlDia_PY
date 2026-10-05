// Middlewares de autenticación y permisos (RNF-01).
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { queryUno } = require('../config/db');
const AppError = require('../utils/AppError');

/**
 * Verifica el token JWT del encabezado "Authorization: Bearer <token>"
 * y deja el usuario en req.usuario para los siguientes pasos.
 */
async function requiereSesion(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;
  if (!token) throw new AppError('Debes iniciar sesión', 401);

  let datos;
  try {
    datos = jwt.verify(token, config.jwt.secreto);
  } catch {
    throw new AppError('Tu sesión expiró, vuelve a iniciar sesión', 401);
  }

  // Se consulta el usuario en cada petición para respetar si el admin lo desactivó (RF-19).
  const usuario = await queryUno(
    'SELECT id, nombre, correo, telefono, rol, activo FROM usuarios WHERE id = ?',
    [datos.id],
  );
  if (!usuario || !usuario.activo) throw new AppError('Tu cuenta no está activa', 401);

  req.usuario = usuario;
  next();
}

/** Solo el Administrador del sistema. */
function requiereAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') throw AppError.prohibido('Solo el administrador puede hacer esto');
  next();
}

module.exports = { requiereSesion, requiereAdmin };
