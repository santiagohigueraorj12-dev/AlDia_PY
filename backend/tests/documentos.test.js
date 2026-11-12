// Pruebas de las reglas de documentos (RN-13, RN-15).
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { estadoDocumento, umbralDeAlerta, validarRenovacion } = require('../src/domain/documentos');

describe('Estado del documento', () => {
  test('CP-DOC-01 vencido si ya pasó la fecha', () => assert.equal(estadoDocumento('2026-05-09', '2026-05-10'), 'vencido'));
  test('CP-DOC-02 el día del vencimiento aún no está vencido', () => assert.equal(estadoDocumento('2026-05-10', '2026-05-10'), 'por_vencer'));
  test('CP-DOC-03 por vencer a 30 días o menos', () => assert.equal(estadoDocumento('2026-06-09', '2026-05-10'), 'por_vencer'));
  test('CP-DOC-04 vigente a más de 30 días', () => assert.equal(estadoDocumento('2026-06-10', '2026-05-10'), 'vigente'));
});

describe('RN-13: alertas 30, 7 y 1 día antes, y el mismo día', () => {
  const vence = '2026-05-31';
  test('CP-DOC-05 faltan 31 días -> sin alerta', () => assert.equal(umbralDeAlerta(vence, '2026-04-30'), null));
  test('CP-DOC-06 faltan 30 días -> alerta de 30', () => assert.equal(umbralDeAlerta(vence, '2026-05-01'), 30));
  test('CP-DOC-07 faltan 20 días -> sigue siendo la de 30', () => assert.equal(umbralDeAlerta(vence, '2026-05-11'), 30));
  test('CP-DOC-08 faltan 7 días -> alerta de 7', () => assert.equal(umbralDeAlerta(vence, '2026-05-24'), 7));
  test('CP-DOC-09 falta 1 día -> alerta de 1', () => assert.equal(umbralDeAlerta(vence, '2026-05-30'), 1));
  test('CP-DOC-10 el mismo día -> alerta de 0', () => assert.equal(umbralDeAlerta(vence, '2026-05-31'), 0));
  test('CP-DOC-11 ya vencido -> sin alerta de aviso', () => assert.equal(umbralDeAlerta(vence, '2026-06-01'), null));
});

describe('RN-15: renovación', () => {
  test('CP-DOC-12 la misma fecha no es válida', () => assert.equal(validarRenovacion('2026-05-10', '2026-05-10').valido, false));
  test('CP-DOC-13 una fecha anterior no es válida', () => assert.equal(validarRenovacion('2026-05-10', '2026-01-10').valido, false));
  test('CP-DOC-14 una fecha posterior es válida', () => assert.equal(validarRenovacion('2026-05-10', '2027-05-10').valido, true));
});
