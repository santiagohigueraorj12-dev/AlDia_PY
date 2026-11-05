// Pruebas del asistente de preguntas (RF-21, RN-17).
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { PREGUNTAS, responder } = require('../src/domain/asistente');

const HOY = '2026-11-05';

/** Vehículo de ejemplo, con la misma forma que devuelve armarVehiculo(). */
function moto(cambios = {}) {
  return {
    placa: 'ABC12D', tipo: 'Moto', estado: 'requiere_atencion',
    km_actual: 15400, km_actualizado_en: '2026-11-01 08:00:00', kmCalculo: 15400, kmEstimado: false,
    diasSinActualizarKm: 4, promedioDiarioKm: 18.9,
    partes: [
      { nombre: 'Pastillas de freno', codigo: 'pastillas_freno', ultimo_cambio_conocido: 1, costoEstimado: 60000,
        desgaste: { porcentaje: 101, estado: 'vencida', kmRestantes: -100, diasRestantes: 120, fechaEstimada: HOY } },
      { nombre: 'Aceite de motor', codigo: 'aceite_motor', ultimo_cambio_conocido: 1, costoEstimado: 38000,
        desgaste: { porcentaje: 86, estado: 'proxima', kmRestantes: 420, diasRestantes: 20, fechaEstimada: '2026-11-20' } },
      { nombre: 'Llantas', codigo: 'llantas', ultimo_cambio_conocido: 0, costoEstimado: null,
        desgaste: { porcentaje: 37, estado: 'bien', kmRestantes: 9500, diasRestantes: 500, fechaEstimada: '2028-01-01' } },
    ],
    documentos: [
      { tipo: 'soat', fecha_vencimiento: '2026-11-25', estado: 'por_vencer' },
      { tipo: 'rtm', fecha_vencimiento: '2027-06-01', estado: 'vigente' },
    ],
    costos: { mantenimiento: 63000, cambios: 2, documentos: 420000, porKm: 18.53 },
    ...cambios,
  };
}

describe('Lista de preguntas', () => {
  test('son 7 y todas tienen respuesta', () => {
    assert.equal(PREGUNTAS.length, 7);
    for (const p of PREGUNTAS) assert.ok(responder(p.id, moto(), HOY), `sin respuesta: ${p.id}`);
  });
  test('una pregunta que no existe devuelve null', () => assert.equal(responder('inventada', moto(), HOY), null));
});

describe('¿Qué le toca cambiar?', () => {
  test('lista solo las partes próximas o vencidas, en orden de urgencia', () => {
    const r = responder('que-cambiar', moto(), HOY);
    assert.equal(r.items.length, 2);
    assert.match(r.items[0].texto, /^Pastillas de freno: .*vencida/);
    assert.equal(r.items[1].estado, 'proxima');
    assert.match(r.items[1].texto, /faltan 420 km o 20 días/);
  });
  test('si todo está bien, lo dice', () => {
    const v = moto();
    v.partes = v.partes.slice(2);  // solo llantas (bien)
    assert.match(responder('que-cambiar', v, HOY).texto, /Todas las partes .* están bien/);
  });
});

describe('¿Puedo circular?', () => {
  test('con frenos vencidos: "Sí, pero con cuidado"', () => {
    assert.match(responder('puedo-circular', moto(), HOY).texto, /^Sí, pero con cuidado/);
  });
  test('con SOAT vencido: "No"', () => {
    const v = moto({ estado: 'no_apto', documentos: [{ tipo: 'soat', fecha_vencimiento: '2026-11-01', estado: 'vencido' }] });
    const r = responder('puedo-circular', v, HOY);
    assert.match(r.texto, /^No\./);
    assert.ok(r.items.some((i) => i.estado === 'vencida' && /SOAT: venció hace 4 días/.test(i.texto)));
  });
  test('avisa si la técnico-mecánica no está registrada', () => {
    const v = moto({ documentos: [{ tipo: 'soat', fecha_vencimiento: '2027-01-01', estado: 'vigente' }] });
    assert.ok(responder('puedo-circular', v, HOY).items.some((i) => /técnico-mecánica: no lo has registrado/.test(i.texto)));
  });
});

describe('Documentos, mes, gastos y kilometraje', () => {
  test('documentos: días que faltan y los que no están registrados', () => {
    const r = responder('documentos', moto(), HOY);
    assert.match(r.items[0].texto, /SOAT: vence el 25\/11\/2026 \(faltan 20 días\)/);
    assert.match(r.items[2].texto, /Impuesto vehicular: sin registrar/);
  });
  test('este mes: incluye lo vencido, los cambios estimados y los vencimientos, ordenados por fecha', () => {
    const textos = responder('este-mes', moto(), HOY).items.map((i) => i.texto);
    assert.deepEqual(textos.map((t) => t.split(':')[0]), ['Pastillas de freno', 'Aceite de motor', 'SOAT']);
  });
  test('gastado: suma mantenimiento y documentos', () => {
    assert.match(responder('gastado', moto(), HOY).texto, /\$483\.000/);
  });
  test('próximo mantenimiento: suma el último costo de las partes urgentes', () => {
    assert.match(responder('proximo-mantenimiento', moto(), HOY).texto, /\$98\.000/);
  });
  test('kilometraje: avisa si el km está estimado', () => {
    const r = responder('kilometraje', moto({ kmEstimado: true, kmCalculo: 15900, diasSinActualizarKm: 20 }), HOY);
    assert.ok(r.items.some((i) => /ya debe ir por unos 15\.900 km/.test(i.texto)));
  });
});
