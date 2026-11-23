const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { calcularSalud, saludGeneral, resumenGastos, inicioUltimos12Meses } = require('../src/domain/salud');

const parte = (estado) => ({ desgaste: { estado } });
const doc = (estado) => ({ estado });

describe('Salud del vehículo (RN-19)', () => {
  test('CP-SAL-01 todo bien y documentos vigentes = 100 %', () => {
    assert.deepEqual(calcularSalud([parte('bien'), parte('bien')], [doc('vigente')], 'al_dia'), { porcentaje: 100, nivel: 'bien' });
  });

  test('CP-SAL-02 partes pesan 70 % y documentos 30 %', () => {
    // partes: (100 + 0) / 2 = 50 -> 35 ; documentos: 100 -> 30 ; total 65
    assert.deepEqual(calcularSalud([parte('bien'), parte('vencida')], [doc('vigente')], 'requiere_atencion'), { porcentaje: 65, nivel: 'proxima' });
  });

  test('CP-SAL-03 sin documentos solo cuentan las partes', () => {
    assert.equal(calcularSalud([parte('bien'), parte('proxima')], [], 'al_dia').porcentaje, 75);
  });

  test('CP-SAL-04 un vehículo no apto nunca pasa de 49 %', () => {
    const salud = calcularSalud([parte('bien'), parte('bien'), parte('bien')], [doc('vencido'), doc('vigente')], 'no_apto');
    assert.deepEqual(salud, { porcentaje: 49, nivel: 'vencida' });
  });

  test('CP-SAL-04b un vehículo que requiere atención nunca pasa de 79 %', () => {
    const salud = calcularSalud([parte('bien'), parte('bien'), parte('bien'), parte('vencida')], [doc('vigente')], 'requiere_atencion');
    assert.deepEqual(salud, { porcentaje: 79, nivel: 'proxima' });
  });

  test('CP-SAL-05 sin partes ni documentos = 100 %', () => {
    assert.equal(calcularSalud([], [], 'al_dia').porcentaje, 100);
  });

  test('CP-SAL-06 la salud general es el promedio de los vehículos', () => {
    assert.deepEqual(saludGeneral([{ porcentaje: 100 }, { porcentaje: 51 }]), { porcentaje: 76, nivel: 'proxima' });
    assert.equal(saludGeneral([]), null);
  });
});

describe('Resumen de gastos de 12 meses (RF-26)', () => {
  test('CP-GAS-01 arma 12 meses aunque no haya gastos', () => {
    const r = resumenGastos([], [], '2026-11-23');
    assert.equal(r.meses.length, 12);
    assert.equal(r.meses[0].mes, '2025-12');
    assert.equal(r.meses[11].mes, '2026-11');
    assert.equal(r.meses[11].etiqueta, 'nov');
    assert.equal(r.total, 0);
    assert.equal(r.mesMayor, null);
  });

  test('CP-GAS-02 suma partes y documentos por mes y por categoría', () => {
    const r = resumenGastos(
      [{ mes: '2026-10', nombre: 'Aceite', total: '40000' }, { mes: '2026-11', nombre: 'Aceite', total: 45000 }],
      [{ mes: '2026-11', tipo: 'soat', total: 420000 }],
      '2026-11-23',
    );
    assert.equal(r.total, 505000);
    assert.deepEqual(r.meses[11], { mes: '2026-11', etiqueta: 'nov', partes: 45000, documentos: 420000, total: 465000 });
    assert.deepEqual(r.porCategoria, [{ nombre: 'SOAT', total: 420000 }, { nombre: 'Aceite', total: 85000 }]);
    assert.equal(r.mesMayor.mes, '2026-11');
  });

  test('CP-GAS-03 más de 5 categorías: el resto se agrupa en "Otros"', () => {
    const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((nombre, i) => ({ mes: '2026-11', nombre, total: 100 - i }));
    const r = resumenGastos(filas, [], '2026-11-23');
    assert.equal(r.porCategoria.length, 6);
    assert.deepEqual(r.porCategoria[5], { nombre: 'Otros', total: 95 + 94 });
  });

  test('CP-GAS-04 el periodo empieza el primer día de hace 11 meses', () => {
    assert.equal(inicioUltimos12Meses('2026-11-23'), '2025-12-01');
    assert.equal(inicioUltimos12Meses('2026-03-31'), '2025-04-01');
  });
});
