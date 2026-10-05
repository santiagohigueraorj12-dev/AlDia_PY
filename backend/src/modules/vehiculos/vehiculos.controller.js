// Controlador: recibe la petición HTTP, llama al servicio y responde.
// No tiene reglas de negocio (están en vehiculos.service.js).
const servicio = require('./vehiculos.service');
const { urlDeArchivo } = require('../../middlewares/subirArchivo');
const { generarHojaDeVida } = require('./hojaDeVida');

const id = (req) => Number(req.params.id);
const usuario = (req) => req.usuario.id;

module.exports = {
  listar: async (req, res) => res.json(await servicio.listar(usuario(req))),
  detalle: async (req, res) => res.json(await servicio.detalle(usuario(req), id(req))),
  crear: async (req, res) => res.status(201).json(await servicio.crear(usuario(req), req.body, urlDeArchivo(req.file))),
  actualizar: async (req, res) => res.json(await servicio.actualizar(usuario(req), id(req), req.body, urlDeArchivo(req.file))),
  eliminar: async (req, res) => res.json(await servicio.eliminar(usuario(req), id(req))),

  actualizarKm: async (req, res) => res.json(await servicio.actualizarKm(usuario(req), id(req), req.body)),
  lecturas: async (req, res) => res.json(await servicio.lecturas(usuario(req), id(req))),

  agregarParte: async (req, res) => res.status(201).json(await servicio.agregarParte(usuario(req), id(req), req.body)),
  actualizarParte: async (req, res) => res.json(await servicio.actualizarParte(usuario(req), id(req), req.body)),
  quitarParte: async (req, res) => res.json(await servicio.quitarParte(usuario(req), id(req))),
  historialParte: async (req, res) => res.json(await servicio.historialParte(usuario(req), id(req))),

  sugerencias: async (req, res) => res.json(await servicio.sugerencias(usuario(req), id(req), req.body.parteIds)),
  registrarServicio: async (req, res) => res.status(201).json(await servicio.registrarServicio(usuario(req), id(req), req.body)),
  historial: async (req, res) => res.json(await servicio.historial(usuario(req), id(req))),

  hojaDeVida: async (req, res) => {
    const vehiculo = await servicio.detalle(usuario(req), id(req));
    const servicios = await servicio.historial(usuario(req), id(req));
    generarHojaDeVida(res, vehiculo, servicios);
  },
};
