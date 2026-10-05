// =====================================================================
// REGLAS DE DOCUMENTOS DEL VEHÍCULO  (RN-13, RN-15)
// =====================================================================
const { diasEntre } = require('../utils/fechas');

const NOMBRES = {
  soat: 'SOAT',
  rtm: 'Revisión técnico-mecánica',
  impuesto: 'Impuesto vehicular',
};

/** RN-13: días antes del vencimiento en que se avisa (y el mismo día = 0). */
const DIAS_ALERTA = [30, 7, 1, 0];

/**
 * Estado de un documento para mostrarlo con colores:
 *  - "vencido"    -> ya pasó la fecha
 *  - "por_vencer" -> vence en 30 días o menos
 *  - "vigente"    -> falta más de 30 días
 */
function estadoDocumento(fechaVencimiento, hoy) {
  const faltan = diasEntre(hoy, fechaVencimiento);
  if (faltan < 0) return 'vencido';
  if (faltan <= DIAS_ALERTA[0]) return 'por_vencer';
  return 'vigente';
}

/**
 * RN-13: ¿qué alerta corresponde hoy?
 * Devuelve el umbral (30, 7, 1 o 0) más cercano que ya se alcanzó, o null.
 * Se usa "el umbral alcanzado" y no "exactamente ese día" para que, si el
 * servidor estuvo apagado ese día, la alerta igual se envíe después.
 *
 * Ej.: faltan 20 días -> 30 (aviso "vence en menos de 30 días").
 */
function umbralDeAlerta(fechaVencimiento, hoy) {
  const faltan = diasEntre(hoy, fechaVencimiento);
  if (faltan < 0) return null;
  const ordenados = [...DIAS_ALERTA].sort((a, b) => a - b);  // [0, 1, 7, 30]
  const umbral = ordenados.find((u) => faltan <= u);
  return umbral === undefined ? null : umbral;
}

/** RN-15: la nueva fecha de vencimiento debe ser posterior a la anterior. */
function validarRenovacion(fechaAnterior, fechaNueva) {
  if (!fechaNueva || fechaNueva <= fechaAnterior) {
    return { valido: false, mensaje: 'La nueva fecha de vencimiento debe ser posterior a la anterior.' };
  }
  return { valido: true };
}

module.exports = { NOMBRES, DIAS_ALERTA, estadoDocumento, umbralDeAlerta, validarRenovacion };
