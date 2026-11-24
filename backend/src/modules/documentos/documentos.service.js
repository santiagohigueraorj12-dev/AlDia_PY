// =====================================================================
// LÓGICA DE DOCUMENTOS DEL VEHÍCULO  (RF-12, RF-13, RN-15)
// =====================================================================
const { transaccion } = require('../../config/db');
const AppError = require('../../utils/AppError');
const { hoy } = require('../../utils/fechas');
const { validarRenovacion, validarVencimiento, fechaSugerida, NOMBRES } = require('../../domain/documentos');
const vehiculosRepo = require('../vehiculos/vehiculos.repository');
const repo = require('./documentos.repository');

async function documentoDelUsuario(usuarioId, id) {
  const documento = await repo.buscarDelUsuario(id, usuarioId);
  if (!documento) throw AppError.noEncontrado('Documento no encontrado');
  return documento;
}

/** RF-12: registrar un documento. Queda la primera fila de su historial. */
async function registrar(usuarioId, vehiculoId, { tipo, fecha_vencimiento, valor = 0, fecha_pago }, archivoUrl) {
  const vehiculo = await vehiculosRepo.buscarDelUsuario(vehiculoId, usuarioId);
  if (!vehiculo) throw AppError.noEncontrado('Vehículo no encontrado');
  if (await repo.buscarPorTipo(vehiculoId, tipo)) {
    throw new AppError(`Este vehículo ya tiene ${NOMBRES[tipo]}. Usa la opción "Renovar".`, 409);
  }

  const tope = validarVencimiento(tipo, fecha_vencimiento, hoy());  // RN-15
  if (!tope.valido) throw AppError.campo('fecha_vencimiento', tope.mensaje);

  const fechaPago = fecha_pago || hoy();
  await transaccion(async (conn) => {  // RNF-07
    const documentoId = await repo.crear(conn, { vehiculoId, tipo, fechaVencimiento: fecha_vencimiento, archivoUrl });
    await repo.registrarEnHistorial(conn, { documentoId, fechaVencimiento: fecha_vencimiento, fechaPago, valor });
  });
  return repo.listarDeVehiculo(vehiculoId);
}

/** RF-13 + RN-15: renovar. La nueva fecha debe ser posterior y se guarda en el historial. */
async function renovar(usuarioId, id, { fecha_vencimiento, valor = 0, fecha_pago }, archivoUrl) {
  const documento = await documentoDelUsuario(usuarioId, id);
  const validacion = validarRenovacion(documento.fecha_vencimiento, fecha_vencimiento, documento.tipo, hoy());
  if (!validacion.valido) throw AppError.campo('fecha_vencimiento', validacion.mensaje);

  const fechaPago = fecha_pago || hoy();
  if (fechaPago > hoy()) throw AppError.campo('fecha_pago', 'La fecha de pago no puede ser futura');

  await transaccion(async (conn) => {  // RNF-07
    await repo.actualizarVencimiento(conn, id, fecha_vencimiento, archivoUrl);
    await repo.registrarEnHistorial(conn, { documentoId: id, fechaVencimiento: fecha_vencimiento, fechaPago, valor });
  });
  return repo.listarDeVehiculo(documento.vehiculo_id);
}

async function historial(usuarioId, id) {
  const documento = await documentoDelUsuario(usuarioId, id);
  return {
    ...documento, nombre: NOMBRES[documento.tipo], historial: await repo.historial(id),
    fechaSugerida: fechaSugerida(documento.fecha_vencimiento, hoy()),  // un año después, para el formulario de renovación
  };
}

async function eliminar(usuarioId, id) {
  const documento = await documentoDelUsuario(usuarioId, id);
  await repo.eliminar(id);
  return repo.listarDeVehiculo(documento.vehiculo_id);
}

module.exports = { registrar, renovar, historial, eliminar };
