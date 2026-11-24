// Pruebas de las revisiones de partes (RN-20) y de las novedades (RN-21).
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
// Ejecutar: npm test
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { calcularDesgaste, tieneRevisionVigente, validarMesRevision } = require('../src/domain/desgaste');
const { estadoVehiculo } = require('../src/domain/vehiculo');

// Batería de una moto de 2019: cada 24 meses, nunca se ha cambiado
const bateria = {
  intervalo_km: null, intervalo_meses: 24, ultimo_cambio_km: 0, ultimo_cambio_fecha: '2019-05-01',
};
// La revisó el 1 de diciembre de 2026 y eligió volver a revisarla en junio de 2027
const revisada = {
  ...bateria, ultima_revision_fecha: '2026-12-01', ultima_revision_km: 18000, revisar_en: '2027-06-01',
};

describe('RN-20: revisión de una parte ("Revisé y está bien")', () => {
  test('CP-REV-01 sin revisión, la batería de 2019 sale vencida por tiempo', () => {
    assert.equal(calcularDesgaste(bateria, 18000, { hoy: '2026-12-01' }).estado, 'vencida');
  });
  test('CP-REV-02 recién revisada vuelve a "bien" con 0 %', () => {
    const d = calcularDesgaste(revisada, 18000, { hoy: '2026-12-01' });
    assert.equal(d.estado, 'bien');
    assert.equal(d.porcentaje, 0);
    assert.equal(d.motivo, 'revision');
    assert.deepEqual(d.revision, { fecha: '2026-12-01', km: 18000, revisarEn: '2027-06-01' });
  });
  test('CP-REV-03 la fecha estimada (calendario) es la de la revisión elegida', () => {
    const d = calcularDesgaste(revisada, 18000, { hoy: '2026-12-01' });
    assert.equal(d.fechaEstimada, '2027-06-01');
    assert.equal(d.kmRestantes, null);
  });
  test('CP-REV-04 cerca de la fecha pasa a "próxima" (80 %)', () => {
    // 182 días entre revisión y fecha elegida; el 25/04/2027 van 145 días (79,7 %) y el 26/04, 146 (80,2 %)
    assert.equal(calcularDesgaste(revisada, 18000, { hoy: '2027-04-25' }).estado, 'bien');
    assert.equal(calcularDesgaste(revisada, 18000, { hoy: '2027-04-26' }).estado, 'proxima');
  });
  test('CP-REV-05 al llegar la fecha elegida queda "vencida" (toca revisarla) y se muestra hoy', () => {
    const d = calcularDesgaste(revisada, 18000, { hoy: '2027-06-10' });
    assert.equal(d.estado, 'vencida');
    assert.equal(d.fechaEstimada, '2027-06-10');
  });
  test('CP-REV-06 los km no cuentan mientras la revisión esté vigente', () => {
    const cadena = { ...revisada, intervalo_km: 10000 };
    assert.equal(calcularDesgaste(cadena, 40000, { hoy: '2026-12-02' }).estado, 'bien');
  });
  test('CP-REV-07 si la parte se cambió después de la revisión, la revisión deja de contar', () => {
    const cambiada = { ...revisada, ultimo_cambio_fecha: '2027-01-15', ultimo_cambio_km: 19000 };
    assert.equal(tieneRevisionVigente(cambiada), false);
    const d = calcularDesgaste(cambiada, 19000, { hoy: '2027-01-15' });
    assert.notEqual(d.motivo, 'revision');
    assert.equal(d.porcentaje, 0);
  });
  test('CP-REV-08 el mes elegido debe ser futuro', () => {
    assert.equal(validarMesRevision('2026-12', '2026-12-01').valido, false);
    assert.equal(validarMesRevision('2026-11', '2026-12-01').valido, false);
  });
  test('CP-REV-09 un mes válido se guarda como el día 1 de ese mes', () => {
    assert.deepEqual(validarMesRevision('2027-06', '2026-12-01'), { valido: true, fecha: '2027-06-01' });
  });
  test('CP-REV-10 máximo 36 meses adelante y formato AAAA-MM', () => {
    assert.equal(validarMesRevision('2029-12', '2026-12-01').valido, true);
    assert.equal(validarMesRevision('2030-01', '2026-12-01').valido, false);
    assert.equal(validarMesRevision('junio', '2026-12-01').valido, false);
  });
});

describe('RN-21: novedades pendientes', () => {
  const hoy = '2026-06-01';
  const soatVigente = { tipo: 'soat', fecha_vencimiento: '2026-12-01' };
  const soatVencido = { tipo: 'soat', fecha_vencimiento: '2026-05-31' };

  test('CP-NOV-01 una novedad pendiente pone el vehículo en "requiere atención"', () => {
    assert.equal(estadoVehiculo([], [soatVigente], hoy, 1), 'requiere_atencion');
  });
  test('CP-NOV-02 sin novedades pendientes sigue al día', () => {
    assert.equal(estadoVehiculo([], [soatVigente], hoy, 0), 'al_dia');
  });
  test('CP-NOV-03 un documento vencido pesa más que la novedad', () => {
    assert.equal(estadoVehiculo([], [soatVencido], hoy, 2), 'no_apto');
  });
});
