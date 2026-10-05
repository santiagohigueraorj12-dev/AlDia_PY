// =====================================================================
// REGLAS DEL VEHÍCULO  (RN-11, RN-12, RN-14)
// =====================================================================
const { sumarMeses } = require('../utils/fechas');

const PARTES_CRITICAS = ['pastillas_freno', 'llantas'];  // RN-11
const DOCUMENTOS_OBLIGATORIOS = ['soat', 'rtm'];        // RN-11

/**
 * RN-11: estado general del vehículo.
 *  - "no_apto"           -> SOAT o revisión técnico-mecánica vencidos.
 *  - "requiere_atencion" -> pastillas de freno o llantas vencidas.
 *  - "al_dia"            -> ninguna de las anteriores.
 *
 * @param {object[]} partes con .codigo y .desgaste.estado
 * @param {object[]} documentos con .tipo ('soat', 'rtm', 'impuesto') y .fecha_vencimiento
 * @param {string} hoy 'AAAA-MM-DD'
 */
function estadoVehiculo(partes, documentos, hoy) {
  const documentoVencido = documentos.some(
    (d) => DOCUMENTOS_OBLIGATORIOS.includes(d.tipo) && d.fecha_vencimiento < hoy,
  );
  if (documentoVencido) return 'no_apto';

  const parteCriticaVencida = partes.some(
    (p) => PARTES_CRITICAS.includes(p.codigo) && p.desgaste.estado === 'vencida',
  );
  if (parteCriticaVencida) return 'requiere_atencion';

  return 'al_dia';
}

/**
 * RN-12: costo por km = suma de los costos de los cambios / km recorridos
 * desde que se registró el vehículo. Si aún no ha recorrido km, devuelve null
 * (no se puede dividir entre cero).
 */
function costoPorKm(totalCostos, kmInicial, kmActual) {
  const recorridos = kmActual - kmInicial;
  if (recorridos <= 0) return null;
  return Math.round((totalCostos / recorridos) * 100) / 100;
}

/**
 * RN-14: fecha de la primera revisión técnico-mecánica según la regla del tipo.
 * @param {string} fechaMatricula 'AAAA-MM-DD'
 * @param {{ anios_primera: number }} regla
 */
function fechaPrimeraRtm(fechaMatricula, regla) {
  return sumarMeses(fechaMatricula, regla.anios_primera * 12);
}

module.exports = { PARTES_CRITICAS, estadoVehiculo, costoPorKm, fechaPrimeraRtm };
