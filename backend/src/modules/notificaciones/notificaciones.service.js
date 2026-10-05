// Notificaciones dentro de la aplicación (RF-16).
const { query, queryUno } = require('../../config/db');

/**
 * Crea una notificación. La "clave" identifica la alerta: si ya existe una
 * con la misma clave para ese usuario, INSERT IGNORE no hace nada.
 * Así la misma alerta nunca se envía dos veces.
 */
function crear(usuarioId, { tipo, titulo, mensaje, enlace = null, clave }) {
  return query(
    `INSERT IGNORE INTO notificaciones (usuario_id, tipo, titulo, mensaje, enlace, clave)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [usuarioId, tipo, titulo, mensaje, enlace, clave],
  );
}

/** Fecha de la última notificación cuya clave empieza por "prefijo" (o null). */
async function ultimaConPrefijo(usuarioId, prefijo) {
  const fila = await queryUno(
    'SELECT MAX(creado_en) AS fecha FROM notificaciones WHERE usuario_id = ? AND clave LIKE ?',
    [usuarioId, `${prefijo}%`],
  );
  return fila.fecha;
}

function listar(usuarioId) {
  return query(
    `SELECT id, tipo, titulo, mensaje, enlace, leida, creado_en FROM notificaciones
     WHERE usuario_id = ? ORDER BY creado_en DESC, id DESC LIMIT 100`,
    [usuarioId],
  );
}

async function contarNoLeidas(usuarioId) {
  const fila = await queryUno('SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = ? AND leida = FALSE', [usuarioId]);
  return fila.total;
}

function marcarLeida(usuarioId, id) {
  return query('UPDATE notificaciones SET leida = TRUE WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
}

function marcarTodasLeidas(usuarioId) {
  return query('UPDATE notificaciones SET leida = TRUE WHERE usuario_id = ?', [usuarioId]);
}

module.exports = { crear, ultimaConPrefijo, listar, contarNoLeidas, marcarLeida, marcarTodasLeidas };
