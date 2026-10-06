// Pruebas de las reglas de desgaste (RN-06, RN-07, RN-08, RN-10).
// Ejecutar: npm test
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  calcularDesgaste, estadoPorDesgaste, ordenarPorUrgencia, sugerenciasServicio,
  validarUltimoCambio, ultimoCambioDesconocido,
} = require('../src/domain/desgaste');

const aceiteMoto = {
  intervalo_km: 3000, intervalo_meses: 3, ultimo_cambio_km: 10000, ultimo_cambio_fecha: '2026-01-01',
};

describe('RN-08: estado según el desgaste', () => {
  test('menos de 80 % está bien', () => assert.equal(estadoPorDesgaste(79.9), 'bien'));
  test('80 % es próxima a cambio', () => assert.equal(estadoPorDesgaste(80), 'proxima'));
  test('99 % sigue siendo próxima', () => assert.equal(estadoPorDesgaste(99.9), 'proxima'));
  test('100 % o más está vencida', () => assert.equal(estadoPorDesgaste(100), 'vencida'));
});

describe('RN-07: desgaste = el mayor entre km y tiempo', () => {
  test('gana el porcentaje por km', () => {
    // 2.700 km de 3.000 = 90 %; 10 días de ~90 = 11 %
    const d = calcularDesgaste(aceiteMoto, 12700, { hoy: '2026-01-11' });
    assert.equal(d.porcentaje, 90);
    assert.equal(d.motivo, 'km');
    assert.equal(d.estado, 'proxima');
    assert.equal(d.kmRestantes, 300);
  });

  test('gana el porcentaje por tiempo', () => {
    // solo 300 km (10 %), pero ya pasaron los 3 meses completos
    const d = calcularDesgaste(aceiteMoto, 10300, { hoy: '2026-04-01' });
    assert.equal(d.porcentaje, 100);
    assert.equal(d.motivo, 'tiempo');
    assert.equal(d.estado, 'vencida');
  });

  test('recién cambiada tiene 0 %', () => {
    const d = calcularDesgaste(aceiteMoto, 10000, { hoy: '2026-01-01' });
    assert.equal(d.porcentaje, 0);
    assert.equal(d.estado, 'bien');
  });
});

describe('RN-06: partes sin intervalo de km', () => {
  test('se controlan solo por tiempo', () => {
    const bateria = { intervalo_km: null, intervalo_meses: 24, ultimo_cambio_km: 0, ultimo_cambio_fecha: '2025-01-01' };
    const d = calcularDesgaste(bateria, 999999, { hoy: '2026-01-01' });
    assert.equal(d.porcentajeKm, 0);
    assert.equal(d.kmRestantes, null);
    assert.ok(d.porcentaje > 49 && d.porcentaje < 51); // ~1 año de 2
  });
});

describe('Fecha estimada del próximo cambio', () => {
  test('usa el ritmo de uso si llega antes que la fecha por tiempo', () => {
    // faltan 300 km a 100 km/día -> 3 días
    const d = calcularDesgaste(aceiteMoto, 12700, { hoy: '2026-01-11', promedioDiarioKm: 100 });
    assert.equal(d.fechaEstimada, '2026-01-14');
  });
  test('sin promedio diario usa la fecha por tiempo', () => {
    const d = calcularDesgaste(aceiteMoto, 12700, { hoy: '2026-01-11' });
    assert.equal(d.fechaEstimada, '2026-04-01');
  });
});

describe('RF-06: orden por urgencia', () => {
  test('ordena de mayor a menor desgaste', () => {
    const partes = [{ id: 1, desgaste: { porcentaje: 20 } }, { id: 2, desgaste: { porcentaje: 95 } }, { id: 3, desgaste: { porcentaje: 50 } }];
    assert.deepEqual(ordenarPorUrgencia(partes).map((p) => p.id), [2, 3, 1]);
  });
});

describe('RN-10: sugerir filtro de aceite', () => {
  const partes = [
    { id: 1, codigo: 'aceite_motor', nombre: 'Aceite', desgaste: { porcentaje: 95 } },
    { id: 2, codigo: 'filtro_aceite', nombre: 'Filtro de aceite', desgaste: { porcentaje: 60 } },
  ];
  test('sugiere el filtro si tiene 50 % o más', () => {
    const s = sugerenciasServicio([1], partes);
    assert.equal(s.length, 1);
    assert.equal(s[0].parteId, 2);
  });
  test('no sugiere si el filtro ya está incluido', () => {
    assert.equal(sugerenciasServicio([1, 2], partes).length, 0);
  });
  test('no sugiere si el filtro tiene menos de 50 %', () => {
    const otras = [partes[0], { ...partes[1], desgaste: { porcentaje: 49 } }];
    assert.equal(sugerenciasServicio([1], otras).length, 0);
  });
  test('si no se sabe cuándo se cambió el filtro, el mensaje lo dice', () => {
    const otras = [partes[0], { ...partes[1], ultimo_cambio_conocido: 0, desgaste: { porcentaje: 900 } }];
    assert.match(sugerenciasServicio([1], otras)[0].mensaje, /No sabemos/);
  });
  test('no sugiere si no se cambia el aceite', () => {
    assert.equal(sugerenciasServicio([], partes).length, 0);
  });
});

describe('RN-16: último cambio de un vehículo con uso', () => {
  const base = { kmActual: 30000, fechaMatricula: '2020-03-01', hoy: '2026-10-06' };

  test('un dato válido se acepta', () => {
    assert.equal(validarUltimoCambio({ ...base, km: 28500, fecha: '2026-08-10' }).valido, true);
  });
  test('el km no puede pasar del actual', () => {
    assert.equal(validarUltimoCambio({ ...base, km: 30001, fecha: '2026-08-10' }).valido, false);
  });
  test('la fecha no puede ser futura', () => {
    assert.equal(validarUltimoCambio({ ...base, km: 1000, fecha: '2026-10-07' }).valido, false);
  });
  test('la fecha no puede ser anterior a la matrícula', () => {
    assert.equal(validarUltimoCambio({ ...base, km: 0, fecha: '2020-02-28' }).valido, false);
  });
  test('si no se sabe, se cuenta desde la matrícula', () => {
    assert.deepEqual(ultimoCambioDesconocido('2020-03-01'), { km: 0, fecha: '2020-03-01' });
  });
  test('una moto usada con pastillas "desconocidas" sale vencida', () => {
    const { km, fecha } = ultimoCambioDesconocido('2020-03-01');
    const pastillas = { intervalo_km: 10000, intervalo_meses: 12, ultimo_cambio_km: km, ultimo_cambio_fecha: fecha };
    assert.equal(calcularDesgaste(pastillas, 30000, { hoy: '2026-10-06' }).estado, 'vencida');
  });
  test('una moto nueva con partes "desconocidas" sale casi en 0 %', () => {
    const { km, fecha } = ultimoCambioDesconocido('2026-10-01');
    const aceite = { intervalo_km: 3000, intervalo_meses: 3, ultimo_cambio_km: km, ultimo_cambio_fecha: fecha };
    assert.equal(calcularDesgaste(aceite, 50, { hoy: '2026-10-06' }).estado, 'bien');
  });
});
