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
    `INSERT INTO vehiculos (usuario_id, tipo_vehiculo_id, marca, linea, modelo, placa, fecha_matricula,
                            km_inicial, km_actual, km_actualizado_en, foto_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
    [d.usuario_id, d.tipo_vehiculo_id, d.marca, d.linea, d.modelo, d.placa, d.fecha_matricula,
      d.km_inicial, d.km_inicial, d.foto_url],
  );
  return r.insertId;
}

function actualizar(id, d) {
  // COALESCE: si no se envía foto nueva, se conserva la anterior
  return query(
    `UPDATE vehiculos SET marca = ?, linea = ?, modelo = ?, placa = ?, fecha_matricula = ?,
            foto_url = COALESCE(?, foto_url) WHERE id = ?`,
    [d.marca, d.linea, d.modelo, d.placa, d.fecha_matricula, d.foto_url, id],
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

/**
 * RN-05: copia el plan base del tipo de vehículo.
 * RN-16: todas las partes arrancan con el último cambio "desconocido"
 * (contando desde la matrícula) hasta que el usuario indique el real.
 */
function copiarPlanBase(conn, vehiculoId, tipoId, km, fecha) {
  return conn.query(
    `INSERT INTO partes_vehiculo (vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses,
                                  ultimo_cambio_km, ultimo_cambio_fecha, ultimo_cambio_conocido)
     SELECT ?, codigo, nombre, intervalo_km, intervalo_meses, ?, ?, FALSE FROM plan_base_partes WHERE tipo_vehiculo_id = ?`,
    [vehiculoId, km, fecha, tipoId],
  );
}

/** Partes activas, con cuántos cambios tienen registrados en la app. */
function partesActivas(vehiculoId) {
  return query(
    `SELECT p.*, (SELECT COUNT(*) FROM cambios_parte c WHERE c.parte_id = p.id) AS cambios_registrados
     FROM partes_vehiculo p WHERE p.vehiculo_id = ? AND p.activa = TRUE`,
    [vehiculoId],
  );
}

/** RN-16: guarda el último cambio indicado por el usuario (o lo deja como desconocido). */
function fijarUltimoCambio(conn, parteId, { km, fecha, conocido }) {
  return conn.query(
    'UPDATE partes_vehiculo SET ultimo_cambio_km = ?, ultimo_cambio_fecha = ?, ultimo_cambio_conocido = ? WHERE id = ?',
    [km, fecha, conocido, parteId],
  );
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
  // RN-20: una revisión anterior deja de contar (la parte es nueva).
  await conn.query(
    `UPDATE partes_vehiculo SET ultimo_cambio_km = ?, ultimo_cambio_fecha = ?, ultimo_cambio_conocido = TRUE,
            ultima_revision_fecha = NULL, ultima_revision_km = NULL, revisar_en = NULL WHERE id = ?`,
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

/**
 * RF-10: total gastado en cambios de partes, más (RN-21) lo pagado por arreglar
 * novedades que no eran de una parte del plan (las de una parte ya quedan
 * como un cambio dentro de un servicio).
 */
async function costoMantenimiento(vehiculoId) {
  const partes = await queryUno(
    `SELECT COALESCE(SUM(c.costo), 0) AS total, COUNT(*) AS cambios FROM cambios_parte c
     JOIN servicios s ON s.id = c.servicio_id WHERE s.vehiculo_id = ?`,
    [vehiculoId],
  );
  const novedades = await queryUno(
    `SELECT COALESCE(SUM(costo), 0) AS total FROM novedades
     WHERE vehiculo_id = ? AND estado = 'arreglada' AND servicio_id IS NULL`,
    [vehiculoId],
  );
  return { total: Number(partes.total) + Number(novedades.total), cambios: partes.cambios };
}

// --- Revisiones de partes (RF-27, RN-20) ---

async function registrarRevision(conn, { parteId, fecha, km, revisarEn, nota }) {
  await conn.query(
    'INSERT INTO revisiones_parte (parte_id, fecha, km, revisar_en, nota) VALUES (?, ?, ?, ?, ?)',
    [parteId, fecha, km, revisarEn, nota || null],
  );
  await conn.query(
    'UPDATE partes_vehiculo SET ultima_revision_fecha = ?, ultima_revision_km = ?, revisar_en = ? WHERE id = ?',
    [fecha, km, revisarEn, parteId],
  );
}

function revisionesDeParte(parteId) {
  return query('SELECT id, fecha, km, revisar_en, nota FROM revisiones_parte WHERE parte_id = ? ORDER BY fecha DESC, id DESC', [parteId]);
}

function revisionesDeVehiculo(vehiculoId) {
  return query(
    `SELECT r.id, r.fecha, r.km, r.revisar_en, r.nota, p.nombre AS parte
     FROM revisiones_parte r JOIN partes_vehiculo p ON p.id = r.parte_id
     WHERE p.vehiculo_id = ? ORDER BY r.fecha DESC, r.id DESC`,
    [vehiculoId],
  );
}

// --- Novedades del vehículo (RF-28, RN-21) ---

function listarNovedades(vehiculoId) {
  return query(
    `SELECT n.*, p.nombre AS parte FROM novedades n LEFT JOIN partes_vehiculo p ON p.id = n.parte_id
     WHERE n.vehiculo_id = ? ORDER BY (n.estado = 'pendiente') DESC, n.fecha DESC, n.id DESC`,
    [vehiculoId],
  );
}

/** Panel de daños: los de todos los vehículos del usuario, pendientes primero. */
function listarNovedadesDelUsuario(usuarioId) {
  return query(
    `SELECT n.*, p.nombre AS parte, v.placa, t.nombre AS tipo_vehiculo
     FROM novedades n JOIN vehiculos v ON v.id = n.vehiculo_id
     JOIN tipos_vehiculo t ON t.id = v.tipo_vehiculo_id
     LEFT JOIN partes_vehiculo p ON p.id = n.parte_id
     WHERE v.usuario_id = ? ORDER BY (n.estado = 'pendiente') DESC, n.fecha DESC, n.id DESC`,
    [usuarioId],
  );
}

function novedadesPendientes(vehiculoId) {
  return query(
    `SELECT id, tipo, titulo, fecha, parte_id FROM novedades
     WHERE vehiculo_id = ? AND estado = 'pendiente' ORDER BY fecha, id`,
    [vehiculoId],
  );
}

function buscarNovedad(id) {
  return queryUno('SELECT * FROM novedades WHERE id = ?', [id]);
}

async function crearNovedad(conn, d) {
  const r = await conn.query(
    `INSERT INTO novedades (vehiculo_id, parte_id, tipo, titulo, descripcion, fecha, km, estado, foto_url,
                            arreglada_en, arreglada_km, lugar, costo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [d.vehiculoId, d.parteId || null, d.tipo, d.titulo, d.descripcion || null, d.fecha, d.km, d.estado, d.fotoUrl || null,
      d.arregladaEn || null, d.arregladaKm ?? null, d.lugar || null, d.costo ?? null],
  );
  return r.insertId;
}

