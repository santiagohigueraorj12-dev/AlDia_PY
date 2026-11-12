// =====================================================================
// REGLAS DEL PERFIL DEL USUARIO  (RF-03, RN-18)
// El registro solo pide nombre, correo y contraseña; el resto de datos
// se completa dentro de la app. Aquí están las reglas de esos datos.
// =====================================================================
const { diasEntre, sumarMeses } = require('../utils/fechas');
const { estadoDocumento } = require('./documentos');

const EDAD_MINIMA = 16;  // en Colombia se puede sacar licencia de moto desde los 16 años

/** Datos que cuentan para "tu perfil está completo al X %". */
const CAMPOS_PERFIL = [
  { campo: 'telefono', nombre: 'Teléfono' },
  { campo: 'numero_documento', nombre: 'Documento de identidad' },
  { campo: 'fecha_nacimiento', nombre: 'Fecha de nacimiento' },
  { campo: 'ciudad', nombre: 'Ciudad' },
  { campo: 'direccion', nombre: 'Dirección' },
  { campo: 'licencia_vence', nombre: 'Licencia de conducción' },
];

/** Edad cumplida en años a la fecha "hoy". */
function edad(fechaNacimiento, hoy) {
  let anios = Number(hoy.slice(0, 4)) - Number(fechaNacimiento.slice(0, 4));
  // Si todavía no ha cumplido años este año, se resta uno
  if (hoy.slice(5, 10) < fechaNacimiento.slice(5, 10)) anios -= 1;
  return anios;
}

/**
 * RN-18: valida los datos del perfil que dependen de otros datos o de la fecha.
 * Devuelve { campo: mensaje } con los errores (vacío si todo está bien).
 */
function validarPerfil(datos, hoy) {
  const errores = {};
  if (datos.fecha_nacimiento) {
    const anios = edad(datos.fecha_nacimiento, hoy);
    if (anios < EDAD_MINIMA) errores.fecha_nacimiento = `Debes tener al menos ${EDAD_MINIMA} años`;
    else if (anios > 100) errores.fecha_nacimiento = 'Revisa la fecha de nacimiento';
  }
  // El tipo y el número de documento van juntos
  if (datos.numero_documento && !datos.tipo_documento) errores.tipo_documento = 'Elige el tipo de documento';
  if (datos.tipo_documento && !datos.numero_documento) errores.numero_documento = 'Escribe el número de documento';
  // Cédula y tarjeta de identidad solo tienen números
  if (datos.numero_documento && ['CC', 'TI'].includes(datos.tipo_documento) && !/^\d+$/.test(datos.numero_documento)) {
    errores.numero_documento = 'La cédula y la tarjeta de identidad solo tienen números';
  }
  // La categoría y el vencimiento de la licencia van juntos
  if (datos.licencia_categoria && !datos.licencia_vence) errores.licencia_vence = 'Elige la fecha de vencimiento de la licencia';
  if (datos.licencia_vence && !datos.licencia_categoria) errores.licencia_categoria = 'Elige la categoría de la licencia';
  // Una licencia se expide por máximo 10 años
  if (datos.licencia_vence && diasEntre(sumarMeses(hoy, 120), datos.licencia_vence) > 0) {
    errores.licencia_vence = 'La licencia no puede vencer en más de 10 años';
  }
  return errores;
}

/** Qué tan completo está el perfil: { porcentaje, faltan: ['Teléfono', ...] }. */
function completitudPerfil(usuario) {
  const faltan = CAMPOS_PERFIL.filter((c) => !usuario[c.campo]).map((c) => c.nombre);
  const porcentaje = Math.round(((CAMPOS_PERFIL.length - faltan.length) / CAMPOS_PERFIL.length) * 100);
  return { porcentaje, faltan };
}

/** Estado de la licencia, igual que un documento: vigente, por_vencer (30 días) o vencido. */
function estadoLicencia(fechaVencimiento, hoy) {
  return fechaVencimiento ? estadoDocumento(fechaVencimiento, hoy) : null;
}

module.exports = { EDAD_MINIMA, CAMPOS_PERFIL, edad, validarPerfil, completitudPerfil, estadoLicencia };
