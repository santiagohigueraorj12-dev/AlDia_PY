// Pruebas de la lista "Lo que debes hacer" del Inicio (src/utils/tareas.js, RF-14).
// Cada caso lleva su identificador (CP-…) de la Especificación de casos de prueba: docs/pruebas/.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { armarTareas } from '../src/utils/tareas.js';

/** Fecha de hoy + n días como 'AAAA-MM-DD' (las tareas calculan los días que faltan desde hoy). */
function enDias(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Panel de ejemplo, con la misma forma que devuelve GET /api/panel. */
function panel(cambios = {}) {
  return {
    vehiculos: [
      { id: 1, placa: 'ABC12D', kmEstimado: false },
      { id: 2, placa: 'JKL345', kmEstimado: true },
    ],
    partesUrgentes: [
      { id: 10, nombre: 'Aceite de motor', vehiculoId: 1, placa: 'ABC12D', conocido: true, desgaste: { estado: 'proxima', diasRestantes: 5 } },
      { id: 11, nombre: 'Pastillas de freno', vehiculoId: 1, placa: 'ABC12D', conocido: true, desgaste: { estado: 'vencida', diasRestantes: 0 } },
    ],
    documentosPorVencer: [
      { id: 20, tipo: 'soat', nombre: 'SOAT', vehiculoId: 2, placa: 'JKL345', estado: 'vencido', fecha_vencimiento: enDias(-3) },
      { id: 21, tipo: 'rtm', nombre: 'Revisión técnico-mecánica', vehiculoId: 1, placa: 'ABC12D', estado: 'por_vencer', fecha_vencimiento: enDias(10) },
    ],
    ...cambios,
  };
}

describe('Lista "Lo que debes hacer"', () => {
  test('CP-TAR-01 sin nada pendiente, la lista está vacía', () => {
    assert.deepEqual(armarTareas(panel({ partesUrgentes: [], documentosPorVencer: [], vehiculos: [] })), []);
  });

  test('CP-TAR-02 ordena de lo más urgente a lo menos urgente', () => {
    const claves = armarTareas(panel()).map((t) => t.clave);
    // documento vencido > parte vencida > km sin actualizar > documento por vencer > parte próxima
    assert.deepEqual(claves, ['doc-20', 'parte-11', 'km-2', 'doc-21', 'parte-10']);
  });

  test('CP-TAR-03 un documento vencido avisa que no se debe circular y lleva a renovarlo', () => {
    const t = armarTareas(panel()).find((x) => x.clave === 'doc-20');
    assert.equal(t.tono, 'vencida');
    assert.match(t.detalle, /no debes circular/);
    assert.equal(t.ruta, '/vehiculo/2/documento?tipo=soat');
  });

  test('CP-TAR-04 un documento por vencer dice en cuántos días vence', () => {
    const t = armarTareas(panel()).find((x) => x.clave === 'doc-21');
    assert.match(t.detalle, /en 10 días/);
  });

  test('CP-TAR-05 "Ya lo cambié" abre Registrar cambio con la parte marcada', () => {
    const t = armarTareas(panel()).find((x) => x.clave === 'parte-11');
    assert.equal(t.boton, 'Ya lo cambié');
    assert.equal(t.ruta, '/vehiculo/1/servicio?parteId=11');
  });

  test('CP-TAR-06 pide actualizar el km solo de los vehículos que lo tienen estimado', () => {
    const km = armarTareas(panel()).filter((t) => t.clave.startsWith('km-'));
    assert.equal(km.length, 1);
    assert.equal(km[0].ruta, '/vehiculo/2/kilometraje');
  });

  test('CP-TAR-07 avisa de la licencia vencida como lo más urgente', () => {
    const tareas = armarTareas(panel(), { estadoLicencia: 'vencido', licencia_vence: enDias(-1) });
    assert.equal(tareas[0].clave, 'licencia');
    assert.equal(tareas[0].ruta, '/perfil');
  });

  test('CP-TAR-08 sin licencia registrada no hay tarea de licencia', () => {
    assert.ok(!armarTareas(panel(), { estadoLicencia: null }).some((t) => t.clave === 'licencia'));
  });
});
