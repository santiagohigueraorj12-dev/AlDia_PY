const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { resumenDocumentacion } = require('../src/domain/documentos');

describe('Resumen de documentación del panel', () => {
  test('CP-PAN-DOC-01 cuenta documentos faltantes, vencidos y próximos', () => {
    const vehiculos = [
      { documentos: [{ tipo: 'soat', estado: 'vencido' }, { tipo: 'rtm', estado: 'por_vencer' }] },
      { documentos: [{ tipo: 'soat', estado: 'vigente' }, { tipo: 'rtm', estado: 'vigente' }, { tipo: 'impuesto', estado: 'vencido' }] },
    ];
    assert.deepEqual(resumenDocumentacion(vehiculos), {
      faltantes: 1,
      vencidos: 2,
      porVencer: 1,
    });
  });

  test('CP-PAN-DOC-02 sin vehículos no genera alertas', () => {
    assert.deepEqual(resumenDocumentacion([]), { faltantes: 0, vencidos: 0, porVencer: 0 });
  });
});
