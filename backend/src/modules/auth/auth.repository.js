// Capa de acceso a datos de usuarios: SOLO consultas SQL, sin reglas de negocio.
const { query, queryUno } = require('../../config/db');

function buscarPorCorreo(correo) {
  return queryUno('SELECT * FROM usuarios WHERE correo = ?', [correo]);
}

function buscarPorId(id) {
  return queryUno('SELECT * FROM usuarios WHERE id = ?', [id]);
}

async function crear({ nombre, correo, telefono, passwordHash }) {
  const r = await query(
    `INSERT INTO usuarios (nombre, correo, telefono, password_hash, acepta_datos_en)
     VALUES (?, ?, ?, ?, NOW())`,
    [nombre, correo, telefono || null, passwordHash],
  );
  return r.insertId;
}

function actualizarPerfil(id, { nombre, telefono }) {
  return query('UPDATE usuarios SET nombre = ?, telefono = ? WHERE id = ?', [nombre, telefono || null, id]);
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

module.exports = {
  buscarPorCorreo, buscarPorId, crear, actualizarPerfil,
  guardarTokenRecuperacion, buscarPorTokenVigente, cambiarPassword, eliminar,
};
