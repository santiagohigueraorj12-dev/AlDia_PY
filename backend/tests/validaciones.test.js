// Pruebas de las validaciones de formularios (utils/validaciones.js).
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { z, texto, textoOpcional, entero, fecha, correo, passwordNueva, passwordActual, aEntero } = require('../src/utils/validaciones');

/** Devuelve el mensaje de error de un valor, o null si es válido. */
const error = (esquema, valor) => {
  const r = esquema.safeParse(valor);
  return r.success ? null : r.error.issues[0].message;
};

describe('Números escritos a la colombiana', () => {
  test('CP-VAL-01 "15.400" es 15400', () => assert.equal(aEntero('15.400'), 15400));
  test('CP-VAL-02 "$38.000" es 38000', () => assert.equal(aEntero('$38.000'), 38000));
  test('CP-VAL-03 un número se deja igual', () => assert.equal(aEntero(120), 120));
  test('CP-VAL-04 vacío es "no enviado"', () => assert.equal(aEntero(''), undefined));
});

describe('entero()', () => {
  const km = entero('el kilometraje');
  test('CP-VAL-05 vacío pide escribirlo', () => assert.equal(error(km, ''), 'Escribe el kilometraje'));
  test('CP-VAL-06 letras dicen que debe ser un número', () => assert.equal(error(km, 'abc'), 'El kilometraje debe ser un número'));
  test('CP-VAL-07 negativo no se acepta', () => assert.equal(error(km, '-5'), 'El kilometraje no puede ser menor a 0'));
  test('CP-VAL-08 "15.400" es válido', () => assert.equal(km.parse('15.400'), 15400));

  const anio = entero('el año', { min: 1950, max: 2027 });
  test('CP-VAL-09 respeta el máximo', () => assert.equal(error(anio, '2030'), 'El año no puede ser mayor a 2.027'));

  const intervalo = entero('el intervalo en km', { min: 1, vacioEsNulo: true });
  test('CP-VAL-10 vacioEsNulo convierte vacío en null', () => assert.equal(intervalo.parse(''), null));
  test('CP-VAL-11 cero no se acepta (RN-05)', () => assert.equal(error(intervalo, '0'), 'El intervalo en km debe ser mayor a cero'));
});

describe('texto(), fecha() y correo()', () => {
  test('CP-VAL-12 texto vacío o con solo espacios pide escribirlo', () => {
    assert.equal(error(texto('la marca'), '   '), 'Escribe la marca');
  });
  test('CP-VAL-13 fecha vacía pide elegirla', () => assert.equal(error(fecha('la fecha'), ''), 'Elige la fecha'));
  test('CP-VAL-14 fecha futura no se acepta si es noFutura', () => {
    assert.equal(error(fecha('la fecha de matrícula', { noFutura: true }), '2999-01-01'), 'La fecha de matrícula no puede ser futura');
  });
  test('CP-VAL-15 correo se guarda en minúsculas', () => assert.equal(correo().parse(' Ana@Correo.CO '), 'ana@correo.co'));
  test('CP-VAL-16 correo mal escrito', () => assert.match(error(correo(), 'ana@'), /no es válido/));
});

describe('Un formulario devuelve todos sus errores', () => {
  test('CP-VAL-17 cada campo con su mensaje', () => {
    const esquema = z.object({ marca: texto('la marca'), km: entero('el kilometraje') });
    const r = esquema.safeParse({ marca: '', km: '' });
    assert.deepEqual(r.error.issues.map((i) => i.path[0]), ['marca', 'km']);
  });
});

describe('Campos opcionales y contraseñas', () => {
  test('CP-VAL-18 texto opcional vacío queda en null', () => assert.equal(textoOpcional('el lugar').parse('  '), null));
  test('CP-VAL-19 texto opcional respeta el máximo', () => {
    assert.equal(error(textoOpcional('el lugar', { max: 5 }), 'Taller grande'), 'El lugar no puede tener más de 5 caracteres');
  });
  test('CP-VAL-20 número opcional vacío queda sin valor', () => assert.equal(entero('el costo', { opcional: true }).parse(''), undefined));
  test('CP-VAL-21 número con decimales no se acepta', () => assert.equal(error(entero('el kilometraje'), 15400.5), 'El kilometraje debe ser un número entero'));
  test('CP-VAL-22 fecha con formato incorrecto', () => assert.equal(error(fecha('la fecha'), '05/10/2026'), 'La fecha no es válida'));
  test('CP-VAL-23 contraseña nueva de menos de 8 caracteres', () => {
    assert.equal(error(passwordNueva(), 'abc123'), 'La contraseña debe tener al menos 8 caracteres');
  });
  test('CP-VAL-24 contraseña nueva de 8 caracteres es válida', () => assert.equal(passwordNueva().parse('Clave123'), 'Clave123'));
  test('CP-VAL-25 contraseña actual vacía pide escribirla', () => assert.equal(error(passwordActual(), ''), 'Escribe tu contraseña'));
});
