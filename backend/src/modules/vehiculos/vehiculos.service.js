// =====================================================================
// LÓGICA DE VEHÍCULOS Y PARTES  (RF-04 a RF-11)
// Aquí se aplican las reglas de negocio: las fórmulas están en domain/
// y las consultas SQL en vehiculos.repository.js.
// =====================================================================
const { transaccion } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { hoy, ahora } = require('../../utils/fechas');
const { calcularDesgaste, ordenarPorUrgencia, sugerenciasServicio } = require('../../domain/desgaste');
const { validarNuevoKm, promedioDiario, kmParaCalculo } = require('../../domain/kilometraje');
const { estadoVehiculo, costoPorKm, fechaPrimeraRtm } = require('../../domain/vehiculo');
const { estadoDocumento } = require('../../domain/documentos');
const documentosRepo = require('../documentos/documentos.repository');
const alertas = require('../notificaciones/alertas.service');
const repo = require('./vehiculos.repository');

/** RN-01 / RNF-02: el vehículo debe ser del usuario; si no, respondemos 404. */
async function vehiculoDelUsuario(usuarioId, vehiculoId) {
  const vehiculo = await repo.buscarDelUsuario(vehiculoId, usuarioId);
  if (!vehiculo) throw AppError.noEncontrado('Vehículo no encontrado');
  return vehiculo;
}

/**
 * Arma la "foto completa" de un vehículo:
 *   - km para calcular (real, o estimado si lleva 15+ días sin actualizar)
 *   - partes con su desgaste, ordenadas de la más a la menos urgente
 *   - documentos con su estado
 *   - estado general y costos
 * Es la función central del módulo: la usan el listado, el detalle,
 * el panel, el calendario y la tarea diaria de alertas.
 */
async function armarVehiculo(vehiculo, fechaHoy = hoy()) {
  // Kilometraje (RN-04)
  const promedio = promedioDiario(await repo.lecturas(vehiculo.id));
  const km = kmParaCalculo({
    kmActual: vehiculo.km_actual,
    fechaUltimaLectura: vehiculo.km_actualizado_en,
    promedio,
    hoy: fechaHoy,
  });

  // Partes y desgaste (RN-06, RN-07, RN-08)
  const costosPrevios = await repo.ultimoCostoPorParte(vehiculo.id);
  const partes = ordenarPorUrgencia(
    (await repo.partesActivas(vehiculo.id)).map((parte) => ({
      ...parte,
      desgaste: calcularDesgaste(parte, km.km, { hoy: fechaHoy, promedioDiarioKm: promedio }),
      costoEstimado: costosPrevios[parte.id] ?? null,  // lo que costó la última vez
    })),
  );

  // Documentos
  const documentos = (await documentosRepo.listarDeVehiculo(vehiculo.id)).map((d) => ({
    ...d, estado: estadoDocumento(d.fecha_vencimiento, fechaHoy),
  }));

  // Costos (RF-10, RN-12)
  const mantenimiento = await repo.costoMantenimiento(vehiculo.id);

  return {
    ...vehiculo,
    kmCalculo: km.km,
    kmEstimado: km.estimado,
    diasSinActualizarKm: km.diasSinActualizar,
    promedioDiarioKm: promedio === null ? null : Math.round(promedio * 10) / 10,
    estado: estadoVehiculo(partes, documentos, fechaHoy),  // RN-11
    resumenPartes: {
      bien: partes.filter((p) => p.desgaste.estado === 'bien').length,
      proximas: partes.filter((p) => p.desgaste.estado === 'proxima').length,
      vencidas: partes.filter((p) => p.desgaste.estado === 'vencida').length,
    },
    partes,
    documentos,
    costos: {
      mantenimiento: mantenimiento.total,
      cambios: mantenimiento.cambios,
      documentos: await documentosRepo.costoDocumentos(vehiculo.id),
      porKm: costoPorKm(mantenimiento.total, vehiculo.km_inicial, vehiculo.km_actual),
    },
  };
}

