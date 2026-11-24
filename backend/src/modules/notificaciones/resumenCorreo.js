// =====================================================================
// RESUMEN DIARIO POR CORREO
// Después de generar las alertas (tarea diaria), cada usuario recibe UN
// correo con sus notificaciones nuevas: así se entera aunque no abra la app.
// - Solo se envían alertas de los últimos 3 días (no correos con avisos viejos).
// - Cada notificación se marca correo_enviado = TRUE para no repetirla.
// - Sin Gmail configurado no se hace nada y quedan pendientes.
// =====================================================================
const { query } = require('../../config/db');
const config = require('../../config/env');
const { enviarCorreo, correoConfigurado, plantilla, escapar } = require('../../utils/correo');

const COLOR_POR_TIPO = { documento: '#dc2626', parte: '#d97706', kilometraje: '#2563eb' };
const ICONO_POR_TIPO = { documento: '📄', parte: '🔧', kilometraje: '📍' };

async function enviarResumenes() {
  if (!correoConfigurado()) return { enviados: 0 };

  const pendientes = await query(
    `SELECT n.id, n.usuario_id, n.tipo, n.titulo, n.mensaje, u.nombre, u.correo
       FROM notificaciones n JOIN usuarios u ON u.id = n.usuario_id
      WHERE n.correo_enviado = FALSE AND u.activo = TRUE
        AND n.creado_en >= NOW() - INTERVAL 3 DAY
      ORDER BY n.usuario_id, n.creado_en DESC`,
  );

  // Agrupar por usuario
  const porUsuario = new Map();
  for (const n of pendientes) {
    if (!porUsuario.has(n.usuario_id)) porUsuario.set(n.usuario_id, { nombre: n.nombre, correo: n.correo, avisos: [] });
    porUsuario.get(n.usuario_id).avisos.push(n);
  }

  let enviados = 0;
  for (const [usuarioId, u] of porUsuario) {
    const lista = u.avisos.map((a) => `
      <tr><td style="padding:12px;border-left:4px solid ${COLOR_POR_TIPO[a.tipo] || '#2563eb'};background:#f8fafc;border-radius:8px">
        <div style="font-weight:bold">${ICONO_POR_TIPO[a.tipo] || '🔔'} ${escapar(a.titulo)}</div>
        <div style="font-size:14px;color:#475569;margin-top:4px">${escapar(a.mensaje)}</div>
      </td></tr><tr><td style="height:8px"></td></tr>`).join('');

    const ok = await enviarCorreo({
      para: u.correo,
      nombre: u.nombre,
      asunto: u.avisos.length === 1 ? `AlDía: ${u.avisos[0].titulo}` : `AlDía: tienes ${u.avisos.length} avisos de tu vehículo`,
      html: plantilla({
        titulo: `Hola, ${u.nombre}`,
        contenido: `<p>Esto es lo que necesita atención:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lista}</table>`,
        boton: { texto: 'Abrir AlDía', url: config.urlApp },
      }),
    });
    if (ok) {
      enviados += 1;
      // Se marcan todas las pendientes del usuario (también las de más de 3 días, que ya no se enviarán)
      await query('UPDATE notificaciones SET correo_enviado = TRUE WHERE usuario_id = ? AND correo_enviado = FALSE', [usuarioId]);
    }
  }
  return { enviados };
}

module.exports = { enviarResumenes };
