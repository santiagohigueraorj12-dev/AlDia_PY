// Utilidades de fechas. Trabajamos las fechas como texto 'AAAA-MM-DD'
// y siempre en la zona horaria de Bogotá (RNF-08), así evitamos errores
// de un día de diferencia por la hora UTC.

const ZONA = 'America/Bogota';

/** Fecha de hoy en Bogotá, como 'AAAA-MM-DD'. */
function hoy() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/** Fecha y hora actual en Bogotá, como 'AAAA-MM-DD HH:MM:SS'. */
function ahora() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const v = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${v.year}-${v.month}-${v.day} ${v.hour}:${v.minute}:${v.second}`;
}

/** Convierte 'AAAA-MM-DD' en un Date (a medianoche UTC) para poder hacer cuentas. */
function aDate(texto) {
  const [a, m, d] = texto.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

/** Convierte un Date en 'AAAA-MM-DD'. */
function aTexto(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function sumarDias(texto, dias) {
  const f = aDate(texto);
  f.setUTCDate(f.getUTCDate() + dias);
  return aTexto(f);
}

/**
 * Suma meses respetando el fin de mes:
 * 31/01 + 1 mes = 28/02 (o 29 en año bisiesto), no 03/03.
 */
function sumarMeses(texto, meses) {
  const [a, m, d] = texto.slice(0, 10).split('-').map(Number);
  const total = (m - 1) + meses;
  const anio = a + Math.floor(total / 12);
  const mes = ((total % 12) + 12) % 12;
  const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return aTexto(new Date(Date.UTC(anio, mes, Math.min(d, ultimoDia))));
}

/** Días que hay desde "desde" hasta "hasta" (negativo si "hasta" es anterior). */
function diasEntre(desde, hasta) {
  return Math.round((aDate(hasta) - aDate(desde)) / 86400000);
}

/** Primer día del mes de una fecha: '2026-10-17' -> '2026-10-01'. */
function inicioMes(texto) {
  return `${texto.slice(0, 7)}-01`;
}

/** Último día del mes de una fecha: '2026-02-10' -> '2026-02-28'. */
function finMes(texto) {
  return sumarDias(sumarMeses(inicioMes(texto), 1), -1);
}

/** 'AAAA-MM-DD' -> 'dd/mm/aaaa' (formato colombiano, RNF-08). */
function formatoColombia(texto) {
  if (!texto) return '';
  const [a, m, d] = texto.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

module.exports = {
  hoy, ahora, aDate, aTexto, sumarDias, sumarMeses, diasEntre, inicioMes, finMes, formatoColombia,
};
