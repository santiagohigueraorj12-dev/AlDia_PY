// Ley 1581: copia de "mis datos" en PDF, fácil de leer e imprimir.
// Tiene la misma información que el archivo JSON (auth.controller.misDatos), ordenada por secciones.
const { crearPdf, encabezado, seccion, datos, tabla, pesos } = require('../../utils/pdf');
const { formatoColombia } = require('../../utils/fechas');
const { NOMBRES } = require('../../domain/documentos');

const km = (n) => `${Number(n).toLocaleString('es-CO')} km`;
const fechaHora = (t) => (t ? `${formatoColombia(t)} ${String(t).slice(11, 16)}` : '—');

/** @param d resultado de auth.repository.datosCompletos */
function generarMisDatos(res, d) {
  const doc = crearPdf(res, 'mis-datos-aldia.pdf');
  const u = d.usuario;
  encabezado(doc, 'Mis datos en AlDía', 'Copia de toda la información que AlDía guarda sobre ti (Ley 1581 de 2012)');

  seccion(doc, 'Datos personales');
  datos(doc, [
    ['Nombre', u.nombre],
    ['Correo', u.correo],
    ['Teléfono', u.telefono || '—'],
    ['Documento', u.numero_documento ? `${u.tipo_documento || ''} ${u.numero_documento}`.trim() : '—'],
    ['Fecha de nacimiento', u.fecha_nacimiento ? formatoColombia(u.fecha_nacimiento) : '—'],
    ['Ubicación', [u.direccion, u.ciudad, u.departamento].filter(Boolean).join(', ') || '—'],
    ['Licencia de conducción', u.licencia_categoria ? `${u.licencia_categoria}${u.licencia_vence ? ` (vence ${formatoColombia(u.licencia_vence)})` : ''}` : '—'],
    ['Cuenta creada', fechaHora(u.creado_en)],
    ['Autorizó el tratamiento de datos', fechaHora(u.acepta_datos_en)],
  ]);

  // Nombres para relacionar las tablas entre sí
  const placa = Object.fromEntries(d.vehiculos.map((v) => [v.id, v.placa]));
  const parte = Object.fromEntries(d.partes.map((p) => [p.id, p.nombre]));
  const servicio = Object.fromEntries(d.servicios.map((s) => [s.id, s]));
  const documento = Object.fromEntries(d.documentos.map((x) => [x.id, x]));

  seccion(doc, `Vehículos (${d.vehiculos.length})`);
  tabla(doc, [
    { titulo: 'Placa', ancho: 65 }, { titulo: 'Tipo', ancho: 55 }, { titulo: 'Marca y línea', ancho: 150 },
    { titulo: 'Modelo', ancho: 50 }, { titulo: 'Matrícula', ancho: 75 }, { titulo: 'Km actual', ancho: 117, alinear: 'right' },
  ], d.vehiculos.map((v) => [v.placa, v.tipo, `${v.marca} ${v.linea}`, v.modelo, formatoColombia(v.fecha_matricula), km(v.km_actual)]));

  seccion(doc, 'Partes de cada vehículo');
  tabla(doc, [
    { titulo: 'Placa', ancho: 60 }, { titulo: 'Parte', ancho: 150 }, { titulo: 'Cada', ancho: 120 }, { titulo: 'Último cambio', ancho: 182 },
  ], d.partes.filter((p) => p.activa).map((p) => [
    placa[p.vehiculo_id], p.nombre,
    `${p.intervalo_km ? `${km(p.intervalo_km)} / ` : ''}${p.intervalo_meses} meses`,
    p.ultimo_cambio_conocido ? `${formatoColombia(p.ultimo_cambio_fecha)} - ${km(p.ultimo_cambio_km)}` : 'No se sabe',
  ]));

  seccion(doc, 'Historial de cambios');
  tabla(doc, [
    { titulo: 'Fecha', ancho: 62 }, { titulo: 'Placa', ancho: 55 }, { titulo: 'Km', ancho: 70 }, { titulo: 'Parte', ancho: 120 },
    { titulo: 'Marca / lugar', ancho: 135 }, { titulo: 'Costo', ancho: 70, alinear: 'right' },
  ], d.cambiosDeParte.map((c) => {
    const s = servicio[c.servicio_id] || {};
    return [formatoColombia(s.fecha), placa[s.vehiculo_id] || '—', s.km != null ? km(s.km) : '—', parte[c.parte_id] || '—',
      [c.marca_referencia, s.lugar].filter(Boolean).join(' · ') || '—', pesos(c.costo)];
  }));

  seccion(doc, 'Documentos');
  tabla(doc, [{ titulo: 'Placa', ancho: 90 }, { titulo: 'Documento', ancho: 250 }, { titulo: 'Vence', ancho: 172 }],
    d.documentos.map((x) => [placa[x.vehiculo_id], NOMBRES[x.tipo] || x.tipo, formatoColombia(x.fecha_vencimiento)]));

  seccion(doc, 'Renovaciones de documentos');
  tabla(doc, [
    { titulo: 'Placa', ancho: 70 }, { titulo: 'Documento', ancho: 170 }, { titulo: 'Pagado', ancho: 80 },
    { titulo: 'Nuevo vencimiento', ancho: 100 }, { titulo: 'Valor', ancho: 92, alinear: 'right' },
  ], d.renovacionesDeDocumentos.map((r) => {
    const x = documento[r.documento_id] || {};
    return [placa[x.vehiculo_id] || '—', NOMBRES[x.tipo] || '—', formatoColombia(r.fecha_pago), formatoColombia(r.fecha_vencimiento), pesos(r.valor)];
  }));

  seccion(doc, 'Revisiones de partes');
  tabla(doc, [{ titulo: 'Fecha', ancho: 80 }, { titulo: 'Placa', ancho: 70 }, { titulo: 'Parte', ancho: 170 }, { titulo: 'Próxima revisión', ancho: 192 }],
    (d.revisionesDePartes || []).map((r) => {
      const p = d.partes.find((x) => x.id === r.parte_id) || {};
      return [formatoColombia(r.fecha), placa[p.vehiculo_id] || '—', p.nombre || '—', formatoColombia(r.revisar_en).slice(3)];
    }));

  seccion(doc, 'Daños, fallas y golpes');
  tabla(doc, [{ titulo: 'Fecha', ancho: 70 }, { titulo: 'Placa', ancho: 60 }, { titulo: 'Detalle', ancho: 220 }, { titulo: 'Estado', ancho: 92 }, { titulo: 'Costo', ancho: 70, alinear: 'right' }],
    (d.novedades || []).map((n) => [formatoColombia(n.fecha), placa[n.vehiculo_id], [n.titulo, n.descripcion].filter(Boolean).join(': '),
      n.estado === 'arreglada' ? 'Arreglada' : 'Pendiente', n.estado === 'arreglada' ? pesos(n.costo) : '—']));

  seccion(doc, 'Lecturas de kilometraje');
  tabla(doc, [{ titulo: 'Fecha', ancho: 170 }, { titulo: 'Placa', ancho: 150 }, { titulo: 'Kilometraje', ancho: 192, alinear: 'right' }],
    d.lecturasKilometraje.map((l) => [fechaHora(l.fecha), placa[l.vehiculo_id], km(l.km)]));

  seccion(doc, 'Archivos adjuntos');
  tabla(doc, [{ titulo: 'Nombre', ancho: 250 }, { titulo: 'Tipo', ancho: 120 }, { titulo: 'Subido', ancho: 142 }],
    d.archivosAdjuntos.map((a) => [a.nombre, a.tipo, fechaHora(a.creado_en)]));

  seccion(doc, `Notificaciones (${d.notificaciones.length})`);
  tabla(doc, [{ titulo: 'Fecha', ancho: 95 }, { titulo: 'Aviso', ancho: 357 }, { titulo: 'Leída', ancho: 60 }],
    d.notificaciones.map((n) => [fechaHora(n.creado_en), n.titulo, n.leida ? 'Sí' : 'No']));

  doc.end();
}

module.exports = { generarMisDatos };
