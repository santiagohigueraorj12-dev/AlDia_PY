// =====================================================================
// LÓGICA DE VEHÍCULOS Y PARTES  (RF-04 a RF-11, RF-27, RF-28)
// Aquí se aplican las reglas de negocio: las fórmulas están en domain/
// y las consultas SQL en vehiculos.repository.js.
// =====================================================================
const { transaccion } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { hoy, ahora } = require('../../utils/fechas');
const {
  calcularDesgaste, ordenarPorUrgencia, sugerenciasServicio, validarUltimoCambio, ultimoCambioDesconocido, ultimoCambioNunca,
  validarMesRevision,
} = require('../../domain/desgaste');
const { validarNuevoKm, promedioDiario, kmParaCalculo, validarKmEnFecha } = require('../../domain/kilometraje');
const { estadoVehiculo, costoPorKm, fechaPrimeraRtm, validarPlaca, exentoDeImpuesto } = require('../../domain/vehiculo');
const { estadoDocumento } = require('../../domain/documentos');
const { calcularSalud } = require('../../domain/salud');
const documentosRepo = require('../documentos/documentos.repository');
const alertas = require('../notificaciones/alertas.service');
const repo = require('./vehiculos.repository');
const bcrypt = require('bcryptjs');
const authRepo = require('../auth/auth.repository');
const notificaciones = require('../notificaciones/notificaciones.service');

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

  // Novedades sin arreglar (RN-21): ponen el vehículo en "requiere atención"
  const pendientes = await repo.novedadesPendientes(vehiculo.id);

  // Costos (RF-10, RN-12)
  const mantenimiento = await repo.costoMantenimiento(vehiculo.id);
  const estado = estadoVehiculo(partes, documentos, fechaHoy, pendientes);  // RN-11, RN-21

  return {
    ...vehiculo,
    kmCalculo: km.km,
    kmEstimado: km.estimado,
    diasSinActualizarKm: km.diasSinActualizar,
    promedioDiarioKm: promedio === null ? null : Math.round(promedio * 10) / 10,
    estado,
    salud: calcularSalud(partes, documentos, estado),  // RN-19: anillo de salud
    resumenPartes: {
      bien: partes.filter((p) => p.desgaste.estado === 'bien').length,
      proximas: partes.filter((p) => p.desgaste.estado === 'proxima').length,
      vencidas: partes.filter((p) => p.desgaste.estado === 'vencida').length,
    },
    partes,
    documentos,
    novedadesPendientes: pendientes,
    exentoImpuesto: exentoDeImpuesto(vehiculo),  // RN-22: moto de hasta 125 cc
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
 * RN-16: las partes arrancan contando desde la matrícula; después la app pide
 * al usuario indicar cuándo cambió cada una (ver fijarUltimosCambios).
 * RN-14: si la primera revisión técnico-mecánica todavía no ha llegado,
 * se registra el documento con la fecha calculada.
 */
/** RN-02 y RN-05: la placa según el tipo y, en las motos, el tipo de moto (define su plan de partes). */
function validarDatosPorTipo(datos, tipoVehiculoId) {
  const placa = validarPlaca(datos.placa, tipoVehiculoId);
  if (!placa.valido) throw AppError.campo('placa', placa.mensaje);
  const esMoto = Number(tipoVehiculoId) === 1;
  if (esMoto && !datos.subtipo) throw AppError.campo('subtipo', 'Elige si la moto es de cambios o automática');
  if (!esMoto) datos.subtipo = null;
}

async function crear(usuarioId, datos, fotoUrl) {
  validarDatosPorTipo(datos, datos.tipo_vehiculo_id);
  if (await repo.placaEnUso(datos.placa)) throw AppError.campo('placa', 'Ya hay un vehículo registrado con esa placa', 409);  // RN-02

  const fechaHoy = hoy();
  const regla = await repo.reglaRtm(datos.tipo_vehiculo_id);

  const id = await transaccion(async (conn) => {
    const vehiculoId = await repo.crear(conn, { ...datos, usuario_id: usuarioId, foto_url: fotoUrl });
    await conn.query('INSERT INTO lecturas_km (vehiculo_id, km, fecha) VALUES (?, ?, NOW())', [vehiculoId, datos.km_inicial]);
    const desconocido = ultimoCambioDesconocido(datos.fecha_matricula);
    await repo.copiarPlanBase(conn, vehiculoId, datos.tipo_vehiculo_id, desconocido.km, desconocido.fecha, datos.subtipo);

    if (regla) {
      const primeraRtm = fechaPrimeraRtm(datos.fecha_matricula, regla, datos.tipo_vehiculo_id);
      if (primeraRtm > fechaHoy) {
        await documentosRepo.crear(conn, { vehiculoId, tipo: 'rtm', fechaVencimiento: primeraRtm, archivoUrl: null });
      }
    }
    return vehiculoId;
  });
  return detalle(usuarioId, id);
}

async function actualizar(usuarioId, id, datos, fotoUrl) {
  const vehiculo = await vehiculoDelUsuario(usuarioId, id);
  validarDatosPorTipo(datos, vehiculo.tipo_vehiculo_id);
  if (await repo.placaEnUso(datos.placa, id)) throw AppError.campo('placa', 'Ya hay un vehículo registrado con esa placa', 409);
  await transaccion(async (conn) => {
    await repo.actualizar(conn, id, { ...datos, foto_url: fotoUrl });
    // RN-05: si cambió el tipo de moto, se ajusta el plan (se quitan las partes del otro tipo y se agregan las suyas)
    if (Number(vehiculo.tipo_vehiculo_id) === 1 && datos.subtipo && datos.subtipo !== vehiculo.subtipo) {
      await repo.ajustarPlanPorSubtipo(conn, id, datos.subtipo, vehiculo.km_actual, hoy());
    }
  });
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
    if (validacion.requiereConfirmacion) throw new AppError(validacion.mensaje, status, { requiereConfirmacion: true });
    throw AppError.campo('km', validacion.mensaje, status);
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

/**
 * RN-16: el usuario indica cuándo fue el último cambio de una o varias partes
 * (al registrar un vehículo con uso, o después para corregir el dato).
 *   partes = [{ parte_id, desconocido: true }], [{ parte_id, nunca: true }]  o  [{ parte_id, km, fecha }]
 * Solo se permite en partes sin cambios registrados en la app: si ya tienen,
 * el historial es el que manda.
 */
async function fijarUltimosCambios(usuarioId, vehiculoId, partes) {
  const vehiculo = await vehiculoDelUsuario(usuarioId, vehiculoId);
  const actuales = await repo.partesActivas(vehiculoId);
  const fechaHoy = hoy();

  const lecturasKm = await repo.lecturas(vehiculoId);
  const cambios = partes.map((dato, i) => {
    const parte = actuales.find((p) => p.id === dato.parte_id);
    if (!parte) throw new AppError('Una de las partes no pertenece a este vehículo');
    if (parte.cambios_registrados > 0) {
      throw new AppError(`"${parte.nombre}" ya tiene cambios registrados en la app; su desgaste se calcula desde el último.`);
    }
    if (dato.nunca) {
      return { parteId: parte.id, ...ultimoCambioNunca(vehiculo.fecha_matricula) };
    }
    if (dato.desconocido) {
      const { km, fecha } = ultimoCambioDesconocido(vehiculo.fecha_matricula);
      return { parteId: parte.id, km, fecha, conocido: false };
    }
    const validacion = validarUltimoCambio({
      km: dato.km, fecha: dato.fecha, kmActual: vehiculo.km_actual, fechaMatricula: vehiculo.fecha_matricula, hoy: fechaHoy,
    });
    if (!validacion.valido) {
      // El error se marca en el campo exacto (km o fecha) de esa parte
      const campo = validacion.mensaje.includes('kilometraje') ? 'km' : 'fecha';
      throw AppError.campo(`partes.${i}.${campo}`, validacion.mensaje);
    }
    const enFecha = validarKmEnFecha(lecturasKm, dato.fecha, dato.km);  // RN-09
    if (!enFecha.valido) throw AppError.campo(`partes.${i}.km`, enFecha.mensaje);
    return { parteId: parte.id, km: dato.km, fecha: dato.fecha, conocido: true };
  });

  await transaccion(async (conn) => {
    for (const c of cambios) await repo.fijarUltimoCambio(conn, c.parteId, c);
  });
  return detalle(usuarioId, vehiculoId);
}

async function historialParte(usuarioId, parteId) {
  const parte = await parteDelUsuario(usuarioId, parteId);
  return { parte, historial: await repo.historialParte(parteId), revisiones: await repo.revisionesDeParte(parteId) };
}

// --- Revisión de una parte: "Revisé y está bien" (RF-27, RN-20) ---

/**
 * El usuario revisó la parte, está en buen estado y elige el mes de la próxima
 * revisión ('AAAA-MM'). Se guarda con la fecha de hoy y el km actual.
 */
async function revisarParte(usuarioId, parteId, { mes, nota }) {
  const parte = await parteDelUsuario(usuarioId, parteId);
  const vehiculo = await vehiculoDelUsuario(usuarioId, parte.vehiculo_id);
  const validacion = validarMesRevision(mes, hoy());
  if (!validacion.valido) throw AppError.campo('mes', validacion.mensaje);
  await transaccion((conn) => repo.registrarRevision(conn, {
    parteId, fecha: hoy(), km: vehiculo.km_actual, revisarEn: validacion.fecha, nota,
  }));
  return detalle(usuarioId, parte.vehiculo_id);
}

// --- Novedades: daños, fallas o golpes (RF-28, RN-21) ---

async function novedadDelUsuario(usuarioId, novedadId) {
  const novedad = await repo.buscarNovedad(novedadId);
  if (!novedad) throw AppError.noEncontrado('Daño no encontrado');
  await vehiculoDelUsuario(usuarioId, novedad.vehiculo_id);
  return novedad;
}

async function listarNovedades(usuarioId, vehiculoId) {
  await vehiculoDelUsuario(usuarioId, vehiculoId);
  return repo.listarNovedades(vehiculoId);
}

/**
 * Validaciones comunes de fecha y km: no futura, no antes de la matrícula, no más que el km
 * del vehículo y (RN-09) que el km cuadre con las lecturas del odómetro de esa fecha.
 */
async function validarFechaKm({ fecha, km }, vehiculo, prefijo = '') {
  if (fecha > hoy()) throw AppError.campo(`${prefijo}fecha`, 'La fecha no puede ser futura');
  if (fecha < vehiculo.fecha_matricula) throw AppError.campo(`${prefijo}fecha`, 'La fecha no puede ser anterior a la matrícula del vehículo');
  if (km > vehiculo.km_actual) {
    throw AppError.campo(`${prefijo}km`, `No puede ser mayor al kilometraje actual del vehículo (${vehiculo.km_actual.toLocaleString('es-CO')} km). Si ya recorrió más, actualiza primero el kilometraje.`);
  }
  const enFecha = validarKmEnFecha(await repo.lecturas(vehiculo.id), fecha, km);
  if (!enFecha.valido) throw AppError.campo(`${prefijo}km`, enFecha.mensaje);
}

/**
 * Al arreglar una novedad de una parte del plan se registra un servicio con el
 * cambio de esa parte: su desgaste vuelve a 0 % (RN-09) y el costo entra a los
 * gastos como cualquier cambio. Si no es de una parte, el costo queda en la novedad.
 */
async function arreglarDentro(conn, novedad, vehiculo, { fecha, km, lugar, costo, marca_referencia }) {
  let servicioId = null;
  if (novedad.parte_id) {
    const parte = await repo.buscarParte(novedad.parte_id);
    if (parte) {
      if (km < parte.ultimo_cambio_km) throw AppError.campo('km', `"${parte.nombre}" se cambió por última vez a los ${parte.ultimo_cambio_km.toLocaleString('es-CO')} km: el kilometraje no puede ser menor.`);
      if (fecha < parte.ultimo_cambio_fecha) throw AppError.campo('fecha', `"${parte.nombre}" se cambió por última vez el ${parte.ultimo_cambio_fecha.split('-').reverse().join('/')}: la fecha no puede ser anterior.`);
      servicioId = await repo.crearServicio(conn, { vehiculoId: vehiculo.id, fecha, km, lugar });
      await repo.registrarCambio(conn, { servicioId, parteId: parte.id, costo: costo ?? 0, marcaReferencia: marca_referencia, km, fecha });
    }
  }
  await repo.marcarArreglada(conn, novedad.id, { fecha, km, lugar, costo: costo ?? 0, servicioId });
}

async function crearNovedad(usuarioId, vehiculoId, datos, fotoUrl) {
  const vehiculo = await vehiculoDelUsuario(usuarioId, vehiculoId);
  let titulo = datos.titulo;
  if (datos.parte_id) {
    const parte = (await repo.partesActivas(vehiculoId)).find((p) => p.id === datos.parte_id);
    if (!parte) throw AppError.campo('parte_id', 'Esa parte no pertenece a este vehículo');
    titulo = titulo || parte.nombre;
  }
  if (!titulo) throw AppError.campo('titulo', 'Escribe qué se dañó');
  await validarFechaKm(datos, vehiculo);

  const arreglo = {
    fecha: datos.arreglo_fecha ?? datos.fecha, km: datos.arreglo_km ?? datos.km,
    lugar: datos.lugar, costo: datos.costo, marca_referencia: datos.marca_referencia,
  };
  if (datos.arreglada) {
    await validarFechaKm(arreglo, vehiculo, 'arreglo_');
    if (arreglo.fecha < datos.fecha) throw AppError.campo('arreglo_fecha', 'El arreglo no puede ser antes del daño');
  }

  await transaccion(async (conn) => {
    const id = await repo.crearNovedad(conn, {
      vehiculoId, parteId: datos.parte_id, tipo: datos.tipo, titulo, descripcion: datos.descripcion,
      fecha: datos.fecha, km: datos.km, estado: 'pendiente', fotoUrl, impideCircular: datos.impide_circular,
    });
    if (datos.arreglada) await arreglarDentro(conn, { id, parte_id: datos.parte_id }, vehiculo, arreglo);
  });
  return detalle(usuarioId, vehiculoId);
}

async function arreglarNovedad(usuarioId, novedadId, datos) {
  const novedad = await novedadDelUsuario(usuarioId, novedadId);
  if (novedad.estado === 'arreglada') throw new AppError('Este daño ya está marcado como arreglado');
  const vehiculo = await vehiculoDelUsuario(usuarioId, novedad.vehiculo_id);
  await validarFechaKm(datos, vehiculo);
  if (datos.fecha < novedad.fecha) throw AppError.campo('fecha', 'El arreglo no puede ser antes del daño');
  await transaccion((conn) => arreglarDentro(conn, novedad, vehiculo, datos));
  return detalle(usuarioId, novedad.vehiculo_id);
}

/** Panel de daños: todos los del usuario (READ del CRUD). */
function listarNovedadesDelUsuario(usuarioId) {
  return repo.listarNovedadesDelUsuario(usuarioId);
}

async function verNovedad(usuarioId, novedadId) {
  const novedad = await novedadDelUsuario(usuarioId, novedadId);
  return (await repo.listarNovedades(novedad.vehiculo_id)).find((n) => n.id === novedad.id);
}

/**
 * Editar un daño (UPDATE del CRUD). La parte no se cambia (si se eligió mal,
 * se elimina y se registra de nuevo).
 * Si ya está arreglado como cambio de una parte (tiene servicio), la fecha y el km
 * del arreglo no se editan porque son el "último cambio" de la parte; sí el lugar y el costo.
 */
async function editarNovedad(usuarioId, novedadId, datos, fotoUrl) {
  const novedad = await novedadDelUsuario(usuarioId, novedadId);
  const vehiculo = await vehiculoDelUsuario(usuarioId, novedad.vehiculo_id);
  const titulo = datos.titulo || novedad.titulo;
  await validarFechaKm(datos, vehiculo);

  const arreglada = novedad.estado === 'arreglada';
  const conServicio = arreglada && novedad.servicio_id;
  let arreglo = { arregladaEn: null, arregladaKm: null, lugar: null, costo: null };
  if (arreglada) {
    arreglo = {
      arregladaEn: conServicio ? novedad.arreglada_en : (datos.arreglo_fecha ?? novedad.arreglada_en),
      arregladaKm: conServicio ? novedad.arreglada_km : (datos.arreglo_km ?? novedad.arreglada_km),
      lugar: datos.lugar, costo: datos.costo ?? 0,
    };
    if (!conServicio) await validarFechaKm({ fecha: arreglo.arregladaEn, km: arreglo.arregladaKm }, vehiculo, 'arreglo_');
    if (arreglo.arregladaEn < datos.fecha) throw AppError.campo('fecha', 'El daño no puede ser después de su arreglo');
  }

  await transaccion(async (conn) => {
    await repo.actualizarNovedad(conn, novedad.id, {
      tipo: datos.tipo, titulo, descripcion: datos.descripcion, fecha: datos.fecha, km: datos.km, fotoUrl, ...arreglo,
      impideCircular: datos.impide_circular,
    });
    if (conServicio) {
      await repo.actualizarServicioDeNovedad(conn, { servicioId: novedad.servicio_id, parteId: novedad.parte_id, lugar: arreglo.lugar, costo: arreglo.costo });
    }
  });
  return verNovedad(usuarioId, novedad.id);
}

async function eliminarNovedad(usuarioId, novedadId) {
  const novedad = await novedadDelUsuario(usuarioId, novedadId);
  await repo.eliminarNovedad(novedadId);  // el servicio que se registró al arreglarla se conserva
  return detalle(usuarioId, novedad.vehiculo_id);
}

/**
 * RF-29 (RN-23): transferir el vehículo a otro usuario de AlDía, por ejemplo al venderlo.
 * El vehículo pasa con TODO su historial (partes, cambios, documentos, daños y fotos),
 * que es lo que le da valor a la hoja de vida. Se pide la contraseña del dueño actual
 * y el correo debe ser de una cuenta activa distinta a la propia.
 */
async function transferir(usuarioId, vehiculoId, { correo, password }) {
  const vehiculo = await vehiculoDelUsuario(usuarioId, vehiculoId);
  const dueno = await authRepo.buscarPorId(usuarioId);
  if (!(await bcrypt.compare(password, dueno.password_hash))) throw AppError.campo('password', 'La contraseña no es correcta');
  const nuevo = await authRepo.buscarPorCorreo(correo);
  if (!nuevo || !nuevo.activo) throw AppError.campo('correo', 'No hay una cuenta activa de AlDía con ese correo. Pídele al comprador que se registre primero.');
  if (nuevo.id === usuarioId) throw AppError.campo('correo', 'Ese es tu propio correo');

  await transaccion((conn) => repo.transferir(conn, vehiculoId, usuarioId, nuevo.id));
  await notificaciones.crear(nuevo.id, {
    tipo: 'documento',
    titulo: `Recibiste el vehículo ${vehiculo.placa}`,
    mensaje: `${dueno.nombre} te transfirió ${vehiculo.marca} ${vehiculo.linea} con todo su historial de mantenimiento. Revisa el kilometraje y los documentos.`,
    enlace: `/vehiculo/${vehiculoId}`,
    clave: `transferencia:${vehiculoId}:${Date.now()}`,
  });
  return { mensaje: `${vehiculo.placa} ahora es de ${nuevo.nombre}` };
}

async function revisionesDeVehiculo(usuarioId, vehiculoId) {
  await vehiculoDelUsuario(usuarioId, vehiculoId);
  return repo.revisionesDeVehiculo(vehiculoId);
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
  if (fecha > hoy()) throw AppError.campo('fecha', 'La fecha del servicio no puede ser futura');
  if (km > vehiculo.km_actual) {
    throw AppError.campo('km', `No puede ser mayor al kilometraje actual del vehículo (${vehiculo.km_actual.toLocaleString('es-CO')} km). Si ya recorrió más, actualiza primero el kilometraje.`);
  }
  const vistas = new Set();
  for (const cambio of cambios) {
    const parte = partes.find((p) => p.id === cambio.parte_id);
    if (!parte) throw new AppError('Una de las partes no pertenece a este vehículo');
    if (vistas.has(parte.id)) throw new AppError(`La parte "${parte.nombre}" está repetida`);
    vistas.add(parte.id);
    if (km < parte.ultimo_cambio_km) {
      throw AppError.campo('km', `"${parte.nombre}" se cambió por última vez a los ${parte.ultimo_cambio_km.toLocaleString('es-CO')} km: el kilometraje no puede ser menor.`);
    }
    if (fecha < parte.ultimo_cambio_fecha) {
      throw AppError.campo('fecha', `"${parte.nombre}" se cambió por última vez el ${parte.ultimo_cambio_fecha.split('-').reverse().join('/')}: la fecha no puede ser anterior.`);
    }
  }

  // RN-09: el km del servicio debe cuadrar con las lecturas del odómetro de esa fecha
  const enFecha = validarKmEnFecha(await repo.lecturas(vehiculoId), fecha, km);
  if (!enFecha.valido) throw AppError.campo('km', enFecha.mensaje);

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
  agregarParte, actualizarParte, quitarParte, historialParte, fijarUltimosCambios,
  sugerencias, registrarServicio, historial,
  revisarParte, revisionesDeVehiculo, listarNovedades, crearNovedad, arreglarNovedad, eliminarNovedad,
  listarNovedadesDelUsuario, verNovedad, editarNovedad, transferir,
};
