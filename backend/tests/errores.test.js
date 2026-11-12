// Pruebas de AppError (utils/AppError.js): el error "controlado" que el backend
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
// convierte en respuesta JSON con su código HTTP.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const AppError = require('../src/utils/AppError');

describe('AppError', () => {
  test('CP-ERR-01 por defecto es un error 400 con el mensaje dado', () => {
    const e = new AppError('Datos inválidos');
    assert.equal(e.message, 'Datos inválidos');
    assert.equal(e.status, 400);
    assert.ok(e instanceof Error);
  });
  test('CP-ERR-02 noEncontrado() es 404', () => {
    const e = AppError.noEncontrado('El vehículo no existe');
    assert.equal(e.status, 404);
    assert.equal(e.message, 'El vehículo no existe');
  });
  test('CP-ERR-03 prohibido() es 403 con mensaje por defecto', () => {
    const e = AppError.prohibido();
    assert.equal(e.status, 403);
    assert.equal(e.message, 'No tienes permiso para hacer esto');
  });
  test('CP-ERR-04 campo() indica qué campo del formulario tiene el error', () => {
    const e = AppError.campo('placa', 'Ya tienes un vehículo con esa placa');
    assert.equal(e.status, 400);
    assert.deepEqual(e.extra, { campo: 'placa', errores: { placa: 'Ya tienes un vehículo con esa placa' } });
  });
});
