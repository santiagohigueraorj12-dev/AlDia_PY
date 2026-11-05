// Lógica de negocio de usuarios (RF-01, RF-02, RF-03, RNF-01, RNF-09).
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const AppError = require('../../utils/AppError');
const repo = require('./auth.repository');

const RONDAS_BCRYPT = 10;

/** Crea el token JWT que el cliente enviará en cada petición. */
function firmarToken(usuario) {
  return jwt.sign({ id: usuario.id }, config.jwt.secreto, { expiresIn: config.jwt.expira });
}

/** Quita los campos sensibles antes de enviar el usuario al cliente. */
function datosPublicos(u) {
  return { id: u.id, nombre: u.nombre, correo: u.correo, telefono: u.telefono, rol: u.rol };
}

/** RF-01: registro. Exige la autorización de tratamiento de datos (Ley 1581). */
async function registrar({ nombre, correo, telefono, password, aceptaDatos }) {
  if (!aceptaDatos) throw new AppError('Debes autorizar el tratamiento de tus datos personales');
  if (await repo.buscarPorCorreo(correo)) throw AppError.campo('correo', 'Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión?', 409);

  const passwordHash = await bcrypt.hash(password, RONDAS_BCRYPT);
  const id = await repo.crear({ nombre, correo, telefono, passwordHash });
  const usuario = await repo.buscarPorId(id);
  return { token: firmarToken(usuario), usuario: datosPublicos(usuario) };
}

/** RF-02: inicio de sesión. */
async function iniciarSesion({ correo, password }) {
  const usuario = await repo.buscarPorCorreo(correo);
  // Mismo mensaje si el correo no existe o si la clave falla: así no se revela qué cuentas existen.
  const valido = usuario && (await bcrypt.compare(password, usuario.password_hash));
  if (!valido) throw new AppError('Correo o contraseña incorrectos', 401);
  if (!usuario.activo) throw new AppError('Tu cuenta fue desactivada. Contacta al administrador.', 403);
  return { token: firmarToken(usuario), usuario: datosPublicos(usuario) };
}

/**
 * RF-02: recuperar contraseña.
 * El proyecto no tiene servidor de correo: el token se imprime en la consola
 * del backend y, en desarrollo, también se devuelve en la respuesta.
 */
async function solicitarRecuperacion(correo) {
  const respuesta = { mensaje: 'Si el correo está registrado, te enviamos las instrucciones.' };
  const usuario = await repo.buscarPorCorreo(correo);
  if (!usuario) return respuesta;

  const token = crypto.randomBytes(32).toString('hex');
  await repo.guardarTokenRecuperacion(usuario.id, token);
  console.log(`[Recuperación de contraseña] ${correo} -> token: ${token}`);
  if (!config.esProduccion) respuesta.tokenDesarrollo = token;
  return respuesta;
}

async function restablecerPassword({ token, password }) {
  const usuario = await repo.buscarPorTokenVigente(token);
  if (!usuario) throw AppError.campo('token', 'El código de recuperación no es válido o ya expiró');
  await repo.cambiarPassword(usuario.id, await bcrypt.hash(password, RONDAS_BCRYPT));
  return { mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

// --- RF-03: perfil ---

async function perfil(id) {
  return datosPublicos(await repo.buscarPorId(id));
}

async function actualizarPerfil(id, datos) {
  await repo.actualizarPerfil(id, datos);
  return perfil(id);
}

/** Comprueba la contraseña; si no coincide, el error se marca en el campo indicado. */
async function verificarPassword(id, password, campo = 'password') {
  const usuario = await repo.buscarPorId(id);
  if (!(await bcrypt.compare(password, usuario.password_hash))) {
    throw AppError.campo(campo, 'La contraseña no es correcta');
  }
}

async function cambiarPassword(id, { actual, nueva }) {
  await verificarPassword(id, actual, 'actual');
  await repo.cambiarPassword(id, await bcrypt.hash(nueva, RONDAS_BCRYPT));
  return { mensaje: 'Contraseña actualizada' };
}

/** RNF-09 (Ley 1581): el usuario puede eliminar su cuenta y todos sus datos. */
async function eliminarCuenta(id, password) {
  await verificarPassword(id, password);
  await repo.eliminar(id);
  return { mensaje: 'Tu cuenta y tus datos fueron eliminados' };
}

module.exports = {
  registrar, iniciarSesion, solicitarRecuperacion, restablecerPassword,
  perfil, actualizarPerfil, cambiarPassword, eliminarCuenta,
};
