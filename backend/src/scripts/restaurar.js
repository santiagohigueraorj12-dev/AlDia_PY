// =====================================================================
// RESTAURAR un respaldo de AlDía:  npm run bd:restaurar [carpeta]
// Sin carpeta usa el respaldo más reciente de respaldos/.
// ¡Reemplaza la base actual y la carpeta uploads por las del respaldo!
// Por eso pide confirmación y, antes de reemplazar, respalda el estado actual.
// =====================================================================
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn, execFileSync } = require('child_process');
const config = require('../config/env');
const { buscarMariaDB } = require('../config/prepararBD');
const { buscarPrograma } = require('./herramientasMariaDB');
const { CARPETA: UPLOADS } = require('../middlewares/subirArchivo');

const CARPETA_RESPALDOS = process.env.CARPETA_RESPALDOS || path.join(__dirname, '..', '..', '..', 'respaldos');

function elegirRespaldo() {
  const carpeta = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (carpeta) return path.resolve(carpeta);
  const carpetas = fs.existsSync(CARPETA_RESPALDOS)
    ? fs.readdirSync(CARPETA_RESPALDOS).filter((n) => /^\d{4}-\d{2}-\d{2}_\d{4}/.test(n)).sort() : [];
  if (!carpetas.length) throw new Error(`No hay respaldos en ${CARPETA_RESPALDOS}. Primero ejecuta: npm run bd:respaldar`);
  return path.join(CARPETA_RESPALDOS, carpetas.at(-1));
}

const preguntar = (texto) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(texto, (r) => { rl.close(); resolve(r.trim().toLowerCase()); });
});

/** Borra la base y la vuelve a crear ejecutando el archivo .sql del respaldo. */
function cargarSql(archivo) {
  return new Promise((resolve, reject) => {
    const cliente = buscarPrograma('mariadb', 'mysql');
    const args = [`--host=${config.db.host}`, `--port=${config.db.port}`, `--user=${config.db.user}`, '--default-character-set=utf8mb4'];
    const proceso = spawn(cliente, args, { env: { ...process.env, MYSQL_PWD: config.db.password } });
    let errores = '';
    proceso.stderr.on('data', (d) => { errores += d; });
    proceso.on('error', reject);
    proceso.on('close', (codigo) => (codigo === 0 ? resolve() : reject(new Error(errores || `mariadb terminó con código ${codigo}`))));
    proceso.stdin.write(`DROP DATABASE IF EXISTS \`${config.db.database}\`;\n`);
    fs.createReadStream(archivo).pipe(proceso.stdin);
  });
}

async function restaurar() {
  const carpeta = elegirRespaldo();
  const sql = path.join(carpeta, `${config.db.database}.sql`);
  if (!fs.existsSync(sql)) throw new Error(`No se encontró ${sql}`);

  console.log(`Se va a restaurar el respaldo: ${carpeta}`);
  console.log(`Esto REEMPLAZA la base "${config.db.database}" y la carpeta uploads actuales.`);
  if (!process.argv.includes('--si') && (await preguntar('¿Continuar? Escribe "si": ')) !== 'si') {
    console.log('Cancelado. No se cambió nada.');
    return;
  }

  (await buscarMariaDB()).end();
  console.log('1/3 Respaldo de seguridad del estado actual...');
  execFileSync(process.execPath, [path.join(__dirname, 'respaldar.js')], { stdio: 'inherit' });

  console.log('2/3 Restaurando la base de datos...');
  await cargarSql(sql);

  console.log('3/3 Restaurando los archivos subidos...');
  const respaldoUploads = path.join(carpeta, 'uploads');
  if (fs.existsSync(respaldoUploads)) {
    fs.rmSync(UPLOADS, { recursive: true, force: true });
    fs.cpSync(respaldoUploads, UPLOADS, { recursive: true });
  }
  console.log('Restauración terminada. Reinicia el backend para que use los datos restaurados.');
}

restaurar().catch((e) => { console.error('No se pudo restaurar:\n', e.message); process.exit(1); });
