// =====================================================================
// REGLAS DE DOCUMENTOS DEL VEHÍCULO  (RN-13, RN-15, RN-22)
// =====================================================================
const { diasEntre, sumarMeses } = require('../utils/fechas');
const { exentoDeImpuesto } = require('./vehiculo');

const NOMBRES = {
  soat: 'SOAT',
  rtm: 'Revisión técnico-mecánica',
  impuesto: 'Impuesto vehicular',
};

/** Cuenta documentos faltantes, vencidos y próximos en el conjunto de vehículos. */
function resumenDocumentacion(vehiculos) {
  const documentos = vehiculos.flatMap((vehiculo) => {
    const registrados = vehiculo.documentos;
    const faltantes = Object.keys(NOMBRES)
      .filter((tipo) => !(tipo === 'impuesto' && exentoDeImpuesto(vehiculo)))  // RN-22: moto de hasta 125 cc
      .filter((tipo) => !registrados.some((documento) => documento.tipo === tipo))
      .map((tipo) => ({ tipo, estado: 'faltante' }));
    return [...registrados, ...faltantes];
  });

  return {
    faltantes: documentos.filter((documento) => documento.estado === 'faltante').length,
    vencidos: documentos.filter((documento) => documento.estado === 'vencido').length,
    porVencer: documentos.filter((documento) => documento.estado === 'por_vencer').length,
  };
}

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

/**
 * RN-15: tope del vencimiento. El SOAT y la técnico-mecánica duran un año (se deja
 * un mes de margen: 13 meses); el impuesto es anual con fecha límite que fija cada
 * departamento (18 meses). Se cuenta desde hoy o, si se renueva antes de que venza,
 * desde el vencimiento anterior (el documento nuevo empieza cuando termina el viejo).
 */
const MESES_MAXIMOS = { soat: 13, rtm: 13, impuesto: 18 };
function validarVencimiento(tipo, fecha, hoy, fechaAnterior = null) {
  const desde = fechaAnterior && fechaAnterior > hoy ? fechaAnterior : hoy;
  const maximo = sumarMeses(desde, MESES_MAXIMOS[tipo] || 18);
  if (fecha > maximo) {
    return { valido: false, mensaje: `${NOMBRES[tipo]} dura un año: la fecha de vencimiento no puede pasar del ${maximo.split('-').reverse().join('/')}.` };
  }
  return { valido: true };
}

/** RN-15: la nueva fecha de vencimiento debe ser posterior a la anterior (y respetar el tope). */
function validarRenovacion(fechaAnterior, fechaNueva, tipo = null, hoy = null) {
  if (!fechaNueva || fechaNueva <= fechaAnterior) {
    return { valido: false, mensaje: 'La nueva fecha de vencimiento debe ser posterior a la anterior.' };
  }
  if (tipo && hoy) return validarVencimiento(tipo, fechaNueva, hoy, fechaAnterior);
  return { valido: true };
}

/** Fecha que se propone al renovar: un año después del vencimiento anterior (o de hoy, si ya venció hace tiempo). */
function fechaSugerida(fechaAnterior, hoy) {
  const base = fechaAnterior && fechaAnterior >= sumarMeses(hoy, -1) ? fechaAnterior : hoy;
  return sumarMeses(base, 12);
}

module.exports = {
  NOMBRES, DIAS_ALERTA, MESES_MAXIMOS,
  estadoDocumento, umbralDeAlerta, validarRenovacion, validarVencimiento, fechaSugerida, resumenDocumentacion,
};
