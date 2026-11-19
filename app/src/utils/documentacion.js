import { NOMBRE_DOCUMENTO } from './formato.js';

const PRIORIDAD_ESTADO = { faltante: 0, vencido: 0, por_vencer: 1, vigente: 2 };

/** Agrupa los documentos de SOAT, RTM e impuesto con su estado por vehículo. */
export function armarDocumentacion(vehiculos) {
  return vehiculos.map((vehiculo) => {
    const documentos = Object.entries(NOMBRE_DOCUMENTO)
      .map(([tipo, nombre]) => {
        const registrado = vehiculo.documentos.find((doc) => doc.tipo === tipo);
        return {
          tipo,
          nombre,
          estado: registrado?.estado ?? 'faltante',
          fecha_vencimiento: registrado?.fecha_vencimiento ?? null,
        };
      })
      .sort((a, b) => PRIORIDAD_ESTADO[a.estado] - PRIORIDAD_ESTADO[b.estado]);

    const faltantes = documentos.filter((doc) => doc.estado === 'faltante').length;
    const vencidos = documentos.filter((doc) => doc.estado === 'vencido').length;
    const porVencer = documentos.filter((doc) => doc.estado === 'por_vencer').length;
    const estadoDocumentacion = faltantes + vencidos > 0
      ? { texto: 'Revisar documentación', clase: 'vencida' }
      : porVencer > 0
        ? { texto: 'Por vencer', clase: 'proxima' }
        : { texto: 'Al día', clase: 'bien' };

    return {
      ...vehiculo,
      documentos,
      faltantes,
      vencidos,
      porVencer,
      estadoDocumentacion,
    };
  });
}
