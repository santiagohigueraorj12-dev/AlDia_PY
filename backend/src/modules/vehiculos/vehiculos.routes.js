// Rutas de vehículos y partes:  /api/vehiculos/...  y  /api/partes/...
const { Router } = require('express');
const validar = require('../../middlewares/validar');
const { subirArchivo } = require('../../middlewares/subirArchivo');
const {
  z, texto, textoOpcional, entero, fecha, aEntero,
} = require('../../utils/validaciones');
const c = require('./vehiculos.controller');
const { registrarEnVehiculo } = require('../documentos/documentos.routes');

const anioActual = new Date().getFullYear();

// Placa: se quitan espacios y guiones ("abc-123" -> "ABC123")
const placa = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/[\s-]/g, '').toUpperCase() : v),
  z.string({ required_error: 'Escribe la placa' })
    .min(1, 'Escribe la placa')
    .regex(/^[A-Z0-9]{5,7}$/, 'La placa no es válida (ej.: ABC123 para carro o ABC12D para moto)'),
);

const datosVehiculo = {
  marca: texto('la marca', { max: 50 }),
  modelo: texto('el modelo', { max: 50 }),
  anio: entero('el año', { min: 1950, max: anioActual + 1 }),
  placa,
  fecha_matricula: fecha('la fecha de matrícula', { noFutura: true }),
};

// RN-05: los intervalos no pueden quedar en cero
const intervalos = {
  nombre: texto('el nombre de la parte', { min: 2, max: 100 }),
  intervalo_km: entero('el intervalo en km', { min: 1, vacioEsNulo: true }),  // null = solo por tiempo
  intervalo_meses: entero('el intervalo en meses', { min: 1, max: 240 }),
};

const esquemas = {
  crear: z.object({
    ...datosVehiculo,
    tipo_vehiculo_id: z.preprocess(aEntero, z.number({
      required_error: 'Elige si es moto o carro', invalid_type_error: 'Elige si es moto o carro',
    }).int().positive('Elige si es moto o carro')),
    km_inicial: entero('el kilometraje actual'),
  }),
  actualizar: z.object(datosVehiculo),
  km: z.object({
    km: entero('el kilometraje'),
    confirmado: z.boolean().default(false),
  }),
  parteNueva: z.object({
    ...intervalos,
    ultimo_cambio_km: entero('el kilometraje del último cambio', { opcional: true }),
    ultimo_cambio_fecha: fecha('la fecha del último cambio', { opcional: true, noFutura: true }),
  }),
  parte: z.object(intervalos),
  sugerencias: z.object({ parteIds: z.array(z.number().int()) }),
  // RN-16: por cada parte, o "no lo sé" (desconocido) o el km y la fecha del último cambio
  ultimosCambios: z.object({
    partes: z.array(z.object({
      parte_id: z.number().int(),
      desconocido: z.boolean().optional(),
      km: entero('el kilometraje', { opcional: true }),
      fecha: fecha('la fecha', { opcional: true }),
    }).superRefine((p, ctx) => {
      if (p.desconocido) return;
      // El error se marca en el campo que falta, para mostrarlo debajo de él
      if (p.km === undefined) ctx.addIssue({ code: 'custom', path: ['km'], message: 'Escribe el kilometraje' });
      if (p.fecha === undefined) ctx.addIssue({ code: 'custom', path: ['fecha'], message: 'Elige la fecha' });
    })).min(1),
  }),
  servicio: z.object({
    fecha: fecha('la fecha del servicio', { noFutura: true }),
    km: entero('el kilometraje'),
    lugar: textoOpcional('el lugar', { max: 120 }),
    cambios: z.array(z.object({
      parte_id: z.number().int(),
      costo: entero('el costo', { opcional: true }).transform((v) => v ?? 0),  // vacío = $0
      marca_referencia: textoOpcional('la marca', { max: 120 }),
    }), { required_error: 'Elige al menos una parte' }).min(1, 'Elige al menos una parte'),
  }),
};

const vehiculos = Router();

vehiculos.get('/', c.listar);
vehiculos.post('/', subirArchivo.single('foto'), validar(esquemas.crear), c.crear);
vehiculos.get('/:id', c.detalle);
vehiculos.put('/:id', subirArchivo.single('foto'), validar(esquemas.actualizar), c.actualizar);
vehiculos.delete('/:id', c.eliminar);
vehiculos.get('/:id/hoja-de-vida', c.hojaDeVida);    // RF-11

// Kilometraje (RF-05)
vehiculos.post('/:id/kilometraje', validar(esquemas.km), c.actualizarKm);
vehiculos.get('/:id/kilometraje', c.lecturas);

// Plan de partes (RF-07)
vehiculos.post('/:id/partes', validar(esquemas.parteNueva), c.agregarParte);
vehiculos.put('/:id/ultimos-cambios', validar(esquemas.ultimosCambios), c.fijarUltimosCambios);  // RN-16

// Servicios / cambios de partes (RF-08, RF-09)
vehiculos.post('/:id/servicios/sugerencias', validar(esquemas.sugerencias), c.sugerencias);  // RN-10
vehiculos.post('/:id/servicios', validar(esquemas.servicio), c.registrarServicio);
vehiculos.get('/:id/servicios', c.historial);

// Documentos del vehículo (RF-12)
vehiculos.post('/:id/documentos', ...registrarEnVehiculo);

const partes = Router();

partes.put('/:id', validar(esquemas.parte), c.actualizarParte);
partes.delete('/:id', c.quitarParte);
partes.get('/:id/historial', c.historialParte);

module.exports = { vehiculos, partes };
