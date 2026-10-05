// =====================================================================
// TAREA AUTOMÁTICA DIARIA  (RF-20, actor "Sistema")
// Todos los días a las 6:00 a. m. (hora de Bogotá) y al iniciar el servidor:
//   - recalcula el desgaste de las partes de todos los vehículos,
//   - estima el kilometraje de los que no se han actualizado,
//   - y genera las alertas de partes, kilometraje y documentos.
//
// Nota: el desgaste NO se guarda en la BD; se calcula al vuelo cada vez
// que se consulta un vehículo. Esta tarea solo existe para enviar las alertas.
// =====================================================================
const cron = require('node-cron');
const vehiculosRepo = require('../modules/vehiculos/vehiculos.repository');
const { armarVehiculo } = require('../modules/vehiculos/vehiculos.service');
const { revisarVehiculo } = require('../modules/notificaciones/alertas.service');

async function ejecutar() {
  const inicio = Date.now();
  const vehiculos = await vehiculosRepo.listarTodos();
  for (const vehiculo of vehiculos) {
    try {
      await revisarVehiculo(await armarVehiculo(vehiculo));
    } catch (error) {
      // Un vehículo con problemas no detiene la revisión de los demás
      console.error(`[Tarea diaria] Error con el vehículo ${vehiculo.placa}:`, error.message);
    }
  }
  console.log(`[Tarea diaria] ${vehiculos.length} vehículos revisados en ${Date.now() - inicio} ms`);
}

function programar() {
  cron.schedule('0 6 * * *', ejecutar, { timezone: 'America/Bogota' });
  ejecutar().catch((e) => console.error('[Tarea diaria] Error:', e.message));
}

module.exports = { programar, ejecutar };
