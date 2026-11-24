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

const DIAS_PROMEDIO = 90;  // RN-04: el promedio usa el uso reciente, no toda la historia

/**
 * Promedio de km recorridos por día, calculado con las lecturas reales de los
 * últimos 90 días (antes de la última lectura). Así, si el vehículo estuvo guardado
 * hace meses, ese tiempo no baja el promedio. Si en esos 90 días hay menos de dos
 * lecturas, se usan las dos más recientes.
 * Necesita al menos 2 lecturas separadas por 1 día o más; si no, devuelve null.
 *
 * @param {{ km: number, fecha: string }[]} lecturas
 */
function promedioDiario(lecturas) {
  if (!lecturas || lecturas.length < 2) return null;
  const ordenadas = [...lecturas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultima = ordenadas[ordenadas.length - 1];
  const recientes = ordenadas.filter((l) => diasEntre(l.fecha, ultima.fecha) <= DIAS_PROMEDIO);
  const primera = recientes.length >= 2 ? recientes[0] : ordenadas[ordenadas.length - 2];
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

/**
 * RN-09: el km de algo que pasó en una fecha (un cambio, un daño, un arreglo) debe
 * cuadrar con las lecturas del odómetro: no puede ser menor que una lectura de antes
 * de ese día ni mayor que una lectura de después.
 *
 * @param {{ km: number, fecha: string }[]} lecturas  (fecha 'AAAA-MM-DD HH:MM:SS')
 * @param {string} fecha 'AAAA-MM-DD'
 * @param {number} km
 */
function validarKmEnFecha(lecturas, fecha, km) {
  const dia = String(fecha).slice(0, 10);
  const antes = (lecturas || []).filter((l) => String(l.fecha).slice(0, 10) < dia);
  const despues = (lecturas || []).filter((l) => String(l.fecha).slice(0, 10) > dia);
  const minimo = antes.length ? Math.max(...antes.map((l) => l.km)) : null;
  const maximo = despues.length ? Math.min(...despues.map((l) => l.km)) : null;
  const formato = (f) => String(f).slice(0, 10).split('-').reverse().join('/');
  if (minimo !== null && km < minimo) {
    const l = antes.find((x) => x.km === minimo);
    return { valido: false, mensaje: `El ${formato(l.fecha)} el vehículo ya tenía ${minimo.toLocaleString('es-CO')} km: el kilometraje no puede ser menor.` };
  }
  if (maximo !== null && km > maximo) {
    const l = despues.find((x) => x.km === maximo);
    return { valido: false, mensaje: `El ${formato(l.fecha)} el vehículo tenía ${maximo.toLocaleString('es-CO')} km: en esa fecha no podía tener más.` };
  }
  return { valido: true };
}

module.exports = {
  SALTO_SOSPECHOSO_KM, DIAS_SIN_ACTUALIZAR, DIAS_PROMEDIO,
  validarNuevoKm, promedioDiario, kmParaCalculo, validarKmEnFecha,
};
