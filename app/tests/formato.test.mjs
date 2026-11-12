// Pruebas de los formatos colombianos de la app (src/utils/formato.js, RNF-08)
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
// y de los textos que le dicen al usuario qué hacer con cada parte.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { aNumero, fecha, km, nombreMes, pesos, porcentaje, queHacerParte } from '../src/utils/formato.js';

describe('Pesos, kilómetros y porcentajes', () => {
  test('CP-FMT-01 pesos con puntos de miles', () => assert.equal(pesos(1234567), '$1.234.567'));
  test('CP-FMT-02 pesos redondea los centavos', () => assert.equal(pesos(18.53), '$19'));
  test('CP-FMT-03 pesos sin valor muestra una raya', () => assert.equal(pesos(null), '—'));
  test('CP-FMT-04 kilómetros con puntos de miles', () => assert.equal(km(15400), '15.400 km'));
  test('CP-FMT-05 porcentaje con coma decimal', () => assert.equal(porcentaje(66.3), '66,3 %'));
});

describe('Leer números escritos por el usuario', () => {
  test('CP-FMT-06 "15.400" es 15400', () => assert.equal(aNumero('15.400'), 15400));
  test('CP-FMT-07 "$38.000" es 38000', () => assert.equal(aNumero('$38.000'), 38000));
  test('CP-FMT-08 vacío o con letras es 0', () => {
    assert.equal(aNumero(''), 0);
    assert.equal(aNumero('abc'), 0);
  });
});

describe('Fechas', () => {
  test('CP-FMT-09 AAAA-MM-DD se muestra como dd/mm/aaaa', () => assert.equal(fecha('2026-10-05'), '05/10/2026'));
  test('CP-FMT-10 también sirve con fecha y hora', () => assert.equal(fecha('2026-10-05 08:30:00'), '05/10/2026'));
  test('CP-FMT-11 nombre del mes con mayúscula', () => assert.equal(nombreMes('2026-10'), 'Octubre de 2026'));
});

describe('Qué hacer con una parte', () => {
  test('CP-FMT-12 vencida: cambiarla lo antes posible', () => {
    assert.match(queHacerParte({ estado: 'vencida' }), /cámbiala lo antes posible/);
  });
  test('CP-FMT-13 próxima: dice cuántos km y días faltan', () => {
    assert.equal(queHacerParte({ estado: 'proxima', kmRestantes: 1477, diasRestantes: 20 }), 'Cámbiala pronto: faltan 1.477 km o 20 días');
  });
  test('CP-FMT-14 usa "día" en singular cuando falta 1', () => {
    assert.equal(queHacerParte({ estado: 'bien', kmRestantes: null, diasRestantes: 1 }), 'Está bien: faltan 1 día');
  });
  test('CP-FMT-15 si no se sabe cuándo se cambió, pide revisarla', () => {
    assert.match(queHacerParte({ estado: 'bien' }, false), /revísala/);
  });
});
