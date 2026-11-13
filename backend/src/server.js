// Punto de entrada del backend:  npm run dev
const config = require('./config/env');
const { prepararBaseDeDatos } = require('./config/prepararBD');

async function iniciar() {
  // En producción no se permite la clave de desarrollo: cualquiera podría falsificar tokens
  if (config.esProduccion && (!process.env.JWT_SECRETO || process.env.JWT_SECRETO.startsWith('cambia-esta'))) {
    console.error('En producción debes poner una JWT_SECRETO propia, larga y aleatoria, en backend/.env');
    process.exit(1);
  }

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
    if (config.esProduccion) console.log('Modo producción: la app web se abre en esa misma dirección.');
    tareaDiaria.programar();
  });
}

iniciar();
