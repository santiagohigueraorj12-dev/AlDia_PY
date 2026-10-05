// Subida de archivos adjuntos (fotos, comprobantes, documentos).
// RNF-03: solo JPG, PNG o PDF de máximo 5 MB.
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const CARPETA = path.join(__dirname, '..', '..', 'uploads');
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf'];

const almacenamiento = multer.diskStorage({
  destination: CARPETA,
  // Nombre aleatorio para que no se pueda adivinar la URL de un archivo ajeno
  filename: (req, archivo, cb) => {
    const extension = path.extname(archivo.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const subirArchivo = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, archivo, cb) => {
    if (TIPOS_PERMITIDOS.includes(archivo.mimetype)) cb(null, true);
    else cb(new AppError('Solo se permiten archivos JPG, PNG o PDF'));
  },
});

/** Convierte el archivo subido en la URL pública que se guarda en la BD. */
function urlDeArchivo(archivo) {
  return archivo ? `/uploads/${archivo.filename}` : null;
}

module.exports = { subirArchivo, urlDeArchivo, CARPETA };
