// Pruebas de kilometraje y estado del vehículo (RN-03, RN-04, RN-11, RN-12, RN-14).
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validarNuevoKm, promedioDiario, kmParaCalculo } = require('../src/domain/kilometraje');
const { estadoVehiculo, costoPorKm, fechaPrimeraRtm } = require('../src/domain/vehiculo');

describe('RN-03: validar nuevo kilometraje', () => {
  const base = { kmAnterior: 10000, fechaAnterior: '2026-01-01 08:00:00' };

  test('rechaza un km menor al anterior', () => {
    const r = validarNuevoKm({ ...base, kmNuevo: 9999, fechaNueva: '2026-01-05 08:00:00' });
    assert.equal(r.valido, false);
    assert.equal(r.requiereConfirmacion, undefined);
  });
  test('acepta el mismo km o uno mayor', () => {
    assert.equal(validarNuevoKm({ ...base, kmNuevo: 10000, fechaNueva: '2026-01-05 08:00:00' }).valido, true);
    assert.equal(validarNuevoKm({ ...base, kmNuevo: 10500, fechaNueva: '2026-01-05 08:00:00' }).valido, true);
  });
  test('pide confirmar más de 1.500 km en menos de un día', () => {
    const r = validarNuevoKm({ ...base, kmNuevo: 11600, fechaNueva: '2026-01-01 20:00:00' });
    assert.equal(r.valido, false);
    assert.equal(r.requiereConfirmacion, true);
  });
  test('acepta el salto si el usuario confirma', () => {
    const r = validarNuevoKm({ ...base, kmNuevo: 11600, fechaNueva: '2026-01-01 20:00:00', confirmado: true });
    assert.equal(r.valido, true);
  });
  test('no pide confirmar si pasó más de un día', () => {
    const r = validarNuevoKm({ ...base, kmNuevo: 11600, fechaNueva: '2026-01-03 08:00:00' });
    assert.equal(r.valido, true);
  });
});

describe('RN-04: estimar kilometraje', () => {
  const lecturas = [{ km: 1000, fecha: '2026-01-01' }, { km: 2000, fecha: '2026-01-11' }];

  test('promedio diario con 2 lecturas', () => assert.equal(promedioDiario(lecturas), 100));
  test('sin suficientes lecturas no hay promedio', () => assert.equal(promedioDiario([lecturas[0]]), null));

  test('estima si pasaron 15 días o más', () => {
    const r = kmParaCalculo({ kmActual: 2000, fechaUltimaLectura: '2026-01-11', promedio: 100, hoy: '2026-01-26' });
    assert.deepEqual(r, { km: 3500, estimado: true, diasSinActualizar: 15 });
  });
  test('no estima antes de 15 días', () => {
    const r = kmParaCalculo({ kmActual: 2000, fechaUltimaLectura: '2026-01-11', promedio: 100, hoy: '2026-01-20' });
    assert.equal(r.estimado, false);
    assert.equal(r.km, 2000);
  });
});

describe('RN-11: estado del vehículo', () => {
  const hoy = '2026-06-01';
  const pastillasVencidas = { codigo: 'pastillas_freno', desgaste: { estado: 'vencida' } };
  const aceiteVencido = { codigo: 'aceite_motor', desgaste: { estado: 'vencida' } };
  const soatVigente = { tipo: 'soat', fecha_vencimiento: '2026-12-01' };
  const soatVencido = { tipo: 'soat', fecha_vencimiento: '2026-05-31' };

  test('SOAT vencido -> no apto para circular', () => {
    assert.equal(estadoVehiculo([], [soatVencido], hoy), 'no_apto');
  });
  test('pastillas vencidas -> requiere atención', () => {
    assert.equal(estadoVehiculo([pastillasVencidas], [soatVigente], hoy), 'requiere_atencion');
  });
  test('otra parte vencida no cambia el estado', () => {
    assert.equal(estadoVehiculo([aceiteVencido], [soatVigente], hoy), 'al_dia');
  });
  test('documento vencido pesa más que la parte', () => {
    assert.equal(estadoVehiculo([pastillasVencidas], [soatVencido], hoy), 'no_apto');
  });
});

describe('RN-12: costo por kilómetro', () => {
  test('costo total / km recorridos', () => assert.equal(costoPorKm(100000, 10000, 12000), 50));
  test('sin km recorridos devuelve null', () => assert.equal(costoPorKm(100000, 10000, 10000), null));
});

describe('RN-14: primera revisión técnico-mecánica', () => {
  test('carro: 5 años después de la matrícula', () => {
    assert.equal(fechaPrimeraRtm('2024-03-15', { anios_primera: 5 }), '2029-03-15');
  });
});
