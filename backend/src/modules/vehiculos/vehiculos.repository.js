// Consultas SQL de vehículos, kilometraje, partes y servicios.
// Esta capa NO tiene reglas de negocio: solo lee y escribe en la BD.
const { query, queryUno } = require('../../config/db');

const SELECT_VEHICULO = `
  SELECT v.*, t.nombre AS tipo FROM vehiculos v
  JOIN tipos_vehiculo t ON t.id = v.tipo_vehiculo_id`;

// --- Vehículos ---

function listarDelUsuario(usuarioId) {
  return query(`${SELECT_VEHICULO} WHERE v.usuario_id = ? ORDER BY v.creado_en`, [usuarioId]);
}

function listarTodos() {
  return query(`${SELECT_VEHICULO} JOIN usuarios u ON u.id = v.usuario_id WHERE u.activo = TRUE`);
}

/** RN-01: busca el vehículo SOLO si pertenece al usuario. */
function buscarDelUsuario(id, usuarioId) {
  return queryUno(`${SELECT_VEHICULO} WHERE v.id = ? AND v.usuario_id = ?`, [id, usuarioId]);
}

function placaEnUso(placa, exceptoId = 0) {
  return queryUno('SELECT id FROM vehiculos WHERE placa = ? AND id <> ?', [placa, exceptoId]);
}

async function crear(conn, d) {
  const r = await conn.query(
    `INSERT INTO vehiculos (usuario_id, tipo_vehiculo_id, marca, modelo, anio, placa, fecha_matricula,
                            km_inicial, km_actual, km_actualizado_en, foto_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
    [d.usuario_id, d.tipo_vehiculo_id, d.marca, d.modelo, d.anio, d.placa, d.fecha_matricula,
      d.km_inicial, d.km_inicial, d.foto_url],
  );
  return r.insertId;
}

function actualizar(id, d) {
  // COALESCE: si no se envía foto nueva, se conserva la anterior
  return query(
    `UPDATE vehiculos SET marca = ?, modelo = ?, anio = ?, placa = ?, fecha_matricula = ?,
            foto_url = COALESCE(?, foto_url) WHERE id = ?`,
    [d.marca, d.modelo, d.anio, d.placa, d.fecha_matricula, d.foto_url, id],
  );
}

function eliminar(id) {
  return query('DELETE FROM vehiculos WHERE id = ?', [id]);  // borra en cascada partes, servicios, documentos...
}

// --- Kilometraje ---

function lecturas(vehiculoId) {
  return query('SELECT id, km, fecha FROM lecturas_km WHERE vehiculo_id = ? ORDER BY fecha DESC', [vehiculoId]);
}

async function registrarLectura(conn, vehiculoId, km) {
  await conn.query('INSERT INTO lecturas_km (vehiculo_id, km, fecha) VALUES (?, ?, NOW())', [vehiculoId, km]);
  await conn.query('UPDATE vehiculos SET km_actual = ?, km_actualizado_en = NOW() WHERE id = ?', [km, vehiculoId]);
}

// --- Partes ---

/** RN-05: copia el plan base del tipo de vehículo. Todas las partes arrancan en 0 %. */
function copiarPlanBase(conn, vehiculoId, tipoId, km, fecha) {
  return conn.query(
    `INSERT INTO partes_vehiculo (vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses, ultimo_cambio_km, ultimo_cambio_fecha)
     SELECT ?, codigo, nombre, intervalo_km, intervalo_meses, ?, ? FROM plan_base_partes WHERE tipo_vehiculo_id = ?`,
    [vehiculoId, km, fecha, tipoId],
  );
}

function partesActivas(vehiculoId) {
  return query('SELECT * FROM partes_vehiculo WHERE vehiculo_id = ? AND activa = TRUE', [vehiculoId]);
}

function buscarParte(id) {
  return queryUno('SELECT * FROM partes_vehiculo WHERE id = ? AND activa = TRUE', [id]);
}

function crearParte(vehiculoId, d) {
  return query(
    `INSERT INTO partes_vehiculo (vehiculo_id, nombre, intervalo_km, intervalo_meses, ultimo_cambio_km, ultimo_cambio_fecha)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [vehiculoId, d.nombre, d.intervalo_km, d.intervalo_meses, d.ultimo_cambio_km, d.ultimo_cambio_fecha],
  );
}

