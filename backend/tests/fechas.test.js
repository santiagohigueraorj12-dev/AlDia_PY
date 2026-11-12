// Pruebas de las utilidades de fechas (utils/fechas.js, RNF-08).
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
// Todas las reglas de AlDía dependen de estas cuentas: si una falla, fallan el desgaste y las alertas.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { ahora, hoy, sumarDias, sumarMeses, diasEntre, inicioMes, finMes, formatoColombia } = require('../src/utils/fechas');

describe('Sumar días y meses', () => {
  test('CP-FEC-01 sumar días cruza de mes y de año', () => {
    assert.equal(sumarDias('2026-01-30', 3), '2026-02-02');
    assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
  });
  test('CP-FEC-02 restar días', () => assert.equal(sumarDias('2026-03-01', -1), '2026-02-28'));
  test('CP-FEC-03 31 de enero + 1 mes = 28 de febrero (no 3 de marzo)', () => assert.equal(sumarMeses('2026-01-31', 1), '2026-02-28'));
  test('CP-FEC-04 en año bisiesto da 29 de febrero', () => assert.equal(sumarMeses('2028-01-31', 1), '2028-02-29'));
  test('CP-FEC-05 sumar 12 meses es sumar un año', () => assert.equal(sumarMeses('2026-05-15', 12), '2027-05-15'));
  test('CP-FEC-06 restar meses vuelve al año anterior', () => assert.equal(sumarMeses('2026-02-10', -3), '2025-11-10'));
});

describe('Días entre dos fechas', () => {
  test('CP-FEC-07 cuenta los días', () => assert.equal(diasEntre('2026-01-01', '2026-01-31'), 30));
  test('CP-FEC-08 es negativo si la segunda fecha es anterior', () => assert.equal(diasEntre('2026-01-10', '2026-01-05'), -5));
  test('CP-FEC-09 ignora la hora', () => assert.equal(diasEntre('2026-01-01 23:59:00', '2026-01-02 00:01:00'), 1));
});

describe('Inicio y fin de mes', () => {
  test('CP-FEC-10 inicio de mes', () => assert.equal(inicioMes('2026-10-17'), '2026-10-01'));
  test('CP-FEC-11 fin de un mes de 31 días', () => assert.equal(finMes('2026-10-17'), '2026-10-31'));
  test('CP-FEC-12 fin de febrero normal y bisiesto', () => {
    assert.equal(finMes('2026-02-10'), '2026-02-28');
    assert.equal(finMes('2028-02-10'), '2028-02-29');
  });
});

describe('Formato colombiano y fecha actual', () => {
  test('CP-FEC-13 AAAA-MM-DD se muestra como dd/mm/aaaa', () => assert.equal(formatoColombia('2026-10-05'), '05/10/2026'));
  test('CP-FEC-14 sin fecha devuelve texto vacío', () => assert.equal(formatoColombia(null), ''));
  test('CP-FEC-15 hoy() tiene el formato AAAA-MM-DD', () => assert.match(hoy(), /^\d{4}-\d{2}-\d{2}$/));
  test('CP-FEC-16 ahora() tiene el formato AAAA-MM-DD HH:MM:SS y empieza por hoy', () => {
    assert.match(ahora(), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.equal(ahora().slice(0, 10), hoy());
  });
});