async function listar(usuarioId) {
  const vehiculos = await repo.listarDelUsuario(usuarioId);
  return Promise.all(vehiculos.map((v) => armarVehiculo(v)));
}

async function detalle(usuarioId, id) {
  return armarVehiculo(await vehiculoDelUsuario(usuarioId, id));
}

/**
 * RF-04: registra el vehículo, su primera lectura de km y su plan de partes (RN-05).
 * RN-14: si la primera revisión técnico-mecánica todavía no ha llegado,
 * se registra el documento con la fecha calculada.
 */
async function crear(usuarioId, datos, fotoUrl) {
  if (await repo.placaEnUso(datos.placa)) throw new AppError('Ya existe un vehículo con esa placa', 409);  // RN-02

  const fechaHoy = hoy();
  const regla = await repo.reglaRtm(datos.tipo_vehiculo_id);

  const id = await transaccion(async (conn) => {
    const vehiculoId = await repo.crear(conn, { ...datos, usuario_id: usuarioId, foto_url: fotoUrl });
    await conn.query('INSERT INTO lecturas_km (vehiculo_id, km, fecha) VALUES (?, ?, NOW())', [vehiculoId, datos.km_inicial]);
    await repo.copiarPlanBase(conn, vehiculoId, datos.tipo_vehiculo_id, datos.km_inicial, fechaHoy);

    if (regla) {
      const primeraRtm = fechaPrimeraRtm(datos.fecha_matricula, regla);
      if (primeraRtm > fechaHoy) {
        await documentosRepo.crear(conn, { vehiculoId, tipo: 'rtm', fechaVencimiento: primeraRtm, archivoUrl: null });
      }
    }
    return vehiculoId;
  });
  return detalle(usuarioId, id);
}

async function actualizar(usuarioId, id, datos, fotoUrl) {
  await vehiculoDelUsuario(usuarioId, id);
  if (await repo.placaEnUso(datos.placa, id)) throw new AppError('Ya existe un vehículo con esa placa', 409);
  await repo.actualizar(id, { ...datos, foto_url: fotoUrl });
  return detalle(usuarioId, id);
}

async function eliminar(usuarioId, id) {
  await vehiculoDelUsuario(usuarioId, id);
  await repo.eliminar(id);
  return { mensaje: 'Vehículo eliminado' };
}

// --- Kilometraje (RF-05, RN-03) ---

async function actualizarKm(usuarioId, id, { km, confirmado }) {
  const vehiculo = await vehiculoDelUsuario(usuarioId, id);
  const validacion = validarNuevoKm({
    kmAnterior: vehiculo.km_actual,
    fechaAnterior: vehiculo.km_actualizado_en,
    kmNuevo: km,
    fechaNueva: ahora(),
    confirmado,
  });
  if (!validacion.valido) {
    // Si requiere confirmación respondemos 409: la pantalla pregunta "¿Es correcto?"
    // y, si el usuario acepta, reenvía la petición con confirmado = true.
    const status = validacion.requiereConfirmacion ? 409 : 400;
    throw new AppError(validacion.mensaje, status, { requiereConfirmacion: Boolean(validacion.requiereConfirmacion) });
  }

  await transaccion((conn) => repo.registrarLectura(conn, id, km));
  const armado = await detalle(usuarioId, id);
  await alertas.revisarVehiculo(armado);  // con el km nuevo, alguna parte pudo pasar a "próxima"
  return armado;
}

async function lecturas(usuarioId, id) {
  await vehiculoDelUsuario(usuarioId, id);
  return repo.lecturas(id);
}

// --- Plan de partes (RF-07, RN-05) ---

async function parteDelUsuario(usuarioId, parteId) {
  const parte = await repo.buscarParte(parteId);
  if (!parte) throw AppError.noEncontrado('Parte no encontrada');
  await vehiculoDelUsuario(usuarioId, parte.vehiculo_id);
  return parte;
}

