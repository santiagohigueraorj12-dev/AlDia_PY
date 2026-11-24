// Arma la lista "Lo que debes hacer" del Inicio a partir del panel (RF-14).
// Cada tarea dice qué hacer en palabras simples y a qué pantalla lleva su botón.
// Orden: lo que impide circular, luego lo vencido, luego lo próximo.
import { fecha } from './formato.js';

/** Días entre hoy y una fecha 'AAAA-MM-DD' (negativo si ya pasó). */
function diasHasta(texto) {
  const [a, m, d] = texto.slice(0, 10).split('-').map(Number);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(a, m - 1, d) - hoy) / 86400000);
}

/**
 * panel:   lo que devuelve GET /api/panel
 * usuario: el usuario con sesión (opcional), para avisar de su licencia de conducción
 */
export function armarTareas(panel, usuario = null) {
  const tareas = [];

  // Licencia de conducción vencida o por vencer (RN-18)
  if (usuario && ['vencido', 'por_vencer'].includes(usuario.estadoLicencia)) {
    const vencida = usuario.estadoLicencia === 'vencido';
    const dias = diasHasta(usuario.licencia_vence);
    tareas.push({
      clave: 'licencia',
      prioridad: vencida ? 0 : 3,
      icono: 'card', tono: vencida ? 'vencida' : 'proxima',
      titulo: 'Renovar tu licencia de conducción',
      detalle: vencida
        ? `Venció el ${fecha(usuario.licencia_vence)}. Conducir con la licencia vencida tiene multa.`
        : `Vence el ${fecha(usuario.licencia_vence)} (${dias === 0 ? 'hoy' : `en ${dias} día${dias === 1 ? '' : 's'}`}).`,
      boton: 'Actualizar fecha', iconoBoton: 'create-outline',
      ruta: '/perfil',
    });
  }

  // Documentos vencidos y por vencer
  for (const d of panel.documentosPorVencer) {
    const dias = diasHasta(d.fecha_vencimiento);
    const vencido = d.estado === 'vencido';
    tareas.push({
      clave: `doc-${d.id}`,
      prioridad: vencido ? 0 : 3,
      icono: 'document-text', tono: vencido ? 'vencida' : 'proxima',
      titulo: `Renovar ${d.nombre} · ${d.placa}`,
      detalle: vencido
        ? `Venció el ${fecha(d.fecha_vencimiento)}. Sin este documento no debes circular.`
        : `Vence el ${fecha(d.fecha_vencimiento)} (${dias === 0 ? 'hoy' : `en ${dias} día${dias === 1 ? '' : 's'}`}).`,
      boton: 'Renovar', iconoBoton: 'refresh',
      ruta: `/vehiculo/${d.vehiculoId}/documento?tipo=${d.tipo}`,
    });
  }

  // Daños sin arreglar (RN-21, en el código: novedades)
  for (const n of panel.novedadesPendientes || []) {
    tareas.push({
      clave: `novedad-${n.id}`,
      prioridad: 1,
      icono: n.tipo === 'accidente' ? 'car-sport' : 'warning', tono: 'vencida',
      titulo: `Arreglar: ${n.titulo.toLowerCase()} · ${n.placa}`,
      detalle: `Lo registraste el ${fecha(n.fecha)}. Cuando lo arregles, márcalo como arreglado.`,
      boton: 'Ya se arregló', iconoBoton: 'checkmark',
      ruta: `/vehiculo/${n.vehiculoId}/novedad?novedadId=${n.id}`,
    });
  }

  // Partes vencidas o próximas
  for (const p of panel.partesUrgentes) {
    const vencida = p.desgaste.estado === 'vencida';
    // RN-20: parte que el usuario revisó en buen estado y ya llegó el mes elegido
    if (p.desgaste.revision) {
      tareas.push({
        clave: `parte-${p.id}`,
        prioridad: vencida ? 3 : 5,
        icono: 'search', tono: 'proxima',
        titulo: `Revisar ${p.nombre.toLowerCase()} · ${p.placa}`,
        detalle: vencida ? 'Llegó el mes que elegiste para revisarla.' : 'Se acerca el mes que elegiste para revisarla.',
        boton: 'Ver parte', iconoBoton: 'arrow-forward',
        ruta: `/vehiculo/${p.vehiculoId}/parte?parteId=${p.id}`,
      });
      continue;
    }
    tareas.push({
      clave: `parte-${p.id}`,
      prioridad: vencida ? 1 : 4,
      icono: 'construct', tono: vencida ? 'vencida' : 'proxima',
      titulo: `Cambiar ${p.nombre.toLowerCase()} · ${p.placa}`,
      detalle: !p.conocido
        ? 'No sabemos cuándo se cambió por última vez: revísala.'
        : vencida
          ? 'Ya pasó el momento del cambio.'
          : `Le falta poco${p.desgaste.diasRestantes !== null ? `: unos ${p.desgaste.diasRestantes} día${p.desgaste.diasRestantes === 1 ? '' : 's'}` : ''}.`,
      boton: 'Ya lo cambié', iconoBoton: 'checkmark',
      ruta: `/vehiculo/${p.vehiculoId}/servicio?parteId=${p.id}`,
    });
  }

  // Kilometraje sin actualizar (se está estimando)
  for (const v of panel.vehiculos.filter((x) => x.kmEstimado)) {
    tareas.push({
      clave: `km-${v.id}`,
      prioridad: 2,
      icono: 'speedometer', tono: 'proxima',
      titulo: `Actualizar el kilometraje · ${v.placa}`,
      detalle: 'Hace más de 15 días que no lo actualizas; los cálculos usan un valor aproximado.',
      boton: 'Actualizar km', iconoBoton: 'create-outline',
      ruta: `/vehiculo/${v.id}/kilometraje`,
    });
  }

  return tareas.sort((a, b) => a.prioridad - b.prioridad);
}
