// Consultas SQL de los documentos del vehículo y su historial de renovaciones.
const { query, queryUno } = require('../../config/db');

function listarDeVehiculo(vehiculoId) {
  return query(
    `SELECT d.*, (SELECT valor FROM renovaciones_documento r WHERE r.documento_id = d.id
                  ORDER BY r.fecha_pago DESC, r.id DESC LIMIT 1) AS ultimo_valor
     FROM documentos d WHERE d.vehiculo_id = ?
     ORDER BY FIELD(d.tipo, 'soat', 'rtm', 'impuesto')`,
    [vehiculoId],
  );
}

/** RN-01: busca el documento SOLO si su vehículo pertenece al usuario. */
function buscarDelUsuario(id, usuarioId) {
  return queryUno(
    `SELECT d.*, v.placa FROM documentos d JOIN vehiculos v ON v.id = d.vehiculo_id
     WHERE d.id = ? AND v.usuario_id = ?`,
    [id, usuarioId],
  );
}

function buscarPorTipo(vehiculoId, tipo) {
  return queryUno('SELECT id FROM documentos WHERE vehiculo_id = ? AND tipo = ?', [vehiculoId, tipo]);
}

async function crear(conn, { vehiculoId, tipo, fechaVencimiento, archivoUrl }) {
  const r = await conn.query(
    'INSERT INTO documentos (vehiculo_id, tipo, fecha_vencimiento, archivo_url) VALUES (?, ?, ?, ?)',
    [vehiculoId, tipo, fechaVencimiento, archivoUrl],
  );
  return r.insertId;
}

function actualizarVencimiento(conn, id, fechaVencimiento, archivoUrl) {
  return conn.query(
    'UPDATE documentos SET fecha_vencimiento = ?, archivo_url = COALESCE(?, archivo_url) WHERE id = ?',
    [fechaVencimiento, archivoUrl, id],
  );
}

function registrarEnHistorial(conn, { documentoId, fechaVencimiento, fechaPago, valor }) {
  return conn.query(
    'INSERT INTO renovaciones_documento (documento_id, fecha_vencimiento, fecha_pago, valor) VALUES (?, ?, ?, ?)',
    [documentoId, fechaVencimiento, fechaPago, valor],
  );
}

function historial(documentoId) {
  return query(
    'SELECT fecha_vencimiento, fecha_pago, valor FROM renovaciones_documento WHERE documento_id = ? ORDER BY fecha_pago DESC, id DESC',
    [documentoId],
  );
}

function eliminar(id) {
  return query('DELETE FROM documentos WHERE id = ?', [id]);
}

/** Total pagado en documentos de un vehículo. */
async function costoDocumentos(vehiculoId) {
  const fila = await queryUno(
    `SELECT COALESCE(SUM(r.valor), 0) AS total FROM renovaciones_documento r
     JOIN documentos d ON d.id = r.documento_id WHERE d.vehiculo_id = ?`,
    [vehiculoId],
  );
  return fila.total;
}

module.exports = {
  listarDeVehiculo, buscarDelUsuario, buscarPorTipo, crear, actualizarVencimiento,
  registrarEnHistorial, historial, eliminar, costoDocumentos,
};
