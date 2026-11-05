// Rutas de documentos:  /api/documentos/...
// (Registrar un documento nuevo está en /api/vehiculos/:id/documentos)
const { Router } = require('express');
const validar = require('../../middlewares/validar');
const { subirArchivo, urlDeArchivo } = require('../../middlewares/subirArchivo');
const { z, entero, fecha } = require('../../utils/validaciones');
const servicio = require('./documentos.service');

// Datos comunes de registrar y renovar. Llegan como formulario (multipart) por el archivo adjunto.
const datosDocumento = {
  fecha_vencimiento: fecha('la fecha de vencimiento'),
  valor: entero('el valor pagado', { opcional: true }).transform((v) => v ?? 0),  // vacío = $0
  fecha_pago: fecha('la fecha de pago', { opcional: true, noFutura: true }),
};

const esquemas = {
  registrar: z.object({
    tipo: z.enum(['soat', 'rtm', 'impuesto'], { errorMap: () => ({ message: 'Elige el tipo de documento' }) }),
    ...datosDocumento,
  }),
  renovar: z.object(datosDocumento),
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
