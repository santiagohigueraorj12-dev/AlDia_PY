// Rutas de documentos:  /api/documentos/...
// (Registrar un documento nuevo está en /api/vehiculos/:id/documentos)
const { Router } = require('express');
const { z } = require('zod');
const validar = require('../../middlewares/validar');
const { subirArchivo, urlDeArchivo } = require('../../middlewares/subirArchivo');
const servicio = require('./documentos.service');

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida');

// Llegan como formulario (multipart) por el archivo adjunto: z.coerce convierte texto a número.
const esquemas = {
  registrar: z.object({
    tipo: z.enum(['soat', 'rtm', 'impuesto'], { message: 'Elige el tipo de documento' }),
    fecha_vencimiento: fecha,
    valor: z.coerce.number().min(0, 'El valor no puede ser negativo').default(0),
    fecha_pago: fecha.optional().or(z.literal('').transform(() => undefined)),
  }),
  renovar: z.object({
    fecha_vencimiento: fecha,
    valor: z.coerce.number().min(0, 'El valor no puede ser negativo').default(0),
    fecha_pago: fecha.optional().or(z.literal('').transform(() => undefined)),
  }),
};

const router = Router();

router.get('/:id', async (req, res) => {
  res.json(await servicio.historial(req.usuario.id, Number(req.params.id)));
});

router.post('/:id/renovar', subirArchivo.single('archivo'), validar(esquemas.renovar), async (req, res) => {
  res.json(await servicio.renovar(req.usuario.id, Number(req.params.id), req.body, urlDeArchivo(req.file)));
});

router.delete('/:id', async (req, res) => {
  res.json(await servicio.eliminar(req.usuario.id, Number(req.params.id)));
});

/** Se monta dentro de las rutas de vehículos: POST /api/vehiculos/:id/documentos */
const registrarEnVehiculo = [
  subirArchivo.single('archivo'),
  validar(esquemas.registrar),
  async (req, res) => {
    res.status(201).json(await servicio.registrar(req.usuario.id, Number(req.params.id), req.body, urlDeArchivo(req.file)));
  },
];

module.exports = { router, registrarEnVehiculo };
