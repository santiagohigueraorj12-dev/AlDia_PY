// =====================================================================
// Piezas de validación reutilizables (con Zod), todas con mensajes en español.
// Las usan los archivos *.routes.js para describir qué datos espera cada formulario.
//
//   texto('la marca')                    -> obligatorio, sin espacios sobrantes
//   entero('el kilometraje', { min: 0 }) -> acepta "15400", "15.400" o "$15.400"
//   fecha('la fecha de matrícula', { noFutura: true })
// =====================================================================
const { z } = require('zod');
const { hoy } = require('./fechas');

/** "el kilometraje" -> "El kilometraje" */
const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Un campo vacío ("" o solo espacios) se trata como "no enviado". */
const vacioANada = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

/**
 * Convierte lo que escribe el usuario en un número entero.
 * En Colombia se escribe "15.400" o "$38.000": se quitan puntos, comas, espacios y "$".
 * Si no es un número, se deja el texto tal cual para que Zod diga "debe ser un número".
 */
function aEntero(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return v;
  const limpio = String(v).replace(/[\s.,$]/g, '');
  if (limpio === '') return undefined;
  const numero = Number(limpio);
  return Number.isNaN(numero) ? v : numero;
}

/** Texto obligatorio. */
function texto(campo, { min = 1, max = 200 } = {}) {
  return z.preprocess(
    vacioANada,
    z.string({ required_error: `Escribe ${campo}`, invalid_type_error: `Escribe ${campo}` })
      .trim()
      .min(min, min === 1 ? `Escribe ${campo}` : `${mayuscula(campo)} debe tener al menos ${min} caracteres`)
      .max(max, `${mayuscula(campo)} no puede tener más de ${max} caracteres`),
  );
}

/** Texto opcional: si viene vacío queda como null. */
function textoOpcional(campo, { max = 200 } = {}) {
  return z.preprocess(
    (v) => (vacioANada(v) === undefined ? null : v),
    z.string().trim().max(max, `${mayuscula(campo)} no puede tener más de ${max} caracteres`).nullable(),
  );
}

/**
 * Número entero.
 *  - opcional: si viene vacío, queda undefined.
 *  - vacioEsNulo: si viene vacío, queda null (ej.: intervalo en km de una parte "solo por tiempo").
 */
function entero(campo, { min = 0, max, opcional = false, vacioEsNulo = false } = {}) {
  let numero = z.number({
    required_error: `Escribe ${campo}`,
    invalid_type_error: `${mayuscula(campo)} debe ser un número`,
  })
    .int(`${mayuscula(campo)} debe ser un número entero`)
    .min(min, min === 1 ? `${mayuscula(campo)} debe ser mayor a cero` : `${mayuscula(campo)} no puede ser menor a ${min.toLocaleString('es-CO')}`);
  if (max !== undefined) numero = numero.max(max, `${mayuscula(campo)} no puede ser mayor a ${max.toLocaleString('es-CO')}`);

  if (vacioEsNulo) return z.preprocess((v) => (aEntero(v) === undefined ? null : aEntero(v)), numero.nullable());
  if (opcional) return z.preprocess(aEntero, numero.optional());
  return z.preprocess(aEntero, numero);
}

/** Fecha 'AAAA-MM-DD' (así la envían los selectores de fecha). */
function fecha(campo, { noFutura = false, opcional = false } = {}) {
  let esquema = z.string({ required_error: `Elige ${campo}`, invalid_type_error: `Elige ${campo}` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${mayuscula(campo)} no es válida`)
    .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00`).getTime()), `${mayuscula(campo)} no es válida`);
  if (noFutura) esquema = esquema.refine((v) => v <= hoy(), `${mayuscula(campo)} no puede ser futura`);
  return z.preprocess(vacioANada, opcional ? esquema.optional() : esquema);
}

/** Correo electrónico (se guarda en minúsculas). */
function correo() {
  return z.preprocess(
    vacioANada,
    z.string({ required_error: 'Escribe tu correo' }).trim().toLowerCase().email('El correo no es válido (ej.: nombre@correo.com)'),
  );
}

/** Contraseña nueva: mínimo 8 caracteres. */
function passwordNueva() {
  return z.preprocess(
    vacioANada,
    z.string({ required_error: 'Escribe una contraseña' }).min(8, 'La contraseña debe tener al menos 8 caracteres'),
  );
}

/** Contraseña ya existente (solo se exige que no esté vacía). */
function passwordActual(mensaje = 'Escribe tu contraseña') {
  return z.preprocess(vacioANada, z.string({ required_error: mensaje }).min(1, mensaje));
}

module.exports = { z, texto, textoOpcional, entero, fecha, correo, passwordNueva, passwordActual, aEntero };
