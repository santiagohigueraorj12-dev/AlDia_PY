// Punto de entrada del backend:  npm run dev
const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/db');
const tareaDiaria = require('./jobs/tareaDiaria');

async function iniciar() {
  // Verifica la conexión a MariaDB antes de aceptar peticiones
  try {
    const conn = await pool.getConnection();
    conn.release();
  } catch (error) {
    console.error('No se pudo conectar a MariaDB. Revisa el archivo .env y que la base "aldia" exista.');
    console.error(error.message);
    process.exit(1);
  }

  app.listen(config.puerto, () => {
    console.log(`API de AlDía escuchando en http://localhost:${config.puerto}`);
    tareaDiaria.programar();
  });
}

iniciar();
