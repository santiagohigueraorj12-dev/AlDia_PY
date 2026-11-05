// Rutas de administración:  /api/admin/...   (solo rol "admin")
const { Router } = require('express');
const validar = require('../../middlewares/validar');
const { z, texto, entero } = require('../../utils/validaciones');
const servicio = require('./admin.service');

const esquemas = {
  // Los intervalos no pueden quedar en cero; intervalo_km vacío (null) = solo por tiempo
  parte: z.object({
    nombre: texto('el nombre de la parte', { min: 2, max: 100 }),
    intervalo_km: entero('el intervalo en km', { min: 1, vacioEsNulo: true }),
    intervalo_meses: entero('el intervalo en meses', { min: 1, max: 240 }),
  }),
  rtm: z.object({ anios_primera: entero('los años', { min: 1, max: 20 }) }),
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
