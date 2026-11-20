// =====================================================================
// Envío de correos con Brevo (plan gratuito: 300 correos al día).
// Se usa su API por HTTPS y no SMTP, porque los servidores gratuitos en la
// nube suelen bloquear los puertos de correo.
//
// Variables (en Render → Environment, o en backend/.env):
//   BREVO_API_KEY     clave de la API de Brevo (empieza por "xkeysib-")
//   CORREO_REMITENTE  correo verificado en Brevo desde el que se envía
//   URL_APP           dirección pública de la app para los enlaces de los correos
//                     (en Render no hace falta: se usa RENDER_EXTERNAL_URL)
//
// Sin BREVO_API_KEY no se envía nada: el correo se escribe en la consola,
// que es lo que pasa en el computador local.
// =====================================================================
const config = require('../config/env');

/** ¿Hay datos para enviar correos de verdad? */
function correoConfigurado() {
  return Boolean(config.correo.apiKey && config.correo.remitente);
}

/**
 * Envía un correo. Devuelve true si salió, false si no (nunca lanza error:
 * un correo que falla no debe tumbar el registro ni la tarea diaria).
 */
async function enviarCorreo({ para, nombre, asunto, html }) {
  if (!correoConfigurado()) {
    console.log(`[Correo sin enviar: falta BREVO_API_KEY] Para: ${para} · Asunto: ${asunto}`);
    return false;
  }
  try {
    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': config.correo.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'AlDía', email: config.correo.remitente },
        to: [{ email: para, name: nombre || para }],
        subject: asunto,
        htmlContent: html,
      }),
    });
    if (!respuesta.ok) {
      console.error(`[Correo] Brevo respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Correo] No se pudo enviar:', error.message);
    return false;
  }
}

/** Escapa texto para meterlo en el HTML del correo sin romperlo. */
function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Plantilla común: encabezado azul de AlDía, contenido y pie. */
function plantilla({ titulo, contenido, boton }) {
  const botonHtml = boton
    ? `<p style="text-align:center;margin:28px 0"><a href="${escapar(boton.url)}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;display:inline-block">${escapar(boton.texto)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#eef4ff;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="background:linear-gradient(135deg,#1e3a8a,#2563eb);background-color:#1e40af;padding:24px;color:#ffffff">
        <div style="font-size:22px;font-weight:bold">AlDía</div>
        <div style="font-size:14px;opacity:.9">Mantenimiento de tu vehículo, siempre al día</div>
      </td></tr>
      <tr><td style="padding:24px">
        <h1 style="font-size:20px;margin:0 0 16px">${escapar(titulo)}</h1>
        ${contenido}
        ${botonHtml}
      </td></tr>
      <tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b">
        Recibes este correo porque tienes una cuenta en AlDía. Si no fuiste tú, ignóralo.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

module.exports = { enviarCorreo, correoConfigurado, plantilla, escapar };