function actualizarParte(id, d) {
  return query(
    'UPDATE partes_vehiculo SET nombre = ?, intervalo_km = ?, intervalo_meses = ? WHERE id = ?',
    [d.nombre, d.intervalo_km, d.intervalo_meses, id],
  );
}

function desactivarParte(id) {
  return query('UPDATE partes_vehiculo SET activa = FALSE WHERE id = ?', [id]);
}

/** Costo del último cambio de cada parte: sirve como costo estimado del próximo cambio. */
async function ultimoCostoPorParte(vehiculoId) {
  const filas = await query(
    `SELECT c.parte_id, c.costo FROM cambios_parte c
     JOIN servicios s ON s.id = c.servicio_id
     WHERE s.vehiculo_id = ? ORDER BY s.fecha, c.id`,
    [vehiculoId],
  );
  const mapa = {};
  for (const f of filas) mapa[f.parte_id] = f.costo;  // el más reciente sobrescribe a los anteriores
  return mapa;
}

// --- Servicios y cambios ---

async function crearServicio(conn, { vehiculoId, fecha, km, lugar }) {
  const r = await conn.query(
    'INSERT INTO servicios (vehiculo_id, fecha, km, lugar) VALUES (?, ?, ?, ?)',
    [vehiculoId, fecha, km, lugar || null],
  );
  return r.insertId;
}

async function registrarCambio(conn, { servicioId, parteId, costo, marcaReferencia, km, fecha }) {
  await conn.query(
    'INSERT INTO cambios_parte (servicio_id, parte_id, costo, marca_referencia) VALUES (?, ?, ?, ?)',
    [servicioId, parteId, costo, marcaReferencia || null],
  );
  // RN-09: el desgaste vuelve a 0 % porque el "último cambio" pasa a ser este.
  await conn.query(
    'UPDATE partes_vehiculo SET ultimo_cambio_km = ?, ultimo_cambio_fecha = ? WHERE id = ?',
    [km, fecha, parteId],
  );
}

/** RF-09: servicios de un vehículo, cada uno con sus cambios y su total. */
async function historialServicios(vehiculoId) {
  const servicios = await query(
    'SELECT id, fecha, km, lugar FROM servicios WHERE vehiculo_id = ? ORDER BY fecha DESC, id DESC',
    [vehiculoId],
  );
  if (servicios.length === 0) return [];
  const cambios = await query(
    `SELECT c.servicio_id, c.parte_id, p.nombre AS parte, c.costo, c.marca_referencia
     FROM cambios_parte c JOIN partes_vehiculo p ON p.id = c.parte_id
     WHERE c.servicio_id IN (?)`,
    [servicios.map((s) => s.id)],
  );
  return servicios.map((s) => {
    const suyos = cambios.filter((c) => c.servicio_id === s.id);
    return { ...s, cambios: suyos, total: suyos.reduce((t, c) => t + c.costo, 0) };
  });
}

/** RF-09: cambios de una parte. */
function historialParte(parteId) {
  return query(
    `SELECT s.fecha, s.km, s.lugar, c.costo, c.marca_referencia
     FROM cambios_parte c JOIN servicios s ON s.id = c.servicio_id
     WHERE c.parte_id = ? ORDER BY s.fecha DESC`,
    [parteId],
  );
}

/** RF-10: total gastado en cambios de partes. */
function costoMantenimiento(vehiculoId) {
  return queryUno(
    `SELECT COALESCE(SUM(c.costo), 0) AS total, COUNT(*) AS cambios FROM cambios_parte c
     JOIN servicios s ON s.id = c.servicio_id WHERE s.vehiculo_id = ?`,
    [vehiculoId],
  );
}

function reglaRtm(tipoId) {
  return queryUno('SELECT * FROM reglas_rtm WHERE tipo_vehiculo_id = ?', [tipoId]);
}

module.exports = {
  listarDelUsuario, listarTodos, buscarDelUsuario, placaEnUso, crear, actualizar, eliminar,
  lecturas, registrarLectura,
  copiarPlanBase, partesActivas, buscarParte, crearParte, actualizarParte, desactivarParte, ultimoCostoPorParte,
  crearServicio, registrarCambio, historialServicios, historialParte, costoMantenimiento, reglaRtm,
};
