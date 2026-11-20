// Subida de archivos adjuntos (fotos, comprobantes, documentos).
// RNF-03: solo JPG, PNG o PDF de máximo 5 MB.
//
// Los archivos se guardan en la tabla "archivos" de la base de datos y no en el
// disco: en la nube (Render) el disco se borra cada vez que el servidor reinicia.
// Se sirven en /api/archivos/<id> (ver modules/archivos).
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// Carpeta de los archivos antiguos (antes se guardaban en el disco); se sigue
// sirviendo en /uploads para que los adjuntos viejos del computador local no se pierdan.
const CARPETA = path.join(__dirname, '..', '..', 'uploads');
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf'];
const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.pdf'];
const TIPO_POR_EXTENSION = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf' };

/**
 * ¿El archivo es JPG, PNG o PDF?
 * Algunos celulares envían el archivo sin tipo ("application/octet-stream");
 * en ese caso se decide por la extensión del nombre.
 */
function esPermitido(archivo) {
  if (TIPOS_PERMITIDOS.includes(archivo.mimetype)) return true;
  const sinTipo = !archivo.mimetype || archivo.mimetype === 'application/octet-stream';
  return sinTipo && EXTENSIONES_PERMITIDAS.includes(path.extname(archivo.originalname).toLowerCase());
}

// El archivo queda en memoria (req.file.buffer) y de ahí pasa a la base de datos
const recibirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, archivo, cb) => {
    if (esPermitido(archivo)) cb(null, true);
    else cb(new AppError('Solo se permiten archivos JPG, PNG o PDF'));
  },
});

/** Guarda el archivo recibido en la tabla "archivos" y anota su dirección en req.file.url. */
async function guardarEnBaseDeDatos(req, res, next) {
  if (!req.file) return next();
  try {
    const id = crypto.randomUUID();  // aleatorio: no se puede adivinar la dirección de un archivo ajeno
    const extension = path.extname(req.file.originalname).toLowerCase();
    const tipo = TIPOS_PERMITIDOS.includes(req.file.mimetype) ? req.file.mimetype : TIPO_POR_EXTENSION[extension];
    await query(
      'INSERT INTO archivos (id, usuario_id, nombre, tipo, tamano, datos) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.usuario?.id ?? null, req.file.originalname.slice(0, 255), tipo, req.file.size, req.file.buffer],
    );
    req.file.url = `/api/archivos/${id}`;
    next();
  } catch (error) {
    next(error);
  }
}

// Se usa igual que multer: subirArchivo.single('foto') en la ruta
const subirArchivo = {
  single: (campo) => [recibirArchivo.single(campo), guardarEnBaseDeDatos],
};

/** Dirección del archivo subido, que se guarda en la BD (foto_url, archivo_url). */
function urlDeArchivo(archivo) {
  return archivo?.url || null;
}

module.exports = { subirArchivo, urlDeArchivo, CARPETA };
