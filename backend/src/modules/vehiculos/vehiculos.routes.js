// Rutas de vehículos y partes:  /api/vehiculos/...  y  /api/partes/...
const { Router } = require('express');
const validar = require('../../middlewares/validar');
const { subirArchivo } = require('../../middlewares/subirArchivo');
const {
  z, texto, textoOpcional, entero, fecha, aEntero, correo, passwordActual,
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
  linea: texto('la línea', { max: 50 }),
  modelo: entero('el modelo', { min: 1950, max: anioActual + 1 }),
  placa,
  fecha_matricula: fecha('la fecha de matrícula', { noFutura: true }),
  // RN-05: solo motos. 'cambios' (con cadena) o 'automatica' (scooter con correa CVT)
  subtipo: z.preprocess((v) => (v === '' || v === 'null' ? undefined : v), z.enum(['cambios', 'automatica'], { errorMap: () => ({ message: 'Elige si la moto es de cambios o automática' }) }).optional()),
  // RN-22: cilindraje (opcional), para saber si una moto paga impuesto vehicular
  cilindraje: entero('el cilindraje', { min: 49, max: 8000, opcional: true }),
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
  // RN-16: por cada parte, "no lo sé" (desconocido), "nunca se ha cambiado" (nunca) o el km y la fecha del último cambio
  ultimosCambios: z.object({
    partes: z.array(z.object({
      parte_id: z.number().int(),
      desconocido: z.boolean().optional(),
      nunca: z.boolean().optional(),
      km: entero('el kilometraje', { opcional: true }),
      fecha: fecha('la fecha', { opcional: true }),
    }).superRefine((p, ctx) => {
      if (p.desconocido || p.nunca) return;
      // El error se marca en el campo que falta, para mostrarlo debajo de él
      if (p.km === undefined) ctx.addIssue({ code: 'custom', path: ['km'], message: 'Escribe el kilometraje' });
      if (p.fecha === undefined) ctx.addIssue({ code: 'custom', path: ['fecha'], message: 'Elige la fecha' });
    })).min(1),
  }),
  // RN-20: mes de la próxima revisión ('AAAA-MM'); el rango se valida en domain/desgaste.js
  revision: z.object({
    mes: z.string({ required_error: 'Elige el mes de la próxima revisión' }).min(1, 'Elige el mes de la próxima revisión'),
    nota: textoOpcional('la nota', { max: 255 }),
  }),
  // RF-28: novedad (daño, golpe u otra). Llega como FormData porque puede traer una foto.
  novedad: z.object({
    tipo: z.enum(['dano', 'accidente', 'otro'], { errorMap: () => ({ message: 'Elige qué pasó' }) }),
    parte_id: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : aEntero(v)), z.number().int().positive().optional()),
    titulo: textoOpcional('qué se dañó', { max: 120 }),
    descripcion: textoOpcional('la descripción', { max: 1000 }),
    fecha: fecha('la fecha', { noFutura: true }),
    km: entero('el kilometraje'),
    arreglada: z.preprocess((v) => v === true || v === 'true', z.boolean()).default(false),
    impide_circular: z.preprocess((v) => v === true || v === 'true', z.boolean()).default(false),  // RN-21
    arreglo_fecha: fecha('la fecha del arreglo', { opcional: true, noFutura: true }),
    arreglo_km: entero('el kilometraje del arreglo', { opcional: true }),
    lugar: textoOpcional('el lugar', { max: 120 }),
    costo: entero('el costo', { opcional: true }),
    marca_referencia: textoOpcional('la marca', { max: 120 }),
  }),
  // Editar un daño (FormData: puede traer una foto nueva)
  edicionNovedad: z.object({
    tipo: z.enum(['dano', 'accidente', 'otro'], { errorMap: () => ({ message: 'Elige qué pasó' }) }),
    impide_circular: z.preprocess((v) => v === true || v === 'true', z.boolean()).default(false),
    titulo: textoOpcional('qué se dañó', { max: 120 }),
    descripcion: textoOpcional('la descripción', { max: 1000 }),
    fecha: fecha('la fecha', { noFutura: true }),
    km: entero('el kilometraje'),
    arreglo_fecha: fecha('la fecha del arreglo', { opcional: true, noFutura: true }),
    arreglo_km: entero('el kilometraje del arreglo', { opcional: true }),
    lugar: textoOpcional('el lugar', { max: 120 }),
    costo: entero('el costo', { opcional: true }),
  }),
  // RF-29: correo del nuevo dueño y contraseña del dueño actual
  transferencia: z.object({ correo: correo(), password: passwordActual('Escribe tu contraseña para confirmar') }),
  arreglo: z.object({
    fecha: fecha('la fecha del arreglo', { noFutura: true }),
    km: entero('el kilometraje'),
    lugar: textoOpcional('el lugar', { max: 120 }),
    costo: entero('el costo', { opcional: true }).transform((v) => v ?? 0),
    marca_referencia: textoOpcional('la marca', { max: 120 }),
  }),
  // RF-30: llega como FormData cuando trae la factura; entonces "cambios" viene como texto JSON
  servicio: z.object({
    fecha: fecha('la fecha del servicio', { noFutura: true }),
    km: entero('el kilometraje'),
    lugar: textoOpcional('el lugar', { max: 120 }),
    cambios: z.preprocess((v) => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return v; } }, z.array(z.object({
      parte_id: z.number().int(),
      costo: entero('el costo', { opcional: true }).transform((v) => v ?? 0),  // vacío = $0
      marca_referencia: textoOpcional('la marca', { max: 120 }),
    }), { required_error: 'Elige al menos una parte' }).min(1, 'Elige al menos una parte')),
  }),
};

