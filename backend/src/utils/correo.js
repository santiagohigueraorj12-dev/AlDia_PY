// =====================================================================
// Envío de correos de AlDía (recuperar contraseña y resumen diario de avisos).
//
// Los correos salen por la API de Gmail (Google Cloud): el correo sale por los
// servidores de Gmail con la dirección del remitente autorizada, así que llega
// a la bandeja de entrada (no a spam). Gratis, hasta ~500 correos al día.
//       GMAIL_CLIENT_ID       ID de cliente OAuth (Google Cloud → Credenciales)
//       GMAIL_CLIENT_SECRET   secreto de ese cliente
//       GMAIL_REFRESH_TOKEN   token de actualización (OAuth Playground)
//       CORREO_REMITENTE      el Gmail que autorizó el token
//
//  Sin esos datos, el correo solo se escribe en la consola (computador local).
//
// Se usa HTTPS y no SMTP porque los servidores gratuitos en la nube suelen
// bloquear los puertos de correo.
//   URL_APP   dirección pública para los enlaces (en Render: RENDER_EXTERNAL_URL)
// =====================================================================
const config = require('../config/env');

function proveedor() {
  const { gmail, remitente } = config.correo;
  if (!remitente) return null;
  if (gmail.clientId && gmail.clientSecret && gmail.refreshToken) return 'gmail';
  return null;
}

/** ¿Hay datos para enviar correos de verdad? */
function correoConfigurado() {
  return proveedor() !== null;
}

// ---------------------------------------------------------------------
// Gmail
// ---------------------------------------------------------------------
let tokenGmail = { valor: null, venceEn: 0 };

/** Pide a Google un token de acceso (dura ~1 hora) usando el token de actualización. */
async function tokenDeAccesoGmail() {
  if (tokenGmail.valor && Date.now() < tokenGmail.venceEn) return tokenGmail.valor;
  const { clientId, clientSecret, refreshToken } = config.correo.gmail;
  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token',
    }),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(`Google no entregó el token (${respuesta.status}): ${datos.error_description || datos.error || ''}`);
  tokenGmail = { valor: datos.access_token, venceEn: Date.now() + (datos.expires_in - 60) * 1000 };
  return tokenGmail.valor;
}

/** Texto con tildes y ñ en un encabezado de correo (RFC 2047). */
const encabezadoUtf8 = (texto) => `=?UTF-8?B?${Buffer.from(texto, 'utf8').toString('base64')}?=`;
/** Base64 en líneas de 76 caracteres, como exige el formato de correo. */
const base64EnLineas = (texto) => Buffer.from(texto, 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');

/** Arma el correo completo (formato MIME) con versión de texto y versión HTML. */
function armarMensaje({ para, nombre, asunto, html, texto }) {
  const limite = `aldia-${Date.now().toString(36)}`;
  return [
    `From: ${encabezadoUtf8('AlDía')} <${config.correo.remitente}>`,
    `To: ${nombre ? `${encabezadoUtf8(nombre)} ` : ''}<${para}>`,
    `Subject: ${encabezadoUtf8(asunto)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${limite}"`,
    '',
    `--${limite}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64EnLineas(texto),
    `--${limite}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64EnLineas(html),
    `--${limite}--`,
  ].join('\r\n');
}

async function enviarConGmail(mensaje) {
  const token = await tokenDeAccesoGmail();
  const respuesta = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw: Buffer.from(armarMensaje(mensaje), 'utf8').toString('base64url') }),
  });
  if (!respuesta.ok) throw new Error(`Gmail respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 200)}`);
}

// ---------------------------------------------------------------------

/** Versión en texto plano del HTML (los filtros de spam desconfían de correos solo HTML). */
function htmlATexto(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2: $1')
    .replace(/<(br|\/p|\/tr|\/h1|\/div)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*/g, '\n\n')
    .trim();
}

/**
 * Envía un correo. Devuelve true si salió, false si no (nunca lanza error:
 * un correo que falla no debe tumbar la recuperación ni la tarea diaria).
 */
async function enviarCorreo({ para, nombre, asunto, html }) {
  const via = proveedor();
  if (!via) {
    console.log(`[Correo sin enviar: Gmail no está configurado] Para: ${para} · Asunto: ${asunto}`);
    return false;
  }
  const mensaje = { para, nombre, asunto, html, texto: htmlATexto(html) };
  try {
    await enviarConGmail(mensaje);
    return true;
  } catch (error) {
    console.error(`[Correo] No se pudo enviar con ${via}:`, error.message);
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
      <tr><td style="background:linear-gradient(135deg,#1e3a8a,#2563eb);background-color:#1e40af;padding:20px 24px;color:#ffffff">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:12px"><img src="${escapar(config.urlApp)}/logo.png" width="48" height="48" alt="AlDía" style="display:block;border-radius:12px"></td>
          <td><div style="font-size:22px;font-weight:bold">AlDía</div>
            <div style="font-size:14px;opacity:.9">Tu vehículo, siempre al día</div></td>
        </tr></table>
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

module.exports = { enviarCorreo, correoConfigurado, plantilla, escapar, armarMensaje, htmlATexto };
