// Formatos colombianos (RNF-08): pesos, kilómetros y fechas dd/mm/aaaa.

/** 1234567 -> "$1.234.567" */
export function pesos(valor) {
  if (valor === null || valor === undefined) return '—';
  return `$${Math.round(Number(valor)).toLocaleString('es-CO')}`;
}

/**
 * Lee un número escrito por el usuario a la colombiana: "15.400" o "$38.000" -> 38000.
 * Si está vacío o no es un número, devuelve 0.
 */
export function aNumero(texto) {
  const limpio = String(texto ?? '').replace(/[\s.,$]/g, '');
  const numero = Number(limpio);
  return limpio === '' || Number.isNaN(numero) ? 0 : numero;
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

/** Frase corta, en palabras simples, que explica el estado de un vehículo. */
export const EXPLICACION_VEHICULO = {
  al_dia: 'Todo en orden. No tienes nada pendiente.',
  requiere_atencion: 'Tiene partes vencidas o un daño sin arreglar que debes atender pronto.',
  no_apto: 'Tiene un documento obligatorio vencido: no debería circular hasta renovarlo.',
};

/** Qué tiene que hacer el usuario con una parte, según su estado. */
export function queHacerParte(desgaste, conocido = true) {
  // RN-20: la revisaste y estaba bien; manda el mes que elegiste
  if (desgaste.revision) {
    if (desgaste.estado === 'vencida') return 'Llegó el mes que elegiste: revísala otra vez o cámbiala';
    return `La revisaste y está bien: revisarla en ${mesAnio(desgaste.revision.revisarEn)}`;
  }
  if (!conocido) return 'No sabemos cuándo se cambió: revísala en tu próximo servicio';
  if (desgaste.estado === 'vencida') return 'Ya le tocaba el cambio: cámbiala lo antes posible';
  const km = desgaste.kmRestantes !== null && desgaste.kmRestantes !== undefined ? `${Number(desgaste.kmRestantes).toLocaleString('es-CO')} km o ` : '';
  const dias = `${desgaste.diasRestantes} día${desgaste.diasRestantes === 1 ? '' : 's'}`;
  if (desgaste.estado === 'proxima') return `Cámbiala pronto: faltan ${km}${dias}`;
  return `Está bien: faltan ${km}${dias}`;
}


/** '2027-06-01' o '2027-06' -> 'junio de 2027' */
export function mesAnio(texto) {
  const [a, m] = String(texto).split('-');
  return `${MESES[Number(m) - 1]} de ${a}`;
}

/** Próximos n meses para elegir la revisión: [{ valor: '2027-01', texto: 'Enero de 2027' }, ...] */
export function proximosMeses(n = 36) {
  const hoy = new Date();
  const lista = [];
  for (let i = 1; i <= n; i += 1) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const texto = mesAnio(valor);
    lista.push({ valor, texto: texto.charAt(0).toUpperCase() + texto.slice(1) });
  }
  return lista;
}

/** RF-28: qué pasó en un daño (novedad) */
export const TIPO_NOVEDAD = { dano: 'Daño o falla', accidente: 'Accidente o golpe', otro: 'Otro' };

export const NOMBRE_DOCUMENTO = { soat: 'SOAT', rtm: 'Revisión técnico-mecánica', impuesto: 'Impuesto vehicular' };
