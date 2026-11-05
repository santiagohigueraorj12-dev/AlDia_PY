// Rutas del asistente de preguntas:  /api/asistente/...   (RF-21)
// Es un módulo pequeño, así que todo va en este archivo:
// las reglas de cada pregunta están en domain/asistente.js.
const { Router } = require('express');
const AppError = require('../../utils/AppError');
const { hoy } = require('../../utils/fechas');
const { PREGUNTAS, responder } = require('../../domain/asistente');
const vehiculosService = require('../vehiculos/vehiculos.service');

const router = Router();

// Lista de preguntas disponibles (la app las muestra como botones)
router.get('/preguntas', (req, res) => res.json(PREGUNTAS));

// Respuesta de una pregunta sobre un vehículo del usuario
router.get('/vehiculos/:id/:pregunta', async (req, res) => {
  // detalle() comprueba que el vehículo sea del usuario (RN-01) y trae todo calculado
  const vehiculo = await vehiculosService.detalle(req.usuario.id, Number(req.params.id));
  const respuesta = responder(req.params.pregunta, vehiculo, hoy());
  if (!respuesta) throw AppError.noEncontrado('Esa pregunta no existe');
  res.json(respuesta);
});

module.exports = router;
