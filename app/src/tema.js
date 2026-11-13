// Colores de la app en modo claro y oscuro (RNF-05).
// El modo se toma del celular automáticamente.
// Estados: verde = bien, amarillo = próxima, rojo = vencida (RNF-04).
import { useColorScheme } from 'react-native';

const claro = {
  esOscuro: false,
  fondo: '#eaf1fb',
  superficie: '#ffffff',
  superficie2: '#eef3fa',
  borde: '#dbe4f0',
  texto: '#14213d',
  textoSuave: '#56637a',
  primario: '#1d5bd8',
  primarioTexto: '#ffffff',
  primarioSuave: '#e2ecfd',
  acento: '#ff8a1f',
  // Degradado de encabezados y tarjetas destacadas (azul -> celeste)
  degradado: ['#173b8f', '#1d5bd8', '#13a8e0'],
  // Figuras del fondo decorado
  decoracion: ['#bcd4f6', '#c9ecf7', '#ffe0bf'],
  sombra: 'rgba(23, 59, 143, 0.10)',
  bien: '#1e7b45', bienFondo: '#e3f4ea', bienBarra: '#1e7b45',
  proxima: '#8a5a00', proximaFondo: '#fff3d6', proximaBarra: '#e0a100',
  vencida: '#b42318', vencidaFondo: '#fde8e6', vencidaBarra: '#b42318',
};

const oscuro = {
  esOscuro: true,
  fondo: '#0c1422',
  superficie: '#152033',
  superficie2: '#1c2a40',
  borde: '#2a3b55',
  texto: '#e8eef7',
  textoSuave: '#9fb0c8',
  primario: '#6aa5ff',
  primarioTexto: '#0b1724',
  primarioSuave: '#1b3152',
  acento: '#ffa24d',
  degradado: ['#0f2560', '#1c4bb0', '#0b7fa8'],
  decoracion: ['#1a3460', '#123e52', '#4a3115'],
  sombra: 'rgba(0, 0, 0, 0.35)',
  bien: '#5cc98a', bienFondo: '#15301f', bienBarra: '#5cc98a',
  proxima: '#f0c050', proximaFondo: '#352a10', proximaBarra: '#e0a100',
  vencida: '#ff8a80', vencidaFondo: '#3a1a18', vencidaBarra: '#ff8a80',
};

/** Uso en un componente:  const c = useColores();  ...  style={{ color: c.texto }} */
export function useColores() {
  return useColorScheme() === 'dark' ? oscuro : claro;
}
