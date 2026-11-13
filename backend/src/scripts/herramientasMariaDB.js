// Busca los programas de MariaDB que se usan para respaldar y restaurar:
//   mariadb-dump  -> saca una copia de la base en un archivo .sql
//   mariadb       -> ejecuta un archivo .sql (para restaurar)
// Primero mira la variable MARIADB_BIN (carpeta bin), luego las carpetas donde se
// instalan normalmente MariaDB, XAMPP y Laragon, y por último el PATH.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const EXT = process.platform === 'win32' ? '.exe' : '';

function carpetasConocidas() {
  const carpetas = [];
  if (process.env.MARIADB_BIN) carpetas.push(process.env.MARIADB_BIN);
  if (process.platform === 'win32') {
    for (const raiz of ['C:/Program Files', 'C:/Program Files (x86)']) {
      if (!fs.existsSync(raiz)) continue;
      for (const nombre of fs.readdirSync(raiz)) {
        if (/^(MariaDB|MySQL)/i.test(nombre)) carpetas.push(path.join(raiz, nombre, 'bin'));
      }
    }
    carpetas.push('C:/xampp/mysql/bin');
    const laragon = 'C:/laragon/bin/mysql';
    if (fs.existsSync(laragon)) for (const v of fs.readdirSync(laragon)) carpetas.push(path.join(laragon, v, 'bin'));
  }
  return carpetas;
}

/** Devuelve la ruta del programa (ej.: 'mariadb-dump'), o lanza un error claro. */
function buscarPrograma(...nombres) {
  for (const carpeta of carpetasConocidas()) {
    for (const n of nombres) {
      const ruta = path.join(carpeta, n + EXT);
      if (fs.existsSync(ruta)) return ruta;
    }
  }
  for (const n of nombres) {
    try { execFileSync(n, ['--version'], { stdio: 'ignore' }); return n; } catch { /* no está en el PATH */ }
  }
  throw new Error(`No se encontró ${nombres.join(' ni ')}. Escribe en backend/.env la carpeta bin de MariaDB, por ejemplo:\n  MARIADB_BIN=C:/Program Files/MariaDB 12.2/bin`);
}

module.exports = { buscarPrograma };