const vehiculos = Router();

vehiculos.get('/', c.listar);
vehiculos.post('/', subirArchivo.single('foto'), validar(esquemas.crear), c.crear);
vehiculos.get('/:id', c.detalle);
vehiculos.put('/:id', subirArchivo.single('foto'), validar(esquemas.actualizar), c.actualizar);
vehiculos.delete('/:id', c.eliminar);
vehiculos.get('/:id/hoja-de-vida', c.hojaDeVida);    // RF-11
vehiculos.post('/:id/transferir', validar(esquemas.transferencia), c.transferir);  // RF-29

// Kilometraje (RF-05)
vehiculos.post('/:id/kilometraje', validar(esquemas.km), c.actualizarKm);
vehiculos.get('/:id/kilometraje', c.lecturas);

// Plan de partes (RF-07)
vehiculos.post('/:id/partes', validar(esquemas.parteNueva), c.agregarParte);
vehiculos.put('/:id/ultimos-cambios', validar(esquemas.ultimosCambios), c.fijarUltimosCambios);  // RN-16

// Servicios / cambios de partes (RF-08, RF-09)
vehiculos.post('/:id/servicios/sugerencias', validar(esquemas.sugerencias), c.sugerencias);  // RN-10
vehiculos.post('/:id/servicios', subirArchivo.single('factura'), validar(esquemas.servicio), c.registrarServicio);  // RF-30: factura opcional
vehiculos.get('/:id/servicios', c.historial);

// Documentos del vehículo (RF-12)
vehiculos.post('/:id/documentos', ...registrarEnVehiculo);

// Novedades: daños, fallas o golpes (RF-28)
vehiculos.get('/:id/novedades', c.listarNovedades);
vehiculos.post('/:id/novedades', subirArchivo.single('foto'), validar(esquemas.novedad), c.crearNovedad);
vehiculos.get('/:id/revisiones', c.revisiones);

const partes = Router();

partes.put('/:id', validar(esquemas.parte), c.actualizarParte);
partes.delete('/:id', c.quitarParte);
partes.get('/:id/historial', c.historialParte);
partes.post('/:id/revision', validar(esquemas.revision), c.revisarParte);  // RF-27: "Revisé y está bien"

// Daños (novedades): CRUD completo
//   Crear:      POST /api/vehiculos/:id/novedades
//   Consultar:  GET /api/novedades (todos) · GET /api/novedades/:id · GET /api/vehiculos/:id/novedades
//   Editar:     PUT /api/novedades/:id  ·  marcar arreglado: POST /api/novedades/:id/arreglar
//   Eliminar:   DELETE /api/novedades/:id
const novedades = Router();

novedades.get('/', c.listarDanos);
novedades.get('/:id', c.verNovedad);
novedades.put('/:id', subirArchivo.single('foto'), validar(esquemas.edicionNovedad), c.editarNovedad);
novedades.post('/:id/arreglar', validar(esquemas.arreglo), c.arreglarNovedad);
novedades.delete('/:id', c.eliminarNovedad);

module.exports = { vehiculos, partes, novedades };
