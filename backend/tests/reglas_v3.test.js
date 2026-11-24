// Pruebas de las reglas agregadas tras la revisión de la lógica de negocio (24/11/2026):
// placa por tipo (RN-02), exención del impuesto (RN-22), gravedad del daño (RN-21), kit crítico (RN-11),
// excepción de la técnico-mecánica (RN-14), tope y fecha sugerida de vencimientos (RN-15),
// km en una fecha pasada (RN-09) y promedio de los últimos 90 días (RN-04).
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validarPlaca, exentoDeImpuesto, estadoVehiculo, fechaPrimeraRtm } = require('../src/domain/vehiculo');
const { validarVencimiento, validarRenovacion, fechaSugerida, resumenDocumentacion } = require('../src/domain/documentos');
const { validarKmEnFecha, promedioDiario } = require('../src/domain/kilometraje');

describe('RN-02: placa según el tipo de vehículo', () => {
  test('CP-REG-01 moto: 3 letras, 2 números y 1 letra', () => {
    assert.equal(validarPlaca('ABC12D', 'Moto').valido, true);
    assert.equal(validarPlaca('ABC123', 'Moto').valido, false);
  });
  test('CP-REG-02 carro: 3 letras y 3 números', () => {
    assert.equal(validarPlaca('ABC123', 2).valido, true);
    assert.equal(validarPlaca('ABC12D', 2).valido, false);
  });
});

describe('RN-22: motos de hasta 125 cc no pagan impuesto vehicular', () => {
  test('CP-REG-03 moto de 125 cc o menos está exenta; de 126 cc o más, no', () => {
    assert.equal(exentoDeImpuesto({ tipo: 'Moto', cilindraje: 125 }), true);
    assert.equal(exentoDeImpuesto({ tipo: 'Moto', cilindraje: 155 }), false);
  });
  test('CP-REG-04 un carro nunca está exento y sin cilindraje no se asume exención', () => {
    assert.equal(exentoDeImpuesto({ tipo: 'Carro', cilindraje: 100 }), false);
    assert.equal(exentoDeImpuesto({ tipo: 'Moto', cilindraje: null }), false);
  });
  test('CP-REG-05 al moto exenta no le falta el impuesto en el resumen de documentación', () => {
    const moto = { tipo: 'Moto', cilindraje: 110, documentos: [{ tipo: 'soat', estado: 'vigente' }, { tipo: 'rtm', estado: 'vigente' }] };
    assert.equal(resumenDocumentacion([moto]).faltantes, 0);
    assert.equal(resumenDocumentacion([{ ...moto, cilindraje: 200 }]).faltantes, 1);
  });
});

describe('RN-21 y RN-11: estado del vehículo con daños y kit de arrastre', () => {
  const hoy = '2026-06-01';
  const soat = { tipo: 'soat', fecha_vencimiento: '2026-12-01' };
  test('CP-REG-06 un daño pendiente que no deja usar el vehículo lo pone no apto', () => {
    assert.equal(estadoVehiculo([], [soat], hoy, [{ impide_circular: 1 }]), 'no_apto');
    assert.equal(estadoVehiculo([], [soat], hoy, [{ impide_circular: 0 }]), 'requiere_atencion');
  });
  test('CP-REG-07 el kit de arrastre vencido es parte de seguridad', () => {
    assert.equal(estadoVehiculo([{ codigo: 'kit_arrastre', desgaste: { estado: 'vencida' } }], [soat], hoy), 'requiere_atencion');
  });
});

describe('RN-14: excepción de la primera técnico-mecánica', () => {
  test('CP-REG-08 carro matriculado entre 20/05/2017 y 19/05/2018: a los 6 años', () => {
    assert.equal(fechaPrimeraRtm('2017-08-10', { anios_primera: 5 }, 2), '2023-08-10');
    assert.equal(fechaPrimeraRtm('2019-08-10', { anios_primera: 5 }, 2), '2024-08-10');
    assert.equal(fechaPrimeraRtm('2017-08-10', { anios_primera: 2 }, 1), '2019-08-10');  // a las motos no aplica
  });
});

describe('RN-15: tope y fecha sugerida del vencimiento', () => {
  test('CP-REG-09 el SOAT no puede vencer a más de 13 meses de hoy', () => {
    assert.equal(validarVencimiento('soat', '2027-12-24', '2026-11-24').valido, true);
    assert.equal(validarVencimiento('soat', '2028-01-01', '2026-11-24').valido, false);
    assert.equal(validarRenovacion('2026-12-01', '2035-01-01', 'soat', '2026-11-24').valido, false);
  });
  test('CP-REG-16 si se renueva antes de que venza, el tope cuenta desde el vencimiento anterior', () => {
    assert.equal(validarRenovacion('2027-04-24', '2028-04-24', 'soat', '2026-11-24').valido, true);
    assert.equal(validarRenovacion('2027-04-24', '2028-06-01', 'soat', '2026-11-24').valido, false);
  });
  test('CP-REG-10 el impuesto admite hasta 18 meses', () => {
    assert.equal(validarVencimiento('impuesto', '2028-05-24', '2026-11-24').valido, true);
    assert.equal(validarVencimiento('impuesto', '2028-06-01', '2026-11-24').valido, false);
  });
  test('CP-REG-11 al renovar se sugiere un año después del vencimiento (o de hoy si venció hace mucho)', () => {
    assert.equal(fechaSugerida('2026-12-14', '2026-11-24'), '2027-12-14');
    assert.equal(fechaSugerida('2025-01-10', '2026-11-24'), '2027-11-24');
  });
});

describe('RN-09: el km de una fecha pasada cuadra con las lecturas', () => {
  const lecturas = [{ km: 10000, fecha: '2026-01-01 08:00:00' }, { km: 13000, fecha: '2026-03-01 08:00:00' }];
  test('CP-REG-12 entre dos lecturas, el km debe estar entre ellas', () => {
    assert.equal(validarKmEnFecha(lecturas, '2026-02-01', 11500).valido, true);
    assert.equal(validarKmEnFecha(lecturas, '2026-02-01', 9000).valido, false);
    assert.equal(validarKmEnFecha(lecturas, '2026-02-01', 14000).valido, false);
  });
  test('CP-REG-13 el mismo día de una lectura no se compara con ella', () => {
    assert.equal(validarKmEnFecha(lecturas, '2026-03-01', 13500).valido, true);
  });
});

describe('RN-04: promedio diario con el uso reciente', () => {
  test('CP-REG-14 usa solo los últimos 90 días', () => {
    const lecturas = [
      { km: 0, fecha: '2025-01-01 08:00:00' },      // estuvo guardada casi un año
      { km: 1000, fecha: '2026-08-01 08:00:00' },
      { km: 4000, fecha: '2026-10-01 08:00:00' },   // 61 días después: 3.000 km
    ];
    assert.equal(Math.round(promedioDiario(lecturas)), 49);
  });
  test('CP-REG-15 con menos de dos lecturas en 90 días usa las dos más recientes', () => {
    const lecturas = [{ km: 0, fecha: '2026-01-01 08:00:00' }, { km: 3000, fecha: '2026-10-28 08:00:00' }];
    assert.equal(Math.round(promedioDiario(lecturas)), 10);
  });
});
