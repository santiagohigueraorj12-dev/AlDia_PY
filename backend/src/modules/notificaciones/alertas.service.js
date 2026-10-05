// =====================================================================
// GENERACIÓN DE ALERTAS  (RN-04, RN-08, RN-13)
// Revisa un vehículo ya "armado" (con desgaste y documentos calculados)
// y crea las notificaciones que correspondan para su dueño.
// Se ejecuta en la tarea diaria y al actualizar el kilometraje.
// =====================================================================
const { hoy, diasEntre, formatoColombia } = require('../../utils/fechas');
const { umbralDeAlerta, NOMBRES } = require('../../domain/documentos');
const notificaciones = require('./notificaciones.service');

const DIAS_REPETIR_VENCIDA = 3;  // RN-08

async function alertasDePartes(v, fechaHoy) {
  for (const parte of v.partes) {
    // El "ciclo" es el período desde el último cambio de la parte. Al registrar
    // un cambio empieza un ciclo nuevo y las alertas se pueden volver a enviar.
    const ciclo = `parte:${parte.id}:${parte.ultimo_cambio_fecha}:${parte.ultimo_cambio_km}`;
    const { estado, porcentaje } = parte.desgaste;

    if (estado === 'proxima') {
      await notificaciones.crear(v.usuario_id, {
        tipo: 'parte',
        titulo: `Cambio próximo: ${parte.nombre} (${v.placa})`,
        mensaje: `Lleva ${porcentaje.toLocaleString('es-CO')} % de desgaste. Programa el cambio pronto.`,
        enlace: `/vehiculo/${v.id}`,  // ruta de la pantalla en la app
        clave: `${ciclo}:proxima`,
      });
    }

    if (estado === 'vencida') {
      // RN-08: la alerta de vencida se repite cada 3 días hasta que se registre el cambio.
      const ultima = await notificaciones.ultimaConPrefijo(v.usuario_id, `${ciclo}:vencida`);
      if (!ultima || diasEntre(ultima, fechaHoy) >= DIAS_REPETIR_VENCIDA) {
        await notificaciones.crear(v.usuario_id, {
          tipo: 'parte',
          titulo: `Cambio vencido: ${parte.nombre} (${v.placa})`,
          mensaje: `Lleva ${porcentaje.toLocaleString('es-CO')} % de desgaste. Haz el cambio lo antes posible.`,
          enlace: `/vehiculo/${v.id}`,  // ruta de la pantalla en la app
          clave: `${ciclo}:vencida:${fechaHoy}`,
        });
      }
    }
  }
}

/** RN-04: si el kilometraje se está estimando, se pide actualizarlo. */
async function alertaDeKilometraje(v) {
  if (!v.kmEstimado) return;
  await notificaciones.crear(v.usuario_id, {
    tipo: 'kilometraje',
    titulo: `Actualiza el kilometraje de ${v.placa}`,
    mensaje: `Llevas ${v.diasSinActualizarKm} días sin actualizarlo. Lo estimamos en ${v.kmCalculo.toLocaleString('es-CO')} km según tu uso diario.`,
    enlace: `/vehiculo/${v.id}`,  // ruta de la pantalla en la app
    clave: `km:${v.id}:${String(v.km_actualizado_en).slice(0, 10)}`,
  });
}

/** RN-13: avisos 30, 7 y 1 día antes del vencimiento, el mismo día, y cuando ya venció. */
async function alertasDeDocumentos(v, fechaHoy) {
  for (const doc of v.documentos) {
    const nombre = `${NOMBRES[doc.tipo]} de ${v.placa}`;
    const base = `doc:${doc.id}:${doc.fecha_vencimiento}`;  // cambia al renovar

    if (doc.estado === 'vencido') {
      await notificaciones.crear(v.usuario_id, {
        tipo: 'documento',
        titulo: `Documento vencido: ${nombre}`,
        mensaje: `Venció el ${formatoColombia(doc.fecha_vencimiento)}. Renuévalo para poder circular.`,
        enlace: `/vehiculo/${v.id}`,  // ruta de la pantalla en la app
        clave: `${base}:vencido`,
      });
      continue;
    }

    const umbral = umbralDeAlerta(doc.fecha_vencimiento, fechaHoy);
    if (umbral === null) continue;
    const faltan = diasEntre(fechaHoy, doc.fecha_vencimiento);
    await notificaciones.crear(v.usuario_id, {
      tipo: 'documento',
      titulo: faltan === 0 ? `${nombre} vence HOY` : `${nombre} vence en ${faltan} día${faltan === 1 ? '' : 's'}`,
      mensaje: `Fecha de vencimiento: ${formatoColombia(doc.fecha_vencimiento)}.`,
      enlace: `/vehiculo/${v.id}`,  // ruta de la pantalla en la app
      clave: `${base}:${umbral}`,
    });
  }
}

/** @param {object} v vehículo armado por vehiculos.service.armarVehiculo() */
async function revisarVehiculo(v, fechaHoy = hoy()) {
  await alertasDePartes(v, fechaHoy);
  await alertaDeKilometraje(v);
  await alertasDeDocumentos(v, fechaHoy);
}

module.exports = { revisarVehiculo };
