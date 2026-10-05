// Rutas de administración:  /api/admin/...   (solo rol "admin")
const { Router } = require('express');
const { z } = require('zod');
const validar = require('../../middlewares/validar');
const servicio = require('./admin.service');

const esquemas = {
  // Los intervalos no pueden quedar en cero; intervalo_km null = solo por tiempo
  parte: z.object({
    nombre: z.string().trim().min(2, 'Escribe el nombre de la parte').max(100),
    intervalo_km: z.coerce.number().int().positive('El intervalo en km debe ser mayor a cero').nullable(),
    intervalo_meses: z.coerce.number().int().positive('El intervalo en meses debe ser mayor a cero'),
  }),
  rtm: z.object({ anios_primera: z.coerce.number().int().min(1).max(20) }),
  activo: z.object({ activo: z.boolean() }),
};

const id = (req) => Number(req.params.id);
const router = Router();

// RF-17 y RF-18
router.get('/tipos', async (req, res) => res.json(await servicio.tiposConPlan()));
router.post('/tipos/:id/partes', validar(esquemas.parte), async (req, res) => res.status(201).json(await servicio.agregarParteBase(id(req), req.body)));
router.put('/partes/:id', validar(esquemas.parte), async (req, res) => res.json(await servicio.actualizarParteBase(id(req), req.body)));
router.delete('/partes/:id', async (req, res) => res.json(await servicio.eliminarParteBase(id(req))));
router.put('/tipos/:id/rtm', validar(esquemas.rtm), async (req, res) => res.json(await servicio.guardarReglaRtm(id(req), req.body.anios_primera)));

// RF-19
router.get('/usuarios', async (req, res) => res.json(await servicio.usuarios()));
router.put('/usuarios/:id/activo', validar(esquemas.activo), async (req, res) => {
  res.json(await servicio.cambiarActivo(req.usuario.id, id(req), req.body.activo));
});

module.exports = router;
