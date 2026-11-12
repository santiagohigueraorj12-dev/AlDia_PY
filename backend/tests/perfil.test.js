// Pruebas de las reglas del perfil del usuario (domain/perfil.js, RF-03, RN-18).
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { edad, validarPerfil, completitudPerfil, estadoLicencia } = require('../src/domain/perfil');

const HOY = '2026-11-12';

describe('Edad', () => {
  test('CP-PER-01 cuenta los años cumplidos', () => assert.equal(edad('2000-01-15', HOY), 26));
  test('CP-PER-02 si aún no cumple años este año, resta uno', () => assert.equal(edad('2000-12-01', HOY), 25));
  test('CP-PER-03 el día del cumpleaños ya los cumplió', () => assert.equal(edad('2010-11-12', HOY), 16));
});

describe('RN-18: validar el perfil', () => {
  test('CP-PER-04 un perfil vacío es válido (todo es opcional)', () => assert.deepEqual(validarPerfil({}, HOY), {}));
  test('CP-PER-05 menor de 16 años no se acepta', () => {
    assert.equal(validarPerfil({ fecha_nacimiento: '2012-01-01' }, HOY).fecha_nacimiento, 'Debes tener al menos 16 años');
  });
  test('CP-PER-06 con 16 años sí se acepta', () => assert.deepEqual(validarPerfil({ fecha_nacimiento: '2010-11-12' }, HOY), {}));
  test('CP-PER-07 el número de documento necesita su tipo', () => {
    assert.equal(validarPerfil({ numero_documento: '1012345678' }, HOY).tipo_documento, 'Elige el tipo de documento');
  });
  test('CP-PER-08 la cédula solo tiene números', () => {
    assert.match(validarPerfil({ tipo_documento: 'CC', numero_documento: 'AB12345' }, HOY).numero_documento, /solo tienen números/);
  });
  test('CP-PER-09 el pasaporte puede tener letras', () => {
    assert.deepEqual(validarPerfil({ tipo_documento: 'PA', numero_documento: 'AB12345' }, HOY), {});
  });
  test('CP-PER-10 la licencia necesita categoría y vencimiento', () => {
    assert.ok(validarPerfil({ licencia_categoria: 'A2' }, HOY).licencia_vence);
    assert.ok(validarPerfil({ licencia_vence: '2030-01-01' }, HOY).licencia_categoria);
  });
  test('CP-PER-11 la licencia no puede vencer en más de 10 años', () => {
    assert.match(validarPerfil({ licencia_categoria: 'B1', licencia_vence: '2040-01-01' }, HOY).licencia_vence, /10 años/);
  });
});

describe('Perfil completo y licencia', () => {
  test('CP-PER-12 sin datos el perfil va en 0 % y dice qué falta', () => {
    const r = completitudPerfil({});
    assert.equal(r.porcentaje, 0);
    assert.equal(r.faltan.length, 6);
  });
  test('CP-PER-13 con la mitad de los datos va en 50 %', () => {
    const r = completitudPerfil({ telefono: '3001234567', ciudad: 'Bogotá', direccion: 'Cra 7 # 10-20' });
    assert.equal(r.porcentaje, 50);
    assert.deepEqual(r.faltan, ['Documento de identidad', 'Fecha de nacimiento', 'Licencia de conducción']);
  });
  test('CP-PER-14 la licencia vencida se marca como vencida', () => assert.equal(estadoLicencia('2026-11-01', HOY), 'vencido'));
  test('CP-PER-15 la licencia que vence en 20 días está por vencer', () => assert.equal(estadoLicencia('2026-12-02', HOY), 'por_vencer'));
  test('CP-PER-16 sin licencia registrada no hay estado', () => assert.equal(estadoLicencia(null, HOY), null));
});
