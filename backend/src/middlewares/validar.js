// Valida el cuerpo (body) o los parámetros de consulta (query) con un esquema de Zod.
// Si los datos no cumplen, responde 400 con TODOS los errores, uno por campo:
//
//   { "error": "Revisa los campos marcados.",
//     "errores": { "marca": "Escribe la marca", "km_inicial": "Escribe el kilometraje" } }
//
// Así el formulario puede mostrar cada error debajo de su campo.
// Uso en una ruta:   router.post('/', validar(esquemaVehiculo), controlador.crear);
const AppError = require('../utils/AppError');

function validar(esquema, origen = 'body') {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req[origen]);
    if (!resultado.success) {
      const errores = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path.join('.') || 'general';
        if (!errores[campo]) errores[campo] = problema.message;  // el primer error de cada campo
      }
      const campos = Object.keys(errores);
      const mensaje = campos.length === 1 ? errores[campos[0]] : 'Revisa los campos marcados.';
      throw new AppError(mensaje, 400, { campo: campos[0], errores });
    }
    // Se reemplazan los datos por la versión validada y convertida (ej.: "15.400" -> 15400)
    if (origen === 'query') req.consulta = resultado.data;
    else req[origen] = resultado.data;
    next();
  };
}

module.exports = validar;
