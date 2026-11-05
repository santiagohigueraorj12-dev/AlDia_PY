// Pruebas de las validaciones de formularios (utils/validaciones.js).
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { z, texto, entero, fecha, correo, aEntero } = require('../src/utils/validaciones');

/** Devuelve el mensaje de error de un valor, o null si es válido. */
const error = (esquema, valor) => {
  const r = esquema.safeParse(valor);
  return r.success ? null : r.error.issues[0].message;
};

describe('Números escritos a la colombiana', () => {
  test('"15.400" es 15400', () => assert.equal(aEntero('15.400'), 15400));
  test('"$38.000" es 38000', () => assert.equal(aEntero('$38.000'), 38000));
  test('un número se deja igual', () => assert.equal(aEntero(120), 120));
  test('vacío es "no enviado"', () => assert.equal(aEntero(''), undefined));
});

describe('entero()', () => {
  const km = entero('el kilometraje');
  test('vacío pide escribirlo', () => assert.equal(error(km, ''), 'Escribe el kilometraje'));
  test('letras dicen que debe ser un número', () => assert.equal(error(km, 'abc'), 'El kilometraje debe ser un número'));
  test('negativo no se acepta', () => assert.equal(error(km, '-5'), 'El kilometraje no puede ser menor a 0'));
  test('"15.400" es válido', () => assert.equal(km.parse('15.400'), 15400));

  const anio = entero('el año', { min: 1950, max: 2027 });
  test('respeta el máximo', () => assert.equal(error(anio, '2030'), 'El año no puede ser mayor a 2.027'));

  const intervalo = entero('el intervalo en km', { min: 1, vacioEsNulo: true });
  test('vacioEsNulo convierte vacío en null', () => assert.equal(intervalo.parse(''), null));
  test('cero no se acepta (RN-05)', () => assert.equal(error(intervalo, '0'), 'El intervalo en km debe ser mayor a cero'));
});

describe('texto(), fecha() y correo()', () => {
  test('texto vacío o con solo espacios pide escribirlo', () => {
    assert.equal(error(texto('la marca'), '   '), 'Escribe la marca');
  });
  test('fecha vacía pide elegirla', () => assert.equal(error(fecha('la fecha'), ''), 'Elige la fecha'));
  test('fecha futura no se acepta si es noFutura', () => {
    assert.equal(error(fecha('la fecha de matrícula', { noFutura: true }), '2999-01-01'), 'La fecha de matrícula no puede ser futura');
  });
  test('correo se guarda en minúsculas', () => assert.equal(correo().parse(' Ana@Correo.CO '), 'ana@correo.co'));
  test('correo mal escrito', () => assert.match(error(correo(), 'ana@'), /no es válido/));
});

describe('Un formulario devuelve todos sus errores', () => {
  test('cada campo con su mensaje', () => {
    const esquema = z.object({ marca: texto('la marca'), km: entero('el kilometraje') });
    const r = esquema.safeParse({ marca: '', km: '' });
    assert.deepEqual(r.error.issues.map((i) => i.path[0]), ['marca', 'km']);
  });
});
