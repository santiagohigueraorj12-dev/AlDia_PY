// =====================================================================
// PANEL DE INICIO Y CALENDARIO  (RF-14, RF-15)
// No tiene repositorio propio: reutiliza los vehículos ya "armados"
// por vehiculos.service, que traen desgaste, documentos y estado.
// =====================================================================
const { queryUno } = require('../../config/db');
const { hoy, inicioMes, finMes } = require('../../utils/fechas');
const { NOMBRES } = require('../../domain/documentos');
const vehiculosService = require('../vehiculos/vehiculos.service');

/** Lo gastado en el mes: cambios de partes + pagos de documentos. */
async function gastoDelMes(usuarioId, mes) {
  const desde = inicioMes(mes);
  const hasta = finMes(mes);
  const partes = await queryUno(
    `SELECT COALESCE(SUM(c.costo), 0) AS total FROM cambios_parte c
     JOIN servicios s ON s.id = c.servicio_id JOIN vehiculos v ON v.id = s.vehiculo_id
     WHERE v.usuario_id = ? AND s.fecha BETWEEN ? AND ?`,
    [usuarioId, desde, hasta],
  );
  const documentos = await queryUno(
    `SELECT COALESCE(SUM(r.valor), 0) AS total FROM renovaciones_documento r
     JOIN documentos d ON d.id = r.documento_id JOIN vehiculos v ON v.id = d.vehiculo_id
     WHERE v.usuario_id = ? AND r.fecha_pago BETWEEN ? AND ?`,
    [usuarioId, desde, hasta],
  );
  return { partes: partes.total, documentos: documentos.total, total: partes.total + documentos.total };
}

/** RF-14: todo lo que el usuario necesita ver al entrar. */
async function resumen(usuarioId) {
  const fechaHoy = hoy();
  const vehiculos = await vehiculosService.listar(usuarioId);

  // Partes próximas o vencidas de todos los vehículos, de la más urgente a la menos
  const partesUrgentes = vehiculos
    .flatMap((v) => v.partes
      .filter((p) => p.desgaste.estado !== 'bien')
      .map((p) => ({
        id: p.id, nombre: p.nombre, desgaste: p.desgaste, costoEstimado: p.costoEstimado,
        conocido: Boolean(p.ultimo_cambio_conocido), vehiculoId: v.id, placa: v.placa,
      })))
    .sort((a, b) => b.desgaste.porcentaje - a.desgaste.porcentaje);

  // Documentos vencidos o que vencen en 30 días o menos
  const documentosPorVencer = vehiculos
    .flatMap((v) => v.documentos
      .filter((d) => d.estado !== 'vigente')
      .map((d) => ({ id: d.id, tipo: d.tipo, nombre: NOMBRES[d.tipo], fecha_vencimiento: d.fecha_vencimiento, estado: d.estado, vehiculoId: v.id, placa: v.placa })))
    .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));

  // Costo estimado de las partes que tocaría cambiar este mes
  const finDeMes = finMes(fechaHoy);
  const estimadoMes = vehiculos
    .flatMap((v) => v.partes)
    .filter((p) => p.desgaste.fechaEstimada <= finDeMes)
    .reduce((s, p) => s + (p.costoEstimado || 0), 0);

  return {
    vehiculos: vehiculos.map((v) => ({
      id: v.id, placa: v.placa, tipo: v.tipo, marca: v.marca, modelo: v.modelo, foto_url: v.foto_url,
      estado: v.estado, kmCalculo: v.kmCalculo, kmEstimado: v.kmEstimado, resumenPartes: v.resumenPartes,
    })),
    partesUrgentes,
    documentosPorVencer,
    gastoMes: await gastoDelMes(usuarioId, fechaHoy),
    estimadoMes,
  };
}

/**
 * RF-15: eventos del calendario de un mes.
 *  - Cambios de partes estimados (fechaEstimada calculada con km y tiempo)
 *  - Vencimientos de documentos
 * Las partes ya vencidas se muestran hoy, porque el cambio está pendiente.
 */
async function calendario(usuarioId, mes) {
  const desde = inicioMes(mes);
  const hasta = finMes(mes);
  const vehiculos = await vehiculosService.listar(usuarioId);
  const eventos = [];

  for (const v of vehiculos) {
    for (const p of v.partes) {
      const fecha = p.desgaste.fechaEstimada;
      if (fecha >= desde && fecha <= hasta) {
        eventos.push({ fecha, tipo: 'parte', titulo: p.nombre, placa: v.placa, vehiculoId: v.id, estado: p.desgaste.estado });
      }
    }
    for (const d of v.documentos) {
      if (d.fecha_vencimiento >= desde && d.fecha_vencimiento <= hasta) {
        eventos.push({ fecha: d.fecha_vencimiento, tipo: 'documento', titulo: `Vence ${NOMBRES[d.tipo]}`, placa: v.placa, vehiculoId: v.id, estado: d.estado });
      }
    }
  }
  return eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

module.exports = { resumen, calendario };
