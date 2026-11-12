// Listas de Colombia que usan los formularios del perfil (RF-03).

export const TIPOS_DOCUMENTO = [
  { valor: 'CC', texto: 'Cédula de ciudadanía' },
  { valor: 'CE', texto: 'Cédula de extranjería' },
  { valor: 'TI', texto: 'Tarjeta de identidad' },
  { valor: 'PA', texto: 'Pasaporte' },
  { valor: 'PPT', texto: 'Permiso por protección temporal (PPT)' },
];

/** Categorías de la licencia de conducción en Colombia. */
export const CATEGORIAS_LICENCIA = [
  { valor: 'A1', texto: 'A1 · Motos hasta 125 cc' },
  { valor: 'A2', texto: 'A2 · Motos de más de 125 cc' },
  { valor: 'B1', texto: 'B1 · Carros y camionetas particulares' },
  { valor: 'B2', texto: 'B2 · Camiones y buses particulares' },
  { valor: 'B3', texto: 'B3 · Vehículos articulados particulares' },
  { valor: 'C1', texto: 'C1 · Carros de servicio público' },
  { valor: 'C2', texto: 'C2 · Camiones y buses de servicio público' },
  { valor: 'C3', texto: 'C3 · Articulados de servicio público' },
];

export const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
  'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila',
  'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
].map((d) => ({ valor: d, texto: d }));
