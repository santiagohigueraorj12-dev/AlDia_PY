// Entrega los archivos adjuntos guardados en la base de datos (tabla "archivos").
//   GET /api/archivos/:id
// Es pública como lo era la carpeta /uploads: el id es un UUID aleatorio imposible
// de adivinar, y así las fotos se pueden mostrar con <Image> sin enviar el token.
const express = require('express');
const { queryUno } = require('../../config/db');

const router = express.Router();
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/:id', async (req, res) => {
  if (!FORMATO_UUID.test(req.params.id)) return res.status(404).json({ error: 'Archivo no encontrado' });
  const archivo = await queryUno('SELECT nombre, tipo, datos FROM archivos WHERE id = ?', [req.params.id]);
  if (!archivo) return res.status(404).json({ error: 'Archivo no encontrado' });

  res.set({
    'Content-Type': archivo.tipo,
    // inline: el navegador lo muestra (foto o PDF) en vez de descargarlo
    'Content-Disposition': `inline; filename="${encodeURIComponent(archivo.nombre)}"`,
    'Cache-Control': 'private, max-age=31536000, immutable',  // un archivo nunca cambia
  });
  res.send(archivo.datos);
});

module.exports = router;
