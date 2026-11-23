// =====================================================================
// SALUD DEL VEHÍCULO  (RN-19)  y  RESUMEN DE GASTOS  (RF-26)
// Funciones puras: no consultan la base de datos, así se prueban fácil.
// =====================================================================
const { sumarMeses } = require('../utils/fechas');

const PUNTOS_PARTE = { bien: 100, proxima: 50, vencida: 0 };
const PUNTOS_DOCUMENTO = { vigente: 100, por_vencer: 50, vencido: 0 };
const PESO_PARTES = 0.7;     // las partes pesan 70 % y los documentos 30 %

const promedio = (valores) => valores.reduce((s, v) => s + v, 0) / valores.length;

/**
 * RN-19: qué tan "al día" está un vehículo, de 0 a 100 %.
 *  - Cada parte suma 100 si está bien, 50 si está próxima y 0 si está vencida.
 *  - Cada documento suma 100 si está vigente, 50 si está por vencer y 0 si venció.
 *  - Partes 70 % y documentos 30 % (si no hay documentos, solo cuentan las partes).
 *  - El anillo nunca contradice el estado del vehículo (RN-11):
 *      "no apto" (SOAT o técnico-mecánica vencidos) → máximo 49 % (rojo);
 *      "requiere atención" (frenos o llantas vencidos) → máximo 79 % (amarillo).
 * Nivel: "bien" (80 % o más), "proxima" (50 a 79 %), "vencida" (menos de 50 %).
 *
 * @param {object[]} partes con .desgaste.estado
 * @param {object[]} documentos con .estado
 * @param {string} estadoVehiculo resultado de RN-11
 */
function calcularSalud(partes, documentos, estadoVehiculo) {
  const notaPartes = partes.length ? promedio(partes.map((p) => PUNTOS_PARTE[p.desgaste.estado] ?? 0)) : 100;
  const notaDocumentos = documentos.length ? promedio(documentos.map((d) => PUNTOS_DOCUMENTO[d.estado] ?? 0)) : null;

  let porcentaje = notaDocumentos === null
    ? notaPartes
    : notaPartes * PESO_PARTES + notaDocumentos * (1 - PESO_PARTES);
  porcentaje = Math.round(porcentaje);
  if (estadoVehiculo === 'no_apto') porcentaje = Math.min(porcentaje, 49);
  if (estadoVehiculo === 'requiere_atencion') porcentaje = Math.min(porcentaje, 79);

  const nivel = porcentaje >= 80 ? 'bien' : porcentaje >= 50 ? 'proxima' : 'vencida';
  return { porcentaje, nivel };
}

/** Salud de todos los vehículos del usuario: el promedio de cada uno. */
function saludGeneral(saludes) {
  if (saludes.length === 0) return null;
  const porcentaje = Math.round(promedio(saludes.map((s) => s.porcentaje)));
  return { porcentaje, nivel: porcentaje >= 80 ? 'bien' : porcentaje >= 50 ? 'proxima' : 'vencida' };
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const NOMBRE_DOCUMENTO = { soat: 'SOAT', rtm: 'Revisión técnico-mecánica', impuesto: 'Impuesto vehicular' };

/** Primer día del mes de hace 11 meses: con el mes actual son 12 meses. */
function inicioUltimos12Meses(hoy) {
  return `${sumarMeses(hoy, -11).slice(0, 7)}-01`;
}

/**
 * RF-26: gastos de los últimos 12 meses, para la gráfica de Inicio.
 * @param {object[]} filasPartes  [{ mes: 'AAAA-MM', nombre, total }]  cambios de partes
 * @param {object[]} filasDocs    [{ mes: 'AAAA-MM', tipo, total }]    pagos de documentos
 * @param {string} hoy 'AAAA-MM-DD'
 * @returns {{ meses, porCategoria, total, mesMayor }}
 *   meses: 12 elementos (del más antiguo al actual), aunque no haya gastos
 *   porCategoria: de la que más gastó a la que menos (máximo 5; el resto va en "Otros")
 */
function resumenGastos(filasPartes, filasDocs, hoy) {
  const meses = [];
  for (let i = 11; i >= 0; i -= 1) {
    const clave = sumarMeses(hoy, -i).slice(0, 7);
    meses.push({ mes: clave, etiqueta: MESES[Number(clave.slice(5, 7)) - 1], partes: 0, documentos: 0, total: 0 });
  }
  const porMes = Object.fromEntries(meses.map((m) => [m.mes, m]));
  const categorias = {};

  for (const f of filasPartes) {
    const total = Number(f.total) || 0;
    if (porMes[f.mes]) { porMes[f.mes].partes += total; porMes[f.mes].total += total; }
    categorias[f.nombre] = (categorias[f.nombre] || 0) + total;
  }
  for (const f of filasDocs) {
    const total = Number(f.total) || 0;
    if (porMes[f.mes]) { porMes[f.mes].documentos += total; porMes[f.mes].total += total; }
    const nombre = NOMBRE_DOCUMENTO[f.tipo] || f.tipo;
    categorias[nombre] = (categorias[nombre] || 0) + total;
  }

  const ordenadas = Object.entries(categorias)
    .filter(([, total]) => total > 0)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);
  const porCategoria = ordenadas.slice(0, 5);
  const resto = ordenadas.slice(5).reduce((s, c) => s + c.total, 0);
  if (resto > 0) porCategoria.push({ nombre: 'Otros', total: resto });

  const total = meses.reduce((s, m) => s + m.total, 0);
  const mesMayor = total > 0 ? meses.reduce((a, b) => (b.total > a.total ? b : a)) : null;
  return { meses, porCategoria, total, mesMayor };
}

module.exports = { calcularSalud, saludGeneral, resumenGastos, inicioUltimos12Meses };
