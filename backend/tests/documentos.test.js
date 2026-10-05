// Pruebas de las reglas de documentos (RN-13, RN-15).
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { estadoDocumento, umbralDeAlerta, validarRenovacion } = require('../src/domain/documentos');

describe('Estado del documento', () => {
  test('vencido si ya pasó la fecha', () => assert.equal(estadoDocumento('2026-05-09', '2026-05-10'), 'vencido'));
  test('el día del vencimiento aún no está vencido', () => assert.equal(estadoDocumento('2026-05-10', '2026-05-10'), 'por_vencer'));
  test('por vencer a 30 días o menos', () => assert.equal(estadoDocumento('2026-06-09', '2026-05-10'), 'por_vencer'));
  test('vigente a más de 30 días', () => assert.equal(estadoDocumento('2026-06-10', '2026-05-10'), 'vigente'));
});

describe('RN-13: alertas 30, 7 y 1 día antes, y el mismo día', () => {
  const vence = '2026-05-31';
  test('faltan 31 días -> sin alerta', () => assert.equal(umbralDeAlerta(vence, '2026-04-30'), null));
  test('faltan 30 días -> alerta de 30', () => assert.equal(umbralDeAlerta(vence, '2026-05-01'), 30));
  test('faltan 20 días -> sigue siendo la de 30', () => assert.equal(umbralDeAlerta(vence, '2026-05-11'), 30));
  test('faltan 7 días -> alerta de 7', () => assert.equal(umbralDeAlerta(vence, '2026-05-24'), 7));
  test('falta 1 día -> alerta de 1', () => assert.equal(umbralDeAlerta(vence, '2026-05-30'), 1));
  test('el mismo día -> alerta de 0', () => assert.equal(umbralDeAlerta(vence, '2026-05-31'), 0));
  test('ya vencido -> sin alerta de aviso', () => assert.equal(umbralDeAlerta(vence, '2026-06-01'), null));
});

describe('RN-15: renovación', () => {
  test('la misma fecha no es válida', () => assert.equal(validarRenovacion('2026-05-10', '2026-05-10').valido, false));
  test('una fecha anterior no es válida', () => assert.equal(validarRenovacion('2026-05-10', '2026-01-10').valido, false));
  test('una fecha posterior es válida', () => assert.equal(validarRenovacion('2026-05-10', '2027-05-10').valido, true));
});
