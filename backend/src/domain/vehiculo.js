// =====================================================================
// REGLAS DEL VEHÍCULO  (RN-02, RN-11, RN-12, RN-14, RN-21, RN-22)
// =====================================================================
const { sumarMeses } = require('../utils/fechas');

// RN-11: partes de seguridad. El kit de arrastre (cadena) solo existe en las motos de cambios.
const PARTES_CRITICAS = ['pastillas_freno', 'llantas', 'kit_arrastre'];
const DOCUMENTOS_OBLIGATORIOS = ['soat', 'rtm'];        // RN-11

/**
 * RN-11: estado general del vehículo.
 *  - "no_apto"           -> SOAT o revisión técnico-mecánica vencidos, o (RN-21) un daño
 *                           pendiente que no deja usar el vehículo.
 *  - "requiere_atencion" -> pastillas de freno o llantas vencidas, o
 *                           (RN-21) una novedad (daño o golpe) pendiente por arreglar.
 *  - "al_dia"            -> ninguna de las anteriores.
 *
 * @param {object[]} partes con .codigo y .desgaste.estado
 * @param {object[]} documentos con .tipo ('soat', 'rtm', 'impuesto') y .fecha_vencimiento
 * @param {string} hoy 'AAAA-MM-DD'
 * @param {number|object[]} novedades daños pendientes (RN-21): la cantidad, o la lista con .impide_circular
 */
function estadoVehiculo(partes, documentos, hoy, novedades = 0) {
  const lista = Array.isArray(novedades) ? novedades : Array.from({ length: novedades }, () => ({}));
  const documentoVencido = documentos.some(
    (d) => DOCUMENTOS_OBLIGATORIOS.includes(d.tipo) && d.fecha_vencimiento < hoy,
  );
  if (documentoVencido) return 'no_apto';
  if (lista.some((n) => Boolean(n.impide_circular))) return 'no_apto';  // RN-21: el daño no deja usarlo

  const parteCriticaVencida = partes.some(
    (p) => PARTES_CRITICAS.includes(p.codigo) && p.desgaste.estado === 'vencida',
  );
  if (parteCriticaVencida) return 'requiere_atencion';
  if (lista.length > 0) return 'requiere_atencion';  // RN-21

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
 * RN-14: fecha de la primera revisión técnico-mecánica según la regla del tipo
 * (motos a los 2 años y carros particulares a los 5: Ley 769 de 2002, art. 52,
 * modificado por la Ley 2294 de 2023). Excepción de esa ley: los carros
 * matriculados entre el 20/05/2017 y el 19/05/2018 la hacen a los 6 años.
 * @param {string} fechaMatricula 'AAAA-MM-DD'
 * @param {{ anios_primera: number }} regla
 * @param {number} tipoVehiculoId 1 = moto, 2 = carro
 */
function fechaPrimeraRtm(fechaMatricula, regla, tipoVehiculoId = null) {
  const excepcion = Number(tipoVehiculoId) === 2 && fechaMatricula >= '2017-05-20' && fechaMatricula <= '2018-05-19';
  return sumarMeses(fechaMatricula, (excepcion ? 6 : regla.anios_primera) * 12);
}

/**
 * RN-02: formato de la placa colombiana según el tipo.
 *  - Carro: 3 letras y 3 números (ABC123)
 *  - Moto:  3 letras, 2 números y 1 letra (ABC12D)
 */
function validarPlaca(placa, tipo) {
  const esMoto = String(tipo).toLowerCase() === 'moto' || Number(tipo) === 1;
  const ok = esMoto ? /^[A-Z]{3}\d{2}[A-Z]$/.test(placa) : /^[A-Z]{3}\d{3}$/.test(placa);
  if (ok) return { valido: true };
  return { valido: false, mensaje: esMoto ? 'La placa de una moto tiene 3 letras, 2 números y 1 letra (ej.: ABC12D)' : 'La placa de un carro tiene 3 letras y 3 números (ej.: ABC123)' };
}

/** RN-22: las motos de hasta 125 cc no pagan impuesto vehicular (Ley 488 de 1998, art. 141). */
const CILINDRAJE_EXENTO = 125;
function exentoDeImpuesto(vehiculo) {
  const esMoto = String(vehiculo.tipo).toLowerCase() === 'moto' || Number(vehiculo.tipo_vehiculo_id) === 1;
  return esMoto && Number(vehiculo.cilindraje) > 0 && Number(vehiculo.cilindraje) <= CILINDRAJE_EXENTO;
}

module.exports = { PARTES_CRITICAS, CILINDRAJE_EXENTO, estadoVehiculo, costoPorKm, fechaPrimeraRtm, validarPlaca, exentoDeImpuesto };
