// Punto de entrada del backend:  npm run dev
const config = require('./config/env');
const { prepararBaseDeDatos } = require('./config/prepararBD');

async function iniciar() {
  // Antes de aceptar peticiones: buscar MariaDB y crear la base si hace falta
  try {
    await prepararBaseDeDatos();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  // Se cargan después, porque al cargarse crean el pool de conexiones
  // con el puerto que encontró prepararBaseDeDatos()
  const app = require('./app');
  const tareaDiaria = require('./jobs/tareaDiaria');

  app.listen(config.puerto, () => {
    console.log(`API de AlDía escuchando en http://localhost:${config.puerto}`);
    tareaDiaria.programar();
  });
}

iniciar();
