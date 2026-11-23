// Controlador: recibe la petición HTTP, llama al servicio y responde.
// No contiene reglas de negocio (esas están en auth.service.js).
const servicio = require('./auth.service');
const repo = require('./auth.repository');
const { generarMisDatos } = require('./misDatosPdf');

module.exports = {
  registrar: async (req, res) => res.status(201).json(await servicio.registrar(req.body)),
  iniciarSesion: async (req, res) => res.json(await servicio.iniciarSesion(req.body)),
  solicitarRecuperacion: async (req, res) => res.json(await servicio.solicitarRecuperacion(req.body.correo)),
  restablecerPassword: async (req, res) => res.json(await servicio.restablecerPassword(req.body)),
  perfil: async (req, res) => res.json(await servicio.perfil(req.usuario.id)),
  actualizarPerfil: async (req, res) => res.json(await servicio.actualizarPerfil(req.usuario.id, req.body)),
  cambiarPassword: async (req, res) => res.json(await servicio.cambiarPassword(req.usuario.id, req.body)),
  eliminarCuenta: async (req, res) => res.json(await servicio.eliminarCuenta(req.usuario.id, req.body.password)),
  // Ley 1581: descarga de todos los datos del usuario en un archivo JSON
  misDatos: async (req, res) => {
    const datos = await repo.datosCompletos(req.usuario.id);
    res.set('Content-Disposition', 'attachment; filename="mis-datos-aldia.json"');
    res.json({ generado_en: new Date().toISOString(), ...datos });
  },
  // La misma información en PDF, para leerla o imprimirla
  misDatosPdf: async (req, res) => generarMisDatos(res, await repo.datosCompletos(req.usuario.id)),
};
