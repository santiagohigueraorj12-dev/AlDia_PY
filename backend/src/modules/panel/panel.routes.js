// Rutas del panel:  /api/panel  y  /api/panel/calendario?mes=AAAA-MM
const { Router } = require('express');
const { hoy } = require('../../utils/fechas');
const servicio = require('./panel.service');

const router = Router();

router.get('/', async (req, res) => {
  res.json(await servicio.resumen(req.usuario.id));
});

router.get('/calendario', async (req, res) => {
  const mes = /^\d{4}-\d{2}$/.test(req.query.mes || '') ? `${req.query.mes}-01` : hoy();
  res.json(await servicio.calendario(req.usuario.id, mes));
});

module.exports = router;