async function agregarParte(usuarioId, vehiculoId, datos) {
  const vehiculo = await vehiculoDelUsuario(usuarioId, vehiculoId);
  await repo.crearParte(vehiculoId, {
    ...datos,
    // Si no se indica cuándo fue el último cambio, se toma "ahora" (0 % de desgaste)
    ultimo_cambio_km: datos.ultimo_cambio_km ?? vehiculo.km_actual,
    ultimo_cambio_fecha: datos.ultimo_cambio_fecha ?? hoy(),
  });
  return detalle(usuarioId, vehiculoId);
}

async function actualizarParte(usuarioId, parteId, datos) {
  const parte = await parteDelUsuario(usuarioId, parteId);
  await repo.actualizarParte(parteId, datos);
  return detalle(usuarioId, parte.vehiculo_id);
}

async function quitarParte(usuarioId, parteId) {
  const parte = await parteDelUsuario(usuarioId, parteId);
  await repo.desactivarParte(parteId);  // se desactiva para conservar su historial
  return detalle(usuarioId, parte.vehiculo_id);
}

async function historialParte(usuarioId, parteId) {
  const parte = await parteDelUsuario(usuarioId, parteId);
  return { parte, historial: await repo.historialParte(parteId) };
}

// --- Servicios: cambio de una o varias partes (RF-08, RN-09, RN-10) ---

async function sugerencias(usuarioId, vehiculoId, parteIds) {
  const vehiculo = await detalle(usuarioId, vehiculoId);
  return sugerenciasServicio(parteIds, vehiculo.partes);
}

async function registrarServicio(usuarioId, vehiculoId, { fecha, km, lugar, cambios }) {
  const vehiculo = await vehiculoDelUsuario(usuarioId, vehiculoId);
  const partes = await repo.partesActivas(vehiculoId);

  // --- Validaciones de RN-09 ---
  if (fecha > hoy()) throw new AppError('La fecha del servicio no puede ser futura');
  if (km > vehiculo.km_actual) {
    throw new AppError(`El kilometraje del cambio no puede ser mayor al actual del vehículo (${vehiculo.km_actual.toLocaleString('es-CO')} km). Actualiza primero el kilometraje.`);
  }
  const vistas = new Set();
  for (const cambio of cambios) {
    const parte = partes.find((p) => p.id === cambio.parte_id);
    if (!parte) throw new AppError('Una de las partes no pertenece a este vehículo');
    if (vistas.has(parte.id)) throw new AppError(`La parte "${parte.nombre}" está repetida`);
    vistas.add(parte.id);
    if (km < parte.ultimo_cambio_km) {
      throw new AppError(`"${parte.nombre}": el kilometraje no puede ser menor al del cambio anterior (${parte.ultimo_cambio_km.toLocaleString('es-CO')} km)`);
    }
    if (fecha < parte.ultimo_cambio_fecha) {
      throw new AppError(`"${parte.nombre}": la fecha no puede ser anterior a la del cambio anterior`);
    }
  }

  // --- Se guarda todo junto o nada (RNF-07) ---
  await transaccion(async (conn) => {
    const servicioId = await repo.crearServicio(conn, { vehiculoId, fecha, km, lugar });
    for (const c of cambios) {
      await repo.registrarCambio(conn, {
        servicioId, parteId: c.parte_id, costo: c.costo, marcaReferencia: c.marca_referencia, km, fecha,
      });
    }
  });
  return detalle(usuarioId, vehiculoId);
}

async function historial(usuarioId, vehiculoId) {
  await vehiculoDelUsuario(usuarioId, vehiculoId);
  return repo.historialServicios(vehiculoId);
}

module.exports = {
  armarVehiculo, listar, detalle, crear, actualizar, eliminar, actualizarKm, lecturas,
  agregarParte, actualizarParte, quitarParte, historialParte,
  sugerencias, registrarServicio, historial,
};
