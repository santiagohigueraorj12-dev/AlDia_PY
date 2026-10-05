// =====================================================================
// REGLAS DE DESGASTE DE PARTES  (RN-06, RN-07, RN-08, RN-10)
// Funciones puras: reciben datos y devuelven resultados, sin tocar la BD.
// =====================================================================
const { hoy: hoyBogota, sumarMeses, sumarDias, diasEntre } = require('../utils/fechas');

const UMBRAL_PROXIMA = 80;   // RN-08: desde 80 % la parte está "próxima a cambio"
const UMBRAL_VENCIDA = 100;  // RN-08: desde 100 % está "vencida"
const UMBRAL_SUGERIR_FILTRO = 50; // RN-10

/** RN-08: estado según el porcentaje de desgaste. */
function estadoPorDesgaste(porcentaje) {
  if (porcentaje >= UMBRAL_VENCIDA) return 'vencida';
  if (porcentaje >= UMBRAL_PROXIMA) return 'proxima';
  return 'bien';
}

/**
 * RN-07: el desgaste es el MAYOR entre:
 *   - % por km    = km recorridos desde el último cambio / intervalo en km
 *   - % por tiempo = días transcurridos desde el último cambio / intervalo en días
 * RN-06: si la parte no tiene intervalo de km, se controla solo por tiempo.
 *
 * @param {object} parte  { intervalo_km, intervalo_meses, ultimo_cambio_km, ultimo_cambio_fecha }
 * @param {number} kmActual kilometraje actual (real o estimado) del vehículo
 * @param {object} opciones { hoy: 'AAAA-MM-DD', promedioDiarioKm: number|null }
 */
function calcularDesgaste(parte, kmActual, { hoy = hoyBogota(), promedioDiarioKm = null } = {}) {
  // --- Por kilómetros ---
  const kmRecorridos = Math.max(0, kmActual - parte.ultimo_cambio_km);
  const porcentajeKm = parte.intervalo_km ? (kmRecorridos / parte.intervalo_km) * 100 : 0;
  const kmRestantes = parte.intervalo_km ? parte.intervalo_km - kmRecorridos : null;

  // --- Por tiempo ---
  // La fecha límite por tiempo es la del último cambio + el intervalo en meses.
  const fechaLimiteTiempo = sumarMeses(parte.ultimo_cambio_fecha, parte.intervalo_meses);
  const diasIntervalo = diasEntre(parte.ultimo_cambio_fecha, fechaLimiteTiempo);
  const diasTranscurridos = Math.max(0, diasEntre(parte.ultimo_cambio_fecha, hoy));
  const porcentajeTiempo = (diasTranscurridos / diasIntervalo) * 100;
  const diasRestantes = diasEntre(hoy, fechaLimiteTiempo);

  const porcentaje = Math.max(porcentajeKm, porcentajeTiempo);

  // --- Fecha estimada del próximo cambio (para el calendario, RF-15) ---
  // Lo que ocurra primero: la fecha por tiempo o la fecha en que, al ritmo
  // de uso diario, se completarían los km del intervalo.
  let fechaEstimada = fechaLimiteTiempo;
  if (kmRestantes !== null && promedioDiarioKm > 0) {
    const diasPorKm = Math.max(0, Math.ceil(kmRestantes / promedioDiarioKm));
    const fechaPorKm = sumarDias(hoy, diasPorKm);
    if (fechaPorKm < fechaEstimada) fechaEstimada = fechaPorKm;
  }
  if (porcentaje >= UMBRAL_VENCIDA && fechaEstimada > hoy) fechaEstimada = hoy;

  return {
    porcentaje: redondear(porcentaje),
    porcentajeKm: redondear(porcentajeKm),
    porcentajeTiempo: redondear(porcentajeTiempo),
    motivo: porcentajeKm >= porcentajeTiempo ? 'km' : 'tiempo',
    estado: estadoPorDesgaste(porcentaje),
    kmRestantes,
    diasRestantes,
    fechaLimiteTiempo,
    fechaEstimada,
  };
}

/** RF-06: ordena las partes de la más a la menos urgente. */
function ordenarPorUrgencia(partes) {
  return [...partes].sort((a, b) => b.desgaste.porcentaje - a.desgaste.porcentaje);
}

/**
 * RN-10: si en un servicio se cambia el aceite y el filtro de aceite tiene
 * 50 % o más de desgaste (y no se incluyó), se sugiere cambiarlo también.
 *
 * @param {number[]} idsSeleccionadas partes que el usuario va a cambiar
 * @param {object[]} partes todas las partes del vehículo, ya con .desgaste
 * @returns {object[]} sugerencias [{ parteId, nombre, porcentaje, mensaje }]
 */
function sugerenciasServicio(idsSeleccionadas, partes) {
  const seleccionadas = new Set(idsSeleccionadas.map(Number));
  const cambiaAceite = partes.some((p) => p.codigo === 'aceite_motor' && seleccionadas.has(p.id));
  if (!cambiaAceite) return [];

  const filtro = partes.find((p) => p.codigo === 'filtro_aceite');
  if (!filtro || seleccionadas.has(filtro.id)) return [];
  if (filtro.desgaste.porcentaje < UMBRAL_SUGERIR_FILTRO) return [];

  return [{
    parteId: filtro.id,
    nombre: filtro.nombre,
    porcentaje: filtro.desgaste.porcentaje,
    mensaje: `El filtro de aceite lleva ${filtro.desgaste.porcentaje.toLocaleString('es-CO')} % de desgaste. Te sugerimos cambiarlo en este mismo servicio.`,
  }];
}

function redondear(n) {
  return Math.round(n * 10) / 10;
}

module.exports = {
  UMBRAL_PROXIMA, UMBRAL_VENCIDA,
  estadoPorDesgaste, calcularDesgaste, ordenarPorUrgencia, sugerenciasServicio,
};
