// Lee las variables del archivo .env y las expone en un solo objeto.
// Así el resto del código nunca usa process.env directamente.
require('dotenv').config();

/**
 * SSL para la base de datos. En el computador local MariaDB no lo usa;
 * los MySQL en la nube (Aiven, TiDB...) lo exigen.
 *   DB_SSL=true          activa la conexión cifrada
 *   DB_SSL_CA=-----BEGIN  certificado del proveedor (Aiven lo entrega); sin él se
 *                         usan los certificados públicos del sistema
 */
function configurarSsl() {
  if (process.env.DB_SSL !== 'true') return undefined;
  const ca = process.env.DB_SSL_CA;
  return ca ? { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true } : { rejectUnauthorized: true };
}

const config = {
  // PORT lo pone el servicio en la nube (Render) y manda sobre el PUERTO del .env;
  // en el computador local no existe PORT y se usa PUERTO
  puerto: Number(process.env.PORT || process.env.PUERTO || 4000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PUERTO || 3306),
    user: process.env.DB_USUARIO || 'root',
    password: process.env.DB_CLAVE || '',
    database: process.env.DB_NOMBRE || 'aldia',
    ssl: configurarSsl(),
  },
  jwt: {
    secreto: process.env.JWT_SECRETO || 'clave-de-desarrollo',
    expira: process.env.JWT_EXPIRA || '8h',
  },
  // Opcional: contraseña propia para el administrador al desplegar en internet
  // (la de las semillas, Admin123*, es pública porque está en el repositorio)
  admin: {
    correo: process.env.ADMIN_CORREO || 'admin@aldia.co',
    clave: process.env.ADMIN_CLAVE || '',
  },
  esProduccion: process.env.NODE_ENV === 'production',
};

module.exports = config;
