import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { armarDocumentacion } from '../src/utils/documentacion.js';

const vehiculo = (documentos) => ({
  id: 1,
  placa: 'ABC12D',
  documentos,
});

describe('Documentación por vehículo', () => {
  test('CP-DOC-MOD-01 documentos no registrados se marcan faltantes y críticos', () => {
    const [resultado] = armarDocumentacion([vehiculo([])]);

    assert.equal(resultado.faltantes, 3);
    assert.equal(resultado.vencidos, 0);
    assert.equal(resultado.estadoDocumentacion.clase, 'vencida');
    assert.ok(resultado.documentos.every((doc) => doc.estado === 'faltante'));
  });

  test('CP-DOC-MOD-02 prioriza vencidos y faltantes sobre documentos próximos y vigentes', () => {
    const [resultado] = armarDocumentacion([vehiculo([
      { tipo: 'soat', estado: 'vigente', fecha_vencimiento: '2027-12-01' },
      { tipo: 'rtm', estado: 'por_vencer', fecha_vencimiento: '2026-12-01' },
      { tipo: 'impuesto', estado: 'vencido', fecha_vencimiento: '2026-01-01' },
    ])]);

    assert.equal(resultado.vencidos, 1);
    assert.equal(resultado.faltantes, 0);
    assert.deepEqual(resultado.documentos.map((doc) => doc.estado), ['vencido', 'por_vencer', 'vigente']);
    assert.equal(resultado.estadoDocumentacion.clase, 'vencida');
  });

  test('CP-DOC-MOD-03 resume los documentos próximos o al día', () => {
    const [proximo] = armarDocumentacion([vehiculo([
      { tipo: 'soat', estado: 'por_vencer', fecha_vencimiento: '2026-12-01' },
      { tipo: 'rtm', estado: 'vigente', fecha_vencimiento: '2027-12-01' },
      { tipo: 'impuesto', estado: 'vigente', fecha_vencimiento: '2027-06-01' },
    ])]);
    const [alDia] = armarDocumentacion([vehiculo([
      { tipo: 'soat', estado: 'vigente', fecha_vencimiento: '2027-12-01' },
      { tipo: 'rtm', estado: 'vigente', fecha_vencimiento: '2027-12-01' },
      { tipo: 'impuesto', estado: 'vigente', fecha_vencimiento: '2027-06-01' },
    ])]);

    assert.equal(proximo.porVencer, 1);
    assert.equal(proximo.estadoDocumentacion.clase, 'proxima');
    assert.equal(alDia.estadoDocumentacion.clase, 'bien');
  });

  test('CP-DOC-MOD-04 a una moto de hasta 125 cc no le falta el impuesto (RN-22)', () => {
    const [moto] = armarDocumentacion([{ id: 1, placa: 'XYZ12A', exentoImpuesto: true, documentos: [{ tipo: 'soat', estado: 'vigente', fecha_vencimiento: '2027-01-01' }, { tipo: 'rtm', estado: 'vigente', fecha_vencimiento: '2027-01-01' }] }]);
    assert.equal(moto.faltantes, 0);
    assert.ok(!moto.documentos.some((d) => d.tipo === 'impuesto'));
  });
});
