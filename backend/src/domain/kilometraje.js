// =====================================================================
// REGLAS DE KILOMETRAJE  (RN-03, RN-04)
// =====================================================================
const { diasEntre } = require('../utils/fechas');

const SALTO_SOSPECHOSO_KM = 1500;  // RN-03
const HORAS_SALTO_SOSPECHOSO = 24; // RN-03: "en menos de un día"
const DIAS_SIN_ACTUALIZAR = 15;    // RN-04

/**
 * RN-03: valida un nuevo kilometraje.
 *  - Nunca puede ser menor al último registrado  -> error.
 *  - Si sube más de 1.500 km en menos de un día -> pedir confirmación.
 *
 * @returns {{ valido: boolean, requiereConfirmacion?: boolean, mensaje?: string }}
 */
function validarNuevoKm({ kmAnterior, fechaAnterior, kmNuevo, fechaNueva, confirmado = false }) {
  if (!Number.isInteger(kmNuevo) || kmNuevo < 0) {
    return { valido: false, mensaje: 'El kilometraje debe ser un número entero positivo.' };
  }
  if (kmNuevo < kmAnterior) {
    return {
      valido: false,
      mensaje: `El kilometraje no puede ser menor al último registrado (${kmAnterior.toLocaleString('es-CO')} km).`,
    };
  }
  const horas = (new Date(fechaNueva.replace(' ', 'T')) - new Date(fechaAnterior.replace(' ', 'T'))) / 3600000;
  const aumento = kmNuevo - kmAnterior;
  if (aumento > SALTO_SOSPECHOSO_KM && horas < HORAS_SALTO_SOSPECHOSO && !confirmado) {
    return {
      valido: false,
      requiereConfirmacion: true,
      mensaje: `El kilometraje aumentó ${aumento.toLocaleString('es-CO')} km en menos de un día. ¿Es correcto?`,
    };
  }
  return { valido: true };
}

/**
 * Promedio de km recorridos por día, calculado con las lecturas reales.
 * Necesita al menos 2 lecturas separadas por 1 día o más; si no, devuelve null.
 *
 * @param {{ km: number, fecha: string }[]} lecturas
 */
function promedioDiario(lecturas) {
  if (!lecturas || lecturas.length < 2) return null;
  const ordenadas = [...lecturas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const primera = ordenadas[0];
  const ultima = ordenadas[ordenadas.length - 1];
  const dias = diasEntre(primera.fecha, ultima.fecha);
  if (dias < 1) return null;
  return (ultima.km - primera.km) / dias;
}

/**
 * RN-04: si el km no se actualiza en 15 días, se estima con el promedio diario.
 * El km estimado NO se guarda como real: solo se usa para calcular el desgaste.
 *
 * @returns {{ km: number, estimado: boolean, diasSinActualizar: number }}
 */
function kmParaCalculo({ kmActual, fechaUltimaLectura, promedio, hoy }) {
  const diasSinActualizar = diasEntre(fechaUltimaLectura, hoy);
  if (diasSinActualizar >= DIAS_SIN_ACTUALIZAR && promedio > 0) {
    return { km: kmActual + Math.round(promedio * diasSinActualizar), estimado: true, diasSinActualizar };
  }
  return { km: kmActual, estimado: false, diasSinActualizar };
}

module.exports = {
  SALTO_SOSPECHOSO_KM, DIAS_SIN_ACTUALIZAR,
  validarNuevoKm, promedioDiario, kmParaCalculo,
};
