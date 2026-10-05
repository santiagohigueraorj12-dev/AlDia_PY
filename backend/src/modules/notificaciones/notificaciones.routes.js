// Rutas de notificaciones:  /api/notificaciones/...
// Es un módulo pequeño, así que el controlador va en este mismo archivo.
const { Router } = require('express');
const servicio = require('./notificaciones.service');

const router = Router();

router.get('/', async (req, res) => {
  res.json({
    notificaciones: await servicio.listar(req.usuario.id),
    noLeidas: await servicio.contarNoLeidas(req.usuario.id),
  });
});

// La barra superior lo consulta para mostrar la campanita con el número
router.get('/contador', async (req, res) => {
  res.json({ noLeidas: await servicio.contarNoLeidas(req.usuario.id) });
});

router.post('/leer-todas', async (req, res) => {
  await servicio.marcarTodasLeidas(req.usuario.id);
  res.json({ ok: true });
});

router.post('/:id/leer', async (req, res) => {
  await servicio.marcarLeida(req.usuario.id, Number(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
