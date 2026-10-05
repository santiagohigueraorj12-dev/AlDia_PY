// RF-11: hoja de vida del vehículo en PDF con todos sus cambios y documentos.
const { crearPdf, encabezado, seccion, datos, tabla, pesos } = require('../../utils/pdf');
const { formatoColombia } = require('../../utils/fechas');
const { NOMBRES } = require('../../domain/documentos');

const ESTADOS_VEHICULO = { al_dia: 'Al día', requiere_atencion: 'Requiere atención', no_apto: 'No apto para circular' };
const ESTADOS_PARTE = { bien: 'Bien', proxima: 'Próxima a cambio', vencida: 'Vencida' };
const ESTADOS_DOCUMENTO = { vigente: 'Vigente', por_vencer: 'Por vencer', vencido: 'VENCIDO' };

/**
 * @param {object} vehiculo armado por vehiculos.service.armarVehiculo
 * @param {object[]} servicios historial de servicios con sus cambios
 */
function generarHojaDeVida(res, vehiculo, servicios) {
  const doc = crearPdf(res, `hoja-de-vida-${vehiculo.placa}.pdf`);
  encabezado(doc, `Hoja de vida del vehículo ${vehiculo.placa}`, `${vehiculo.tipo} ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`);

  seccion(doc, 'Datos del vehículo');
  datos(doc, [
    ['Placa', vehiculo.placa],
    ['Tipo', vehiculo.tipo],
    ['Marca y modelo', `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})`],
    ['Fecha de matrícula', formatoColombia(vehiculo.fecha_matricula)],
    ['Kilometraje inicial', `${vehiculo.km_inicial.toLocaleString('es-CO')} km`],
    ['Kilometraje actual', `${vehiculo.km_actual.toLocaleString('es-CO')} km`],
    ['Estado', ESTADOS_VEHICULO[vehiculo.estado]],
    ['Costo de mantenimiento (partes)', pesos(vehiculo.costos.mantenimiento)],
    ['Costo en documentos', pesos(vehiculo.costos.documentos)],
    ['Costo por kilómetro', vehiculo.costos.porKm === null ? '—' : pesos(vehiculo.costos.porKm)],
  ]);

  seccion(doc, 'Estado de las partes');
  tabla(doc, [
    { titulo: 'Parte', ancho: 170 },
    { titulo: 'Intervalo', ancho: 110 },
    { titulo: 'Último cambio', ancho: 110 },
    { titulo: 'Desgaste', ancho: 55, alinear: 'right' },
    { titulo: 'Estado', ancho: 67 },
  ], vehiculo.partes.map((p) => [
    p.nombre,
    `${p.intervalo_km ? `${p.intervalo_km.toLocaleString('es-CO')} km / ` : ''}${p.intervalo_meses} meses`,
    `${formatoColombia(p.ultimo_cambio_fecha)} - ${p.ultimo_cambio_km.toLocaleString('es-CO')} km`,
    `${p.desgaste.porcentaje}%`,
    ESTADOS_PARTE[p.desgaste.estado],
  ]));

  seccion(doc, 'Historial de servicios');
  const filas = [];
  for (const s of servicios) {
    for (const c of s.cambios) {
      filas.push([formatoColombia(s.fecha), `${s.km.toLocaleString('es-CO')} km`, c.parte, c.marca_referencia || '—', s.lugar || '—', pesos(c.costo)]);
    }
  }
  tabla(doc, [
    { titulo: 'Fecha', ancho: 62 },
    { titulo: 'Km', ancho: 65 },
    { titulo: 'Parte', ancho: 120 },
    { titulo: 'Marca / referencia', ancho: 110 },
    { titulo: 'Lugar', ancho: 90 },
    { titulo: 'Costo', ancho: 65, alinear: 'right' },
  ], filas);

  seccion(doc, 'Documentos');
  tabla(doc, [
    { titulo: 'Documento', ancho: 250 },
    { titulo: 'Vence', ancho: 100 },
    { titulo: 'Estado', ancho: 162 },
  ], vehiculo.documentos.map((d) => [NOMBRES[d.tipo], formatoColombia(d.fecha_vencimiento), ESTADOS_DOCUMENTO[d.estado]]));

  doc.end();
}

module.exports = { generarHojaDeVida };
