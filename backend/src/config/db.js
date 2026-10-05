// Conexión a MariaDB mediante un "pool" (un grupo de conexiones reutilizables).
const mariadb = require('mariadb');
const config = require('./env');

const pool = mariadb.createPool({
  ...config.db,
  connectionLimit: 10,
  dateStrings: true,                 // las fechas llegan como texto 'AAAA-MM-DD' (evita líos de zona horaria)
  decimalAsNumber: true,             // los DECIMAL llegan como número de JavaScript
  bigIntAsNumber: true,              // los COUNT(*) e ids llegan como número
  insertIdAsNumber: true,
  initSql: "SET time_zone = '-05:00'", // hora de Bogotá (RNF-09)
});

/** Ejecuta una consulta y devuelve las filas (o el resultado del INSERT/UPDATE). */
async function query(sql, params = []) {
  return pool.query(sql, params);
}

/** Devuelve solo la primera fila de una consulta, o null si no hay resultados. */
async function queryUno(sql, params = []) {
  const filas = await pool.query(sql, params);
  return filas[0] || null;
}

/**
 * Ejecuta varias operaciones dentro de una TRANSACCIÓN (RNF-08):
 * o se guardan todas, o no se guarda ninguna.
 *
 *   await transaccion(async (conn) => {
 *     await conn.query('INSERT ...');
 *     await conn.query('UPDATE ...');
 *   });
 */
async function transaccion(trabajo) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await trabajo(conn);
    await conn.commit();
    return resultado;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, queryUno, transaccion };
