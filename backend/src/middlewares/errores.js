// Manejo central de errores: cualquier error lanzado en rutas, controladores
// o servicios termina aquí y se responde como JSON { error: '...' }.
const AppError = require('../utils/AppError');
const multer = require('multer');

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, ...(err.extra || {}) });
  }

  // Errores de subida de archivos (RNF-03)
  if (err instanceof multer.MulterError) {
    const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo no puede pesar más de 5 MB' : err.message;
    return res.status(400).json({ error: mensaje });
  }

  // Registro duplicado en la BD (ej.: placa o correo repetido)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Ocurrió un error inesperado. Intenta de nuevo.' });
}

function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `La ruta ${req.method} ${req.originalUrl} no existe` });
}

module.exports = { manejadorErrores, rutaNoEncontrada };
