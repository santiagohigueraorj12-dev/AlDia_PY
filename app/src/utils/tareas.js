// Arma la lista "Lo que debes hacer" del Inicio a partir del panel (RF-14).
// Cada tarea dice qué hacer en palabras simples y a qué pantalla lleva su botón.
// Orden: lo que impide circular, luego lo vencido, luego lo próximo.
import { fecha } from './formato';

/** Días entre hoy y una fecha 'AAAA-MM-DD' (negativo si ya pasó). */
function diasHasta(texto) {
  const [a, m, d] = texto.slice(0, 10).split('-').map(Number);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(a, m - 1, d) - hoy) / 86400000);
}

export function armarTareas(panel) {
  const tareas = [];

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

  // Partes vencidas o próximas
  for (const p of panel.partesUrgentes) {
    const vencida = p.desgaste.estado === 'vencida';
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
