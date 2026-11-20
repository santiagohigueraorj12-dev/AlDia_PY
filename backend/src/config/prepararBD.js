// =====================================================================
// estructuraBD: crea y actualiza las tablas de la base de datos.
//
// El esquema se organiza en dos archivos ordenados:
// 001_crear_tablas.sql crea las tablas y 002_actualizar_tablas.sql las modifica.
// La tabla "migraciones" anota cuáles ya se ejecutaron. Los CREATE usan
// IF NOT EXISTS y los cambios de 002 son repetibles para bases existentes.
// Las futuras modificaciones se agregan en nuevas migraciones numeradas.
//
// Se ejecuta solo al encender el backend (npm run dev), o a mano con:
//   npm run bd:migrar
//
// Pasos:
//  1. Busca MariaDB: el puerto del .env y, si no responde, los más
//     comunes (3306 de XAMPP/Laragon y 3320).
//  2. Crea la base "aldia" si no existe.
//  3. Ejecuta las migraciones pendientes, en orden.
//  4. Si la base es nueva, carga las semillas (database/semillas/):
//     catálogos, usuario administrador y datos de demostración.
// =====================================================================
const fs = require('fs');
const path = require('path');
const mariadb = require('mariadb');
const config = require('./env');

const CARPETA_BD = path.join(__dirname, '..', '..', '..', 'database');
const CARPETA_MIGRACIONES = path.join(CARPETA_BD, 'estructuraBD');
const CARPETA_SEMILLAS = path.join(CARPETA_BD, 'semillas');
const PUERTOS_COMUNES = [3306, 3320];

/** Archivos .sql de una carpeta, en orden por su número. */
function archivosSql(carpeta) {
  return fs.readdirSync(carpeta).filter((f) => f.endsWith('.sql')).sort();
}

/** Intenta conectarse a MariaDB (todavía sin elegir la base) en un puerto. */
function conectar(puerto) {
  return mariadb.createConnection({
    host: config.db.host,
    port: puerto,
    user: config.db.user,
    password: config.db.password,
    ssl: config.db.ssl,        // solo en la nube (DB_SSL=true)
    multipleStatements: true,  // un archivo .sql puede traer varias instrucciones
    // en la nube la conexión cifrada tarda más que en el computador local
    connectTimeout: config.db.ssl ? 15000 : 4000,
  });
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/** En la nube: solo el puerto configurado, con varios reintentos (la base puede estar despertando). */
async function conectarEnLaNube() {
  const INTENTOS = 5;
  for (let intento = 1; ; intento += 1) {
    try {
      return await conectar(config.db.port);
    } catch (error) {
      console.log(`Intento ${intento}/${INTENTOS} de conexión a ${config.db.host}:${config.db.port} falló: ${error.message}`);
      if (intento === INTENTOS) {
        throw new Error(
          `No se pudo conectar a la base de datos en la nube (${config.db.host}:${config.db.port}).\n`
          + '  - Revisa que el servicio MySQL de Aiven esté encendido (Running).\n'
          + '  - Revisa DB_HOST, DB_PUERTO, DB_USUARIO, DB_CLAVE y DB_SSL_CA en Environment.\n'
          + `  Detalle: ${error.message}`,
        );
      }
      await esperar(5000);
    }
  }
}

/** Paso 1: prueba los puertos hasta que MariaDB responda. */
async function buscarMariaDB() {
  if (config.db.ssl) return conectarEnLaNube();
  const puertos = [...new Set([config.db.port, ...PUERTOS_COMUNES])];
  let ultimoError = null;
  for (const puerto of puertos) {
    try {
      const conn = await conectar(puerto);
      if (puerto !== config.db.port) console.log(`MariaDB no respondió en el puerto ${config.db.port}; se usará el ${puerto}.`);
      config.db.port = puerto;  // el pool de conexiones (db.js) usará este puerto
      return conn;
    } catch (error) {
      ultimoError = error;
    }
  }
  throw new Error(
    `No se pudo conectar a MariaDB (se probaron los puertos ${puertos.join(', ')}).\n`
    + '  - Revisa que MariaDB esté encendido (XAMPP: botón "Start" de MySQL; HeidiSQL: que puedas conectarte).\n'
    + '  - Si usa otro puerto, usuario o contraseña, escríbelos en backend/.env (copia backend/.env.example).\n'
    + `  Detalle: ${ultimoError.message}`,
  );
}

/** ¿Existe esta tabla en la base de datos? */
async function existeTabla(conn, tabla) {
  const [fila] = await conn.query(
    'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
    [config.db.database, tabla],
  );
  return Number(fila.n) > 0;
}

async function prepararBaseDeDatos() {
  const conn = await buscarMariaDB();
  try {
    // 2. Crear la base de datos si no existe
    const base = config.db.database;
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${base}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${base}\``);

    // Tabla donde se anota qué migraciones ya se ejecutaron
    await conn.query(`CREATE TABLE IF NOT EXISTS migraciones (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      archivo       VARCHAR(150) NOT NULL UNIQUE,
      ejecutada_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    const esNueva = !(await existeTabla(conn, 'usuarios'));
    const yaEjecutadas = new Set((await conn.query('SELECT archivo FROM migraciones')).map((f) => f.archivo));

    // 3. Crear las tablas y luego aplicar sus modificaciones, en orden numérico
    for (const archivo of archivosSql(CARPETA_MIGRACIONES)) {
      if (yaEjecutadas.has(archivo)) continue;

      // Bases creadas antes de las migraciones: si la tabla ya existe, solo se anota
      const tabla = archivo.match(/^\d+_crear_(\w+)\.sql$/)?.[1];
      if (tabla && (await existeTabla(conn, tabla))) {
        await conn.query('INSERT INTO migraciones (archivo) VALUES (?)', [archivo]);
        continue;
      }

      await conn.query(fs.readFileSync(path.join(CARPETA_MIGRACIONES, archivo), 'utf8'));
      await conn.query('INSERT INTO migraciones (archivo) VALUES (?)', [archivo]);
      console.log(`  ✔ Migración ${archivo}`);
    }

    // 4. Semillas: solo la primera vez, cuando la base se acaba de crear
    if (esNueva) {
      for (const archivo of archivosSql(CARPETA_SEMILLAS)) {
        await conn.query(fs.readFileSync(path.join(CARPETA_SEMILLAS, archivo), 'utf8'));
        console.log(`  ✔ Semilla ${archivo}`);
      }
      console.log('Base de datos lista. Usuario demo: demo@aldia.co / Demo123*  ·  Administrador: admin@aldia.co / Admin123*');
    }

    // 5. Contraseña propia del administrador (ADMIN_CLAVE), para no dejar la pública en internet
    if (config.admin.clave) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(config.admin.clave, 10);
      const r = await conn.query(
        "UPDATE usuarios SET password_hash = ?, correo = ? WHERE rol = 'admin' AND (correo = ? OR correo = 'admin@aldia.co')",
        [hash, config.admin.correo, config.admin.correo],
      );
      if (r.affectedRows) console.log(`  ✔ Contraseña del administrador (${config.admin.correo}) actualizada desde ADMIN_CLAVE`);
    }
  } finally {
    await conn.end();
  }
}

// "npm run bd:migrar": ejecuta las migraciones sin encender el servidor
if (require.main === module) {
  prepararBaseDeDatos()
    .then(() => console.log('Migraciones al día.'))
    .catch((error) => { console.error(error.message); process.exit(1); });
}

module.exports = { prepararBaseDeDatos, buscarMariaDB };