function marcarArreglada(conn, id, { fecha, km, lugar, costo, servicioId }) {
  return conn.query(
    `UPDATE novedades SET estado = 'arreglada', arreglada_en = ?, arreglada_km = ?, lugar = ?, costo = ?, servicio_id = ?
     WHERE id = ?`,
    [fecha, km, lugar || null, costo ?? 0, servicioId || null, id],
  );
}

/** Editar los datos de la novedad (y los del arreglo si ya está arreglada). */
function actualizarNovedad(conn, id, d) {
  return conn.query(
    `UPDATE novedades SET tipo = ?, titulo = ?, descripcion = ?, fecha = ?, km = ?, foto_url = COALESCE(?, foto_url),
            arreglada_en = ?, arreglada_km = ?, lugar = ?, costo = ? WHERE id = ?`,
    [d.tipo, d.titulo, d.descripcion || null, d.fecha, d.km, d.fotoUrl || null,
      d.arregladaEn || null, d.arregladaKm ?? null, d.lugar || null, d.costo ?? null, id],
  );
}

/** Si el arreglo quedó como servicio (daño de una parte): se actualizan su lugar y el costo del cambio. */
async function actualizarServicioDeNovedad(conn, { servicioId, parteId, lugar, costo }) {
  await conn.query('UPDATE servicios SET lugar = ? WHERE id = ?', [lugar || null, servicioId]);
  await conn.query('UPDATE cambios_parte SET costo = ? WHERE servicio_id = ? AND parte_id = ?', [costo ?? 0, servicioId, parteId]);
}

function eliminarNovedad(id) {
  return query('DELETE FROM novedades WHERE id = ?', [id]);
}

function reglaRtm(tipoId) {
  return queryUno('SELECT * FROM reglas_rtm WHERE tipo_vehiculo_id = ?', [tipoId]);
}

module.exports = {
  listarDelUsuario, listarTodos, buscarDelUsuario, placaEnUso, crear, actualizar, eliminar,
  lecturas, registrarLectura,
  copiarPlanBase, partesActivas, fijarUltimoCambio, buscarParte, crearParte, actualizarParte, desactivarParte, ultimoCostoPorParte,
  crearServicio, registrarCambio, historialServicios, historialParte, costoMantenimiento, reglaRtm,
  registrarRevision, revisionesDeParte, revisionesDeVehiculo,
  listarNovedades, listarNovedadesDelUsuario, novedadesPendientes, buscarNovedad, crearNovedad, marcarArreglada,
  actualizarNovedad, actualizarServicioDeNovedad, eliminarNovedad,
};
