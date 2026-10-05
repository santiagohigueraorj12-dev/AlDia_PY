// Formatos colombianos (RNF-08): pesos, kilómetros y fechas dd/mm/aaaa.

/** 1234567 -> "$1.234.567" */
export function pesos(valor) {
  if (valor === null || valor === undefined) return '—';
  return `$${Math.round(Number(valor)).toLocaleString('es-CO')}`;
}

/** 66.3 -> "66,3 %" (coma decimal, como se escribe en Colombia) */
export function porcentaje(valor) {
  return `${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
}

/** 15400 -> "15.400 km" */
export function km(valor) {
  if (valor === null || valor === undefined) return '—';
  return `${Number(valor).toLocaleString('es-CO')} km`;
}

/** '2026-10-05' -> '05/10/2026' */
export function fecha(texto) {
  if (!texto) return '—';
  const [a, m, d] = texto.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Fecha de hoy en Bogotá como 'AAAA-MM-DD' (para los valores por defecto de los formularios). */
export function hoyISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** '2026-10' -> 'Octubre de 2026' */
export function nombreMes(anioMes) {
  const [a, m] = anioMes.split('-').map(Number);
  const mes = MESES[m - 1];
  return `${mes[0].toUpperCase()}${mes.slice(1)} de ${a}`;
}

/** Textos para mostrar cada estado */
export const ESTADO_VEHICULO = {
  al_dia: { texto: 'Al día', clase: 'bien' },
  requiere_atencion: { texto: 'Requiere atención', clase: 'proxima' },
  no_apto: { texto: 'No apto para circular', clase: 'vencida' },
};

export const ESTADO_PARTE = {
  bien: { texto: 'Bien', clase: 'bien' },
  proxima: { texto: 'Próxima a cambio', clase: 'proxima' },
  vencida: { texto: 'Vencida', clase: 'vencida' },
};

export const ESTADO_DOCUMENTO = {
  vigente: { texto: 'Vigente', clase: 'bien' },
  por_vencer: { texto: 'Por vencer', clase: 'proxima' },
  vencido: { texto: 'Vencido', clase: 'vencida' },
};

export const NOMBRE_DOCUMENTO = { soat: 'SOAT', rtm: 'Revisión técnico-mecánica', impuesto: 'Impuesto vehicular' };
