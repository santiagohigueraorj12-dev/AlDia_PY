// Valida el cuerpo (body) o los parámetros de consulta (query) con un esquema de Zod.
// Si los datos no cumplen, responde 400 con el primer mensaje de error.
//
// Uso en una ruta:   router.post('/', validar(esquemaVehiculo), controlador.crear);
const AppError = require('../utils/AppError');

function validar(esquema, origen = 'body') {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req[origen]);
    if (!resultado.success) {
      const primero = resultado.error.issues[0];
      throw new AppError(primero.message, 400, { campo: primero.path.join('.') });
    }
    // Se reemplazan los datos por la versión validada y convertida (ej.: "15" -> 15)
    if (origen === 'query') req.consulta = resultado.data;
    else req[origen] = resultado.data;
    next();
  };
}

module.exports = validar;
