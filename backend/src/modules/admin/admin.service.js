// =====================================================================
// ADMINISTRACIÓN  (RF-17, RF-18, RF-19)
// Módulo pequeño: las consultas van directamente en el servicio.
// =====================================================================
const { query, queryUno } = require('../../config/db');
const AppError = require('../../utils/AppError');

/** Tipos de vehículo con su plan base de partes y su regla de RTM. */
async function tiposConPlan() {
  const tipos = await query(
    `SELECT t.id, t.nombre, r.anios_primera FROM tipos_vehiculo t
     LEFT JOIN reglas_rtm r ON r.tipo_vehiculo_id = t.id ORDER BY t.id`,
  );
  const plan = await query('SELECT * FROM plan_base_partes ORDER BY tipo_vehiculo_id, COALESCE(intervalo_km, 999999), intervalo_meses');
  return tipos.map((t) => ({ ...t, partes: plan.filter((p) => p.tipo_vehiculo_id === t.id) }));
}

// --- RF-17: plan base de partes ---
// Los cambios solo afectan a los vehículos que se registren de ahora en adelante.

async function agregarParteBase(tipoId, { nombre, intervalo_km, intervalo_meses }) {
  const tipo = await queryUno('SELECT id FROM tipos_vehiculo WHERE id = ?', [tipoId]);
  if (!tipo) throw AppError.noEncontrado('Tipo de vehículo no encontrado');
  await query(
    'INSERT INTO plan_base_partes (tipo_vehiculo_id, nombre, intervalo_km, intervalo_meses) VALUES (?, ?, ?, ?)',
    [tipoId, nombre, intervalo_km, intervalo_meses],
  );
  return tiposConPlan();
}

async function actualizarParteBase(id, { nombre, intervalo_km, intervalo_meses }) {
  const r = await query(
    'UPDATE plan_base_partes SET nombre = ?, intervalo_km = ?, intervalo_meses = ? WHERE id = ?',
    [nombre, intervalo_km, intervalo_meses, id],
  );
  if (r.affectedRows === 0) throw AppError.noEncontrado('Parte no encontrada');
  return tiposConPlan();
}

async function eliminarParteBase(id) {
  await query('DELETE FROM plan_base_partes WHERE id = ?', [id]);
  return tiposConPlan();
}

// --- RF-18: regla de la primera RTM ---

async function guardarReglaRtm(tipoId, aniosPrimera) {
  await query(
    `INSERT INTO reglas_rtm (tipo_vehiculo_id, anios_primera) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE anios_primera = VALUES(anios_primera)`,
    [tipoId, aniosPrimera],
  );
  return tiposConPlan();
}

// --- RF-19: usuarios ---

function usuarios() {
  return query(
    `SELECT u.id, u.nombre, u.correo, u.telefono, u.rol, u.activo, u.creado_en,
            (SELECT COUNT(*) FROM vehiculos v WHERE v.usuario_id = u.id) AS vehiculos
     FROM usuarios u ORDER BY u.creado_en DESC`,
  );
}

async function cambiarActivo(adminId, usuarioId, activo) {
  if (adminId === usuarioId) throw new AppError('No puedes desactivar tu propia cuenta');
  await query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, usuarioId]);
  return usuarios();
}

module.exports = {
  tiposConPlan, agregarParteBase, actualizarParteBase, eliminarParteBase, guardarReglaRtm, usuarios, cambiarActivo,
};
