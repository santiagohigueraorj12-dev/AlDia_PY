// Pruebas del armado de correos (utils/correo.js), sin enviar nada de verdad.
const { test } = require('node:test');
const assert = require('node:assert');

process.env.CORREO_REMITENTE = 'aldia.app@gmail.com';
const { armarMensaje, htmlATexto, escapar } = require('../src/utils/correo');

const decodificarParte = (mensaje, tipo) => {
  const parte = mensaje.split(/--aldia-[a-z0-9]+/).find((p) => p.includes(`Content-Type: ${tipo}`));
  const cuerpo = parte.split('\r\n\r\n')[1].replace(/\r\n/g, '');
  return Buffer.from(cuerpo, 'base64').toString('utf8');
};

test('armarMensaje: encabezados con tildes codificados y remitente correcto', () => {
  const m = armarMensaje({ para: 'laura@correo.com', nombre: 'Laura Gómez', asunto: 'Tu SOAT vence pronto', html: '<p>Hola</p>', texto: 'Hola' });
  assert.match(m, /^From: =\?UTF-8\?B\?.+\?= <aldia\.app@gmail\.com>/);
  assert.match(m, /To: =\?UTF-8\?B\?.+\?= <laura@correo\.com>/);
  const asunto = m.match(/Subject: =\?UTF-8\?B\?(.+)\?=/)[1];
  assert.strictEqual(Buffer.from(asunto, 'base64').toString('utf8'), 'Tu SOAT vence pronto');
});

test('armarMensaje: trae versión de texto y versión HTML con la ñ intacta', () => {
  const m = armarMensaje({ para: 'a@b.co', asunto: 'Contraseña', html: '<p>Año y señal</p>', texto: 'Año y señal' });
  assert.match(m, /multipart\/alternative/);
  assert.strictEqual(decodificarParte(m, 'text/plain'), 'Año y señal');
  assert.strictEqual(decodificarParte(m, 'text/html'), '<p>Año y señal</p>');
});

test('htmlATexto: quita etiquetas y deja el enlace del botón visible', () => {
  const texto = htmlATexto('<h1>Hola</h1><p>Tu &amp; vehículo</p><a href="https://aldia.co/x">Abrir AlDía</a>');
  assert.match(texto, /Hola/);
  assert.match(texto, /Tu & vehículo/);
  assert.match(texto, /Abrir AlDía: https:\/\/aldia\.co\/x/);
  assert.doesNotMatch(texto, /</);
});

test('escapar: evita que un nombre con HTML rompa el correo', () => {
  assert.strictEqual(escapar('<b>Ana</b> & "Leo"'), '&lt;b&gt;Ana&lt;/b&gt; &amp; &quot;Leo&quot;');
});
