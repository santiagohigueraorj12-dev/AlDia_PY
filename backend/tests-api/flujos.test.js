// =====================================================================
// PRUEBAS DE LA API (integración): flujos completos contra el servidor real
// y una base de datos de prueba propia, que se crea al empezar y se borra al terminar.
// Cubren lo que las pruebas unitarias no alcanzan: rutas, validaciones, base de
// datos, archivos adjuntos, PDF, permisos y transacciones.
//
// Ejecutar (necesita MariaDB encendido, el mismo de backend/.env):
//   npm run test:api
// Cada caso lleva su identificador (CP-API-…) de la Especificación de casos de prueba: docs/pruebas/.
// =====================================================================
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');

// La base de prueba se elige ANTES de cargar la configuración
process.env.DB_NOMBRE = `aldia_prueba_api_${process.pid}`;
process.env.NODE_ENV = 'test';

const { prepararBaseDeDatos } = require('../src/config/prepararBD');

let servidor;
let base;
const hoy = new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);  // fecha de Bogotá
const diasAtras = (n) => new Date(Date.now() - 5 * 3600 * 1000 - n * 864e5).toISOString().slice(0, 10);
const mesesAdelante = (n) => { const d = new Date(); d.setMonth(d.getMonth() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

/** Petición a la API. datos = JSON; formulario = FormData (archivos). */
async function api(ruta, { metodo = 'GET', datos, formulario, token } = {}) {
  const r = await fetch(`${base}/api${ruta}`, {
    method: metodo,
    headers: { ...(formulario ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formulario || (datos ? JSON.stringify(datos) : undefined),
  });
  const tipo = r.headers.get('content-type') || '';
  const cuerpo = tipo.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer());
  return { status: r.status, cuerpo, tipo };
}

/** Crea una cuenta y devuelve su token. */
async function cuenta(nombre, correo, password = 'Prueba2026x') {
  const r = await api('/auth/registro', { metodo: 'POST', datos: { nombre, correo, password, aceptaDatos: true } });
  assert.equal(r.status, 201, JSON.stringify(r.cuerpo));
  return (await api('/auth/login', { metodo: 'POST', datos: { correo, password } })).cuerpo.token;
}

const parte = (vehiculo, texto) => vehiculo.partes.find((p) => p.nombre.includes(texto));

before(async () => {
  await prepararBaseDeDatos();          // crea la base de prueba y corre todas las migraciones
  const app = require('../src/app');
  await new Promise((listo) => { servidor = app.listen(0, listo); });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  await new Promise((listo) => servidor.close(listo));
  const { pool } = require('../src/config/db');
  await pool.query(`DROP DATABASE IF EXISTS \`${process.env.DB_NOMBRE}\``);
  await pool.end();
});

describe('Flujos completos de la API', () => {
  let laura;
  let moto;

  test('CP-API-01 registro, inicio de sesión y perfil', async () => {
    laura = await cuenta('Laura Prueba', 'laura@prueba.co');
    const perfil = await api('/auth/perfil', { token: laura });
    assert.equal(perfil.status, 200);
    assert.equal(perfil.cuerpo.correo, 'laura@prueba.co');
    const mala = await api('/auth/login', { metodo: 'POST', datos: { correo: 'laura@prueba.co', password: 'otra-clave' } });
    assert.equal(mala.status, 401);
  });

  test('CP-API-02 sin sesión no se puede usar la API', async () => {
    assert.equal((await api('/vehiculos')).status, 401);
    assert.equal((await api('/vehiculos', { token: 'token-falso' })).status, 401);
  });

  test('CP-API-03 registrar una moto de cambios: placa según el tipo y plan con cadena (RN-02, RN-05)', async () => {
    const malaPlaca = await api('/vehiculos', { metodo: 'POST', token: laura, datos: { tipo_vehiculo_id: 1, subtipo: 'cambios', marca: 'Honda', linea: 'CB 110', modelo: 2022, placa: 'ABC123', fecha_matricula: '2022-01-10', km_inicial: 20000 } });
    assert.equal(malaPlaca.status, 400);
    assert.ok(malaPlaca.cuerpo.errores.placa);
    const r = await api('/vehiculos', { metodo: 'POST', token: laura, datos: { tipo_vehiculo_id: 1, subtipo: 'cambios', cilindraje: 110, marca: 'Honda', linea: 'CB 110', modelo: 2022, placa: 'PRU12A', fecha_matricula: '2022-01-10', km_inicial: 20000 } });
    assert.equal(r.status, 201);
    moto = r.cuerpo;
    assert.ok(parte(moto, 'Kit de arrastre') && parte(moto, 'Lubricar'));
    assert.ok(!parte(moto, 'Correa'));
    assert.equal(moto.exentoImpuesto, true);   // RN-22: 110 cc
  });

  test('CP-API-04 la placa no se puede repetir (RN-02)', async () => {
    const otra = await cuenta('Otro Usuario', 'otro@prueba.co');
    const r = await api('/vehiculos', { metodo: 'POST', token: otra, datos: { tipo_vehiculo_id: 1, subtipo: 'automatica', marca: 'Yamaha', linea: 'NMAX', modelo: 2023, placa: 'PRU12A', fecha_matricula: '2023-01-10', km_inicial: 1000 } });
    assert.equal(r.status, 409);
  });

  test('CP-API-05 un usuario no ve el vehículo de otro (RN-01)', async () => {
    const otra = (await api('/auth/login', { metodo: 'POST', datos: { correo: 'otro@prueba.co', password: 'Prueba2026x' } })).cuerpo.token;
    assert.equal((await api(`/vehiculos/${moto.id}`, { token: otra })).status, 404);
  });

  test('CP-API-06 registrar un cambio con su factura y verla en el historial (RF-08, RF-30)', async () => {
    const formulario = new FormData();
    formulario.append('fecha', hoy);
    formulario.append('km', '20000');
    formulario.append('lugar', 'Taller de prueba');
    formulario.append('cambios', JSON.stringify([{ parte_id: parte(moto, 'Aceite de motor').id, costo: '35.000', marca_referencia: 'Motul' }]));
    formulario.append('factura', new Blob(['%PDF-1.4 factura de prueba'], { type: 'application/pdf' }), 'factura.pdf');
    const r = await api(`/vehiculos/${moto.id}/servicios`, { metodo: 'POST', token: laura, formulario });
    assert.equal(r.status, 201, JSON.stringify(r.cuerpo));
    assert.equal(parte(r.cuerpo, 'Aceite de motor').desgaste.porcentaje, 0);   // RN-09
    const historial = await api(`/vehiculos/${moto.id}/servicios`, { token: laura });
    const servicio = historial.cuerpo[0];
    assert.ok(servicio.archivo_url);
    assert.equal(servicio.total, 35000);
    const archivo = await api(servicio.archivo_url.replace('/api', ''));
    assert.equal(archivo.status, 200);
    assert.ok(archivo.cuerpo.toString().startsWith('%PDF'));
  });

  test('CP-API-07 el km de un cambio en el pasado debe cuadrar con las lecturas (RN-09)', async () => {
    await api(`/vehiculos/${moto.id}/kilometraje`, { metodo: 'POST', token: laura, datos: { km: 20500 } });
    const r = await api(`/vehiculos/${moto.id}/servicios`, { metodo: 'POST', token: laura, datos: { fecha: diasAtras(400), km: 20400, cambios: [{ parte_id: parte(moto, 'Bujía').id }] } });
    assert.equal(r.status, 400);
    assert.ok(r.cuerpo.errores.km);
  });

  test('CP-API-08 el kilometraje no puede bajar y un salto grande pide confirmar (RN-03)', async () => {
    assert.equal((await api(`/vehiculos/${moto.id}/kilometraje`, { metodo: 'POST', token: laura, datos: { km: 19000 } })).status, 400);
    const salto = await api(`/vehiculos/${moto.id}/kilometraje`, { metodo: 'POST', token: laura, datos: { km: 25000 } });
    assert.equal(salto.status, 409);
    assert.equal(salto.cuerpo.requiereConfirmacion, true);
    assert.equal((await api(`/vehiculos/${moto.id}/kilometraje`, { metodo: 'POST', token: laura, datos: { km: 25000, confirmado: true } })).status, 200);
  });

  test('CP-API-09 "Revisé y está bien": la parte vuelve a verde y aparece en el calendario (RF-27)', async () => {
    const bateria = parte(moto, 'Batería');
    const mes = mesesAdelante(6);
    const r = await api(`/partes/${bateria.id}/revision`, { metodo: 'POST', token: laura, datos: { mes, nota: 'Carga bien' } });
    assert.equal(r.status, 200);
    assert.equal(parte(r.cuerpo, 'Batería').desgaste.estado, 'bien');
    const calendario = await api(`/panel/calendario?mes=${mes}`, { token: laura });
    assert.ok(calendario.cuerpo.some((e) => e.tipo === 'revision' && e.parteId === bateria.id));
  });

  test('CP-API-10 documentos: registro, tope de un año y fecha sugerida al renovar (RN-15)', async () => {
    const f = new FormData();
    f.append('tipo', 'soat'); f.append('fecha_vencimiento', diasAtras(-30)); f.append('valor', '400.000');
    const lista = (await api(`/vehiculos/${moto.id}/documentos`, { metodo: 'POST', token: laura, formulario: f })).cuerpo;
    const soat = lista.find((d) => d.tipo === 'soat');
    const lejos = new FormData();
    lejos.append('fecha_vencimiento', '2040-01-01');
    assert.equal((await api(`/documentos/${soat.id}/renovar`, { metodo: 'POST', token: laura, formulario: lejos })).status, 400);
    const detalle = await api(`/documentos/${soat.id}`, { token: laura });
    assert.ok(detalle.cuerpo.fechaSugerida > soat.fecha_vencimiento);
    const bien = new FormData();
    bien.append('fecha_vencimiento', detalle.cuerpo.fechaSugerida);
    assert.equal((await api(`/documentos/${soat.id}/renovar`, { metodo: 'POST', token: laura, formulario: bien })).status, 200);
  });

  test('CP-API-11 daños: crear, consultar, editar, arreglar y eliminar (RF-28, CRUD)', async () => {
    const crear = await api(`/vehiculos/${moto.id}/novedades`, { metodo: 'POST', token: laura, datos: { tipo: 'dano', titulo: 'Espejo', fecha: hoy, km: 25000 } });
    assert.equal(crear.status, 201);
    assert.equal(crear.cuerpo.estado, 'requiere_atencion');   // RN-21
    const id = (await api('/novedades', { token: laura })).cuerpo.find((n) => n.titulo === 'Espejo').id;
    assert.equal((await api(`/novedades/${id}`, { token: laura })).cuerpo.titulo, 'Espejo');
    const editar = await api(`/novedades/${id}`, { metodo: 'PUT', token: laura, datos: { tipo: 'accidente', titulo: 'Espejo derecho', fecha: hoy, km: 25000 } });
    assert.equal(editar.cuerpo.titulo, 'Espejo derecho');
    const arreglar = await api(`/novedades/${id}/arreglar`, { metodo: 'POST', token: laura, datos: { fecha: hoy, km: 25000, costo: '30.000' } });
    assert.equal(arreglar.cuerpo.novedadesPendientes.length, 0);
    assert.equal((await api(`/novedades/${id}`, { metodo: 'DELETE', token: laura })).status, 200);
    assert.equal((await api(`/novedades/${id}`, { token: laura })).status, 404);
  });

  test('CP-API-12 un daño que no deja usar el vehículo lo pone no apto (RN-21)', async () => {
    const r = await api(`/vehiculos/${moto.id}/novedades`, { metodo: 'POST', token: laura, datos: { tipo: 'dano', titulo: 'Frenos', fecha: hoy, km: 25000, impide_circular: true } });
    assert.equal(r.cuerpo.estado, 'no_apto');
  });

  test('CP-API-13 hoja de vida y mis datos en PDF (RF-11, RF-23)', async () => {
    const hoja = await api(`/vehiculos/${moto.id}/hoja-de-vida`, { token: laura });
    assert.equal(hoja.status, 200);
    assert.ok(hoja.cuerpo.slice(0, 4).toString() === '%PDF');
    const datos = await api('/auth/mis-datos/pdf', { token: laura });
    assert.ok(datos.cuerpo.slice(0, 4).toString() === '%PDF');
  });

  test('CP-API-14 transferir el vehículo con su historial (RF-29)', async () => {
    const comprador = await cuenta('Comprador Prueba', 'comprador@prueba.co');
    assert.equal((await api(`/vehiculos/${moto.id}/transferir`, { metodo: 'POST', token: laura, datos: { correo: 'comprador@prueba.co', password: 'mala' } })).status, 400);
    const r = await api(`/vehiculos/${moto.id}/transferir`, { metodo: 'POST', token: laura, datos: { correo: 'comprador@prueba.co', password: 'Prueba2026x' } });
    assert.equal(r.status, 200);
    assert.equal((await api(`/vehiculos/${moto.id}`, { token: laura })).status, 404);
    const suyo = await api(`/vehiculos/${moto.id}`, { token: comprador });
    assert.equal(suyo.status, 200);
    assert.equal((await api(`/vehiculos/${moto.id}/servicios`, { token: comprador })).cuerpo.length, 1);
    const avisos = await api('/notificaciones', { token: comprador });
    assert.ok(JSON.stringify(avisos.cuerpo).includes('PRU12A'));
  });

  test('CP-API-15 eliminar la cuenta borra al usuario (Ley 1581, RNF-09)', async () => {
    assert.equal((await api('/auth/cuenta', { metodo: 'DELETE', token: laura, datos: { password: 'Prueba2026x' } })).status, 200);
    assert.equal((await api('/auth/login', { metodo: 'POST', datos: { correo: 'laura@prueba.co', password: 'Prueba2026x' } })).status, 401);
  });
});
