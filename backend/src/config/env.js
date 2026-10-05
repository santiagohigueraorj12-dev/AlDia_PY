// Lee las variables del archivo .env y las expone en un solo objeto.
// Así el resto del código nunca usa process.env directamente.
require('dotenv').config();

const config = {
  puerto: Number(process.env.PUERTO || 4000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PUERTO || 3306),
    user: process.env.DB_USUARIO || 'root',
    password: process.env.DB_CLAVE || '',
    database: process.env.DB_NOMBRE || 'aldia',
  },
  jwt: {
    secreto: process.env.JWT_SECRETO || 'clave-de-desarrollo',
    expira: process.env.JWT_EXPIRA || '8h',
  },
  esProduccion: process.env.NODE_ENV === 'production',
};

module.exports = config;
