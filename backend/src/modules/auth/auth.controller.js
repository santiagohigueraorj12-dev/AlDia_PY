// Controlador: recibe la petición HTTP, llama al servicio y responde.
// No contiene reglas de negocio (esas están en auth.service.js).
const servicio = require('./auth.service');

module.exports = {
  registrar: async (req, res) => res.status(201).json(await servicio.registrar(req.body)),
  iniciarSesion: async (req, res) => res.json(await servicio.iniciarSesion(req.body)),
  solicitarRecuperacion: async (req, res) => res.json(await servicio.solicitarRecuperacion(req.body.correo)),
  restablecerPassword: async (req, res) => res.json(await servicio.restablecerPassword(req.body)),
  perfil: async (req, res) => res.json(await servicio.perfil(req.usuario.id)),
  actualizarPerfil: async (req, res) => res.json(await servicio.actualizarPerfil(req.usuario.id, req.body)),
  cambiarPassword: async (req, res) => res.json(await servicio.cambiarPassword(req.usuario.id, req.body)),
  eliminarCuenta: async (req, res) => res.json(await servicio.eliminarCuenta(req.usuario.id, req.body.password)),
};
