// Capa de acceso a datos de usuarios: SOLO consultas SQL, sin reglas de negocio.
const { query, queryUno } = require('../../config/db');

function buscarPorCorreo(correo) {
  return queryUno('SELECT * FROM usuarios WHERE correo = ?', [correo]);
}

function buscarPorId(id) {
  return queryUno('SELECT * FROM usuarios WHERE id = ?', [id]);
}

async function crear({ nombre, correo, passwordHash }) {
  const r = await query(
    `INSERT INTO usuarios (nombre, correo, password_hash, acepta_datos_en)
     VALUES (?, ?, ?, NOW())`,
    [nombre, correo, passwordHash],
  );
  return r.insertId;
}

/** Columnas del perfil que el usuario puede cambiar (RF-03). */
const CAMPOS_PERFIL = ['nombre', 'telefono', 'tipo_documento', 'numero_documento', 'fecha_nacimiento',
  'departamento', 'ciudad', 'direccion', 'licencia_categoria', 'licencia_vence'];

function actualizarPerfil(id, datos) {
  const asignaciones = CAMPOS_PERFIL.map((c) => `${c} = ?`).join(', ');
  const valores = CAMPOS_PERFIL.map((c) => datos[c] ?? null);  // lo que no venga queda vacío (NULL)
  return query(`UPDATE usuarios SET ${asignaciones} WHERE id = ?`, [...valores, id]);
}

function guardarTokenRecuperacion(id, token) {
  return query(
    'UPDATE usuarios SET token_recuperacion = ?, token_expira_en = NOW() + INTERVAL 1 HOUR WHERE id = ?',
    [token, id],
  );
}

/** Usuario dueño de un token de recuperación que todavía no ha expirado. */
function buscarPorTokenVigente(token) {
  return queryUno('SELECT id FROM usuarios WHERE token_recuperacion = ? AND token_expira_en > NOW()', [token]);
}

function cambiarPassword(id, passwordHash) {
  return query(
    'UPDATE usuarios SET password_hash = ?, token_recuperacion = NULL, token_expira_en = NULL WHERE id = ?',
    [passwordHash, id],
  );
}

function eliminar(id) {
  // Por las llaves foráneas ON DELETE CASCADE se borran también sus vehículos,
  // partes, servicios, documentos y notificaciones.
  return query('DELETE FROM usuarios WHERE id = ?', [id]);
}

/**
 * Ley 1581 (derecho de acceso): todos los datos del usuario para descargarlos.
 * Nunca incluye password_hash ni el código de recuperación.
 */
async function datosCompletos(id) {
  const delVehiculo = (tabla) => query(
    `SELECT t.* FROM ${tabla} t JOIN vehiculos v ON v.id = t.vehiculo_id WHERE v.usuario_id = ? ORDER BY t.id`, [id]);
  const [usuario] = await query(
    `SELECT id, nombre, correo, telefono, rol, tipo_documento, numero_documento, fecha_nacimiento,
            departamento, ciudad, direccion, licencia_categoria, licencia_vence, acepta_datos_en, creado_en
       FROM usuarios WHERE id = ?`, [id]);
  return {
    usuario,
    vehiculos: await query(
      'SELECT v.*, t.nombre AS tipo FROM vehiculos v JOIN tipos_vehiculo t ON t.id = v.tipo_vehiculo_id WHERE v.usuario_id = ? ORDER BY v.id', [id]),
    lecturasKilometraje: await delVehiculo('lecturas_km'),
    partes: await delVehiculo('partes_vehiculo'),
    servicios: await delVehiculo('servicios'),
    cambiosDeParte: await query(
      `SELECT c.* FROM cambios_parte c JOIN servicios s ON s.id = c.servicio_id
         JOIN vehiculos v ON v.id = s.vehiculo_id WHERE v.usuario_id = ? ORDER BY c.id`, [id]),
    documentos: await delVehiculo('documentos'),
    renovacionesDeDocumentos: await query(
      `SELECT r.* FROM renovaciones_documento r JOIN documentos d ON d.id = r.documento_id
         JOIN vehiculos v ON v.id = d.vehiculo_id WHERE v.usuario_id = ? ORDER BY r.id`, [id]),
    notificaciones: await query(
      'SELECT id, tipo, titulo, mensaje, leida, creado_en FROM notificaciones WHERE usuario_id = ? ORDER BY id', [id]),
    archivosAdjuntos: await query(
      'SELECT id, nombre, tipo, tamano, creado_en FROM archivos WHERE usuario_id = ? ORDER BY creado_en', [id]),
  };
}

module.exports = {
  buscarPorCorreo, buscarPorId, crear, actualizarPerfil,
  guardarTokenRecuperacion, buscarPorTokenVigente, cambiarPassword, eliminar, datosCompletos,
};
