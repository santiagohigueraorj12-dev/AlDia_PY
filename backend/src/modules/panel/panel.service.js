// =====================================================================
// PANEL DE INICIO Y CALENDARIO  (RF-14, RF-15)
// No tiene repositorio propio: reutiliza los vehículos ya "armados"
// por vehiculos.service, que traen desgaste, documentos y estado.
// =====================================================================
const { query, queryUno } = require('../../config/db');
const { saludGeneral, resumenGastos, inicioUltimos12Meses } = require('../../domain/salud');
const { hoy, inicioMes, finMes } = require('../../utils/fechas');
const { NOMBRES, resumenDocumentacion } = require('../../domain/documentos');
const vehiculosService = require('../vehiculos/vehiculos.service');

/** Lo gastado en el mes: cambios de partes (y arreglos de novedades, RN-21) + pagos de documentos. */
async function gastoDelMes(usuarioId, mes) {
  const desde = inicioMes(mes);
  const hasta = finMes(mes);
  const partes = await queryUno(
    `SELECT COALESCE(SUM(c.costo), 0) AS total FROM cambios_parte c
     JOIN servicios s ON s.id = c.servicio_id JOIN vehiculos v ON v.id = s.vehiculo_id
     WHERE v.usuario_id = ? AND s.fecha BETWEEN ? AND ?`,
    [usuarioId, desde, hasta],
  );
  // Arreglos de novedades que no eran de una parte del plan
  const arreglos = await queryUno(
    `SELECT COALESCE(SUM(n.costo), 0) AS total FROM novedades n JOIN vehiculos v ON v.id = n.vehiculo_id
     WHERE v.usuario_id = ? AND n.estado = 'arreglada' AND n.servicio_id IS NULL AND n.arreglada_en BETWEEN ? AND ?`,
    [usuarioId, desde, hasta],
  );
  partes.total = Number(partes.total) + Number(arreglos.total);
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
        conocido: Boolean(p.ultimo_cambio_conocido) || p.cambios_registrados > 0, vehiculoId: v.id, placa: v.placa,
      })))
    .sort((a, b) => b.desgaste.porcentaje - a.desgaste.porcentaje);

  // Documentos vencidos o que vencen en 30 días o menos
  const documentosPorVencer = vehiculos
    .flatMap((v) => v.documentos
      .filter((d) => d.estado !== 'vigente')
      .map((d) => ({ id: d.id, tipo: d.tipo, nombre: NOMBRES[d.tipo], fecha_vencimiento: d.fecha_vencimiento, estado: d.estado, vehiculoId: v.id, placa: v.placa })))
    .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento));
  const documentacion = resumenDocumentacion(vehiculos);

  // RN-21: novedades (daños o golpes) que siguen sin arreglar
  const novedadesPendientes = vehiculos.flatMap((v) => v.novedadesPendientes
    .map((n) => ({ ...n, vehiculoId: v.id, placa: v.placa })));

  // Costo estimado de las partes que tocaría cambiar este mes
  const finDeMes = finMes(fechaHoy);
  const estimadoMes = vehiculos
    .flatMap((v) => v.partes)
    .filter((p) => p.desgaste.fechaEstimada <= finDeMes)
    .reduce((s, p) => s + (p.costoEstimado || 0), 0);

  return {
    vehiculos: vehiculos.map((v) => ({
      id: v.id, placa: v.placa, tipo: v.tipo, marca: v.marca, linea: v.linea, modelo: v.modelo, foto_url: v.foto_url,
      estado: v.estado, salud: v.salud, kmCalculo: v.kmCalculo, kmEstimado: v.kmEstimado, resumenPartes: v.resumenPartes,
    })),
    salud: saludGeneral(vehiculos.map((v) => v.salud)),  // RN-19: anillo de Inicio
    partesUrgentes,
    documentosPorVencer,
    novedadesPendientes,
    documentacion,
    gastoMes: await gastoDelMes(usuarioId, fechaHoy),
    estimadoMes,
  };
}

/**
 * RF-15: eventos del calendario de un mes.
 *  - Cambios de partes estimados (fechaEstimada calculada con km y tiempo)
 *  - Revisiones de partes (RN-20): el mes que eligió el usuario
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
        const revision = p.desgaste.motivo === 'revision';
        eventos.push({
          fecha, tipo: revision ? 'revision' : 'parte', titulo: revision ? `Revisar ${p.nombre.toLowerCase()}` : p.nombre,
          placa: v.placa, vehiculoId: v.id, parteId: p.id, estado: p.desgaste.estado,
        });
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

/** RF-26: gastos de los últimos 12 meses (cambios de partes + pagos de documentos). */
async function gastos(usuarioId) {
  const fechaHoy = hoy();
  const desde = inicioUltimos12Meses(fechaHoy);
  const partes = await query(
    `SELECT DATE_FORMAT(s.fecha, '%Y-%m') AS mes, p.nombre, SUM(c.costo) AS total
       FROM cambios_parte c
       JOIN servicios s ON s.id = c.servicio_id
       JOIN partes_vehiculo p ON p.id = c.parte_id
       JOIN vehiculos v ON v.id = s.vehiculo_id
      WHERE v.usuario_id = ? AND s.fecha BETWEEN ? AND ?
      GROUP BY mes, p.nombre`,
    [usuarioId, desde, fechaHoy],
  );
  // RN-21: arreglos de novedades que no eran de una parte del plan (se agrupan por lo que se dañó)
  const arreglos = await query(
    `SELECT DATE_FORMAT(n.arreglada_en, '%Y-%m') AS mes, n.titulo AS nombre, SUM(n.costo) AS total
       FROM novedades n JOIN vehiculos v ON v.id = n.vehiculo_id
      WHERE v.usuario_id = ? AND n.estado = 'arreglada' AND n.servicio_id IS NULL AND n.arreglada_en BETWEEN ? AND ?
      GROUP BY mes, n.titulo`,
    [usuarioId, desde, fechaHoy],
  );
  const documentos = await query(
    `SELECT DATE_FORMAT(r.fecha_pago, '%Y-%m') AS mes, d.tipo, SUM(r.valor) AS total
       FROM renovaciones_documento r
       JOIN documentos d ON d.id = r.documento_id
       JOIN vehiculos v ON v.id = d.vehiculo_id
      WHERE v.usuario_id = ? AND r.fecha_pago BETWEEN ? AND ?
      GROUP BY mes, d.tipo`,
    [usuarioId, desde, fechaHoy],
  );
  return resumenGastos([...partes, ...arreglos], documentos, fechaHoy);
}

module.exports = { resumen, calendario, gastos };
