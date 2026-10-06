// Rutas de vehículos y partes:  /api/vehiculos/...  y  /api/partes/...
const { Router } = require('express');
const { z } = require('zod');
const validar = require('../../middlewares/validar');
const { subirArchivo } = require('../../middlewares/subirArchivo');
const c = require('./vehiculos.controller');
const { registrarEnVehiculo } = require('../documentos/documentos.routes');

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida');
const anioActual = new Date().getFullYear();

// Los datos del vehículo llegan como formulario (multipart) por la foto,
// por eso se usa z.coerce para convertir los textos en números.
const datosVehiculo = {
  marca: z.string().trim().min(1, 'Escribe la marca').max(50),
  modelo: z.string().trim().min(1, 'Escribe el modelo').max(50),
  anio: z.coerce.number().int().min(1950).max(anioActual + 1, 'Año no válido'),
  placa: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{5,7}$/, 'Placa no válida (ej.: ABC123 o ABC12D)'),
  fecha_matricula: fecha,
};

// RN-05: los intervalos no pueden quedar en cero
const intervalos = {
  nombre: z.string().trim().min(2, 'Escribe el nombre de la parte').max(100),
  intervalo_km: z.coerce.number().int().positive('El intervalo en km debe ser mayor a cero').nullable(),
  intervalo_meses: z.coerce.number().int().positive('El intervalo en meses debe ser mayor a cero'),
};

const esquemas = {
  crear: z.object({
    ...datosVehiculo,
    tipo_vehiculo_id: z.coerce.number().int().positive('Elige el tipo de vehículo'),
    km_inicial: z.coerce.number().int().min(0, 'El kilometraje no puede ser negativo'),
  }),
  actualizar: z.object(datosVehiculo),
  km: z.object({
    km: z.coerce.number().int().min(0),
    confirmado: z.boolean().default(false),
  }),
  parteNueva: z.object({
    ...intervalos,
    ultimo_cambio_km: z.coerce.number().int().min(0).optional(),
    ultimo_cambio_fecha: fecha.optional(),
  }),
  parte: z.object(intervalos),
  sugerencias: z.object({ parteIds: z.array(z.number().int()) }),
  // RN-16: por cada parte, o "no lo sé" (desconocido) o el km y la fecha del último cambio
  ultimosCambios: z.object({
    partes: z.array(z.object({
      parte_id: z.number().int(),
      desconocido: z.boolean().optional(),
      km: z.number().int().min(0, 'El kilometraje no puede ser negativo').optional(),
      fecha: fecha.optional(),
    }).refine(
      (p) => p.desconocido || (p.km !== undefined && p.fecha !== undefined),
      { message: 'Indica el km y la fecha del último cambio, o marca "No lo sé"' },
    )).min(1),
  }),
  servicio: z.object({
    fecha,
    km: z.coerce.number().int().min(0),
    lugar: z.string().trim().max(120).optional().nullable(),
    cambios: z.array(z.object({
      parte_id: z.number().int(),
      costo: z.coerce.number().min(0, 'El costo no puede ser negativo'),
      marca_referencia: z.string().trim().max(120).optional().nullable(),
    })).min(1, 'Elige al menos una parte'),
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
