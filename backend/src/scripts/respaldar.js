// =====================================================================
// RESPALDO de AlDía (plan de respaldo):  npm run bd:respaldar
// Crea la carpeta respaldos/AAAA-MM-DD_HHMM con:
//   - aldia.sql   copia completa de la base (tablas, datos y migraciones aplicadas)
//   - uploads/    fotos de vehículos y documentos adjuntos
// Deja solo los últimos N respaldos (RESPALDOS_A_GUARDAR, por defecto 14).
// =====================================================================
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config/env');
const { buscarMariaDB } = require('../config/prepararBD');
const { buscarPrograma } = require('./herramientasMariaDB');
const { CARPETA: UPLOADS } = require('../middlewares/subirArchivo');

const CARPETA_RESPALDOS = process.env.CARPETA_RESPALDOS || path.join(__dirname, '..', '..', '..', 'respaldos');
const A_GUARDAR = Number(process.env.RESPALDOS_A_GUARDAR || 14);
const NOMBRE_RESPALDO = /^\d{4}-\d{2}-\d{2}_\d{4}$/;

const dos = (n) => String(n).padStart(2, '0');
function marcaDeTiempo(d = new Date()) {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}_${dos(d.getHours())}${dos(d.getMinutes())}`;
}

/** Ejecuta mariadb-dump y guarda lo que imprime en el archivo .sql. */
function volcarBase(archivo) {
  return new Promise((resolve, reject) => {
    const dump = buscarPrograma('mariadb-dump', 'mysqldump');
    const args = [
      `--host=${config.db.host}`, `--port=${config.db.port}`, `--user=${config.db.user}`,
      '--single-transaction',               // copia coherente sin bloquear la app
      '--routines', '--triggers', '--default-character-set=utf8mb4',
      '--databases', config.db.database,    // incluye CREATE DATABASE y USE
    ];
    // La contraseña va en una variable de entorno, no en la línea de comandos
    const proceso = spawn(dump, args, { env: { ...process.env, MYSQL_PWD: config.db.password } });
    const salida = fs.createWriteStream(archivo);
    let errores = '';
    proceso.stdout.pipe(salida);
    proceso.stderr.on('data', (d) => { errores += d; });
    proceso.on('error', reject);
    proceso.on('close', (codigo) => salida.end(() => (codigo === 0 ? resolve() : reject(new Error(errores || `mariadb-dump terminó con código ${codigo}`)))));
  });
}

/** Borra los respaldos más viejos y deja solo los últimos A_GUARDAR. */
function limpiarViejos() {
  const carpetas = fs.readdirSync(CARPETA_RESPALDOS).filter((n) => NOMBRE_RESPALDO.test(n)).sort();
  for (const vieja of carpetas.slice(0, Math.max(0, carpetas.length - A_GUARDAR))) {
    fs.rmSync(path.join(CARPETA_RESPALDOS, vieja), { recursive: true, force: true });
    console.log('  Respaldo viejo borrado:', vieja);
  }
}

async function respaldar() {
  (await buscarMariaDB()).end();  // confirma que MariaDB responde y en qué puerto
  let destino = path.join(CARPETA_RESPALDOS, marcaDeTiempo());
  if (fs.existsSync(destino)) destino += `-${Date.now() % 100000}`;  // dos respaldos en el mismo minuto
  fs.mkdirSync(destino, { recursive: true });

  const sql = path.join(destino, `${config.db.database}.sql`);
  await volcarBase(sql);
  if (fs.existsSync(UPLOADS)) fs.cpSync(UPLOADS, path.join(destino, 'uploads'), { recursive: true });

  const kb = Math.round(fs.statSync(sql).size / 1024);
  const archivos = fs.existsSync(UPLOADS) ? fs.readdirSync(UPLOADS).length : 0;
  console.log(`Respaldo listo en ${destino}\n  Base de datos: ${kb} KB · Archivos subidos: ${archivos}`);
  limpiarViejos();
}

respaldar().catch((e) => { console.error('No se pudo hacer el respaldo:\n', e.message); process.exit(1); });
