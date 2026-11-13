// =====================================================================
// MIGRACIONES: crea y actualiza las tablas de la base de datos.
//
// Cada tabla tiene su propio archivo SQL en database/migraciones/
// (001_crear_usuarios.sql, 002_crear_tipos_vehiculo.sql, ...).
// La tabla "migraciones" anota cuáles ya se ejecutaron, así cada archivo
// se ejecuta UNA sola vez. Para cambiar una tabla no se edita su archivo:
// se agrega una migración nueva (ej.: 013_agregar_perfil_a_usuarios.sql).
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
const CARPETA_MIGRACIONES = path.join(CARPETA_BD, 'migraciones');
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
    multipleStatements: true,  // un archivo .sql puede traer varias instrucciones
    connectTimeout: 4000,
  });
}

/** Paso 1: prueba los puertos hasta que MariaDB responda. */
async function buscarMariaDB() {
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

    // 3. Migraciones pendientes, en orden
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
