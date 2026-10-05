// Error "controlado" de la aplicación: lleva el código HTTP que debe responderse.
// Los servicios lanzan AppError y el middleware errorHandler lo convierte en respuesta JSON.
class AppError extends Error {
  constructor(mensaje, status = 400, extra = undefined) {
    super(mensaje);
    this.status = status;
    this.extra = extra; // datos adicionales opcionales para el cliente
  }

  static noEncontrado(mensaje = 'No se encontró el recurso') {
    return new AppError(mensaje, 404);
  }

  static prohibido(mensaje = 'No tienes permiso para hacer esto') {
    return new AppError(mensaje, 403);
  }
}

module.exports = AppError;
