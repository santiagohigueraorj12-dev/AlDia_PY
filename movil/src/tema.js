// Colores de la app en modo claro y oscuro (RNF-05).
// El modo se toma del celular automáticamente.
// Estados: verde = bien, amarillo = próxima, rojo = vencida (RNF-04).
import { useColorScheme } from 'react-native';

const claro = {
  fondo: '#f4f6f9',
  superficie: '#ffffff',
  superficie2: '#eef2f7',
  borde: '#d8dee8',
  texto: '#1b2533',
  textoSuave: '#5a6577',
  primario: '#1f4e79',
  primarioTexto: '#ffffff',
  primarioSuave: '#e3edf7',
  bien: '#1e7b45', bienFondo: '#e3f4ea', bienBarra: '#1e7b45',
  proxima: '#8a5a00', proximaFondo: '#fff3d6', proximaBarra: '#e0a100',
  vencida: '#b42318', vencidaFondo: '#fde8e6', vencidaBarra: '#b42318',
};

const oscuro = {
  fondo: '#0f1620',
  superficie: '#17212d',
  superficie2: '#1f2b39',
  borde: '#2c3a4b',
  texto: '#e6ebf2',
  textoSuave: '#9aa7b8',
  primario: '#6ea8dc',
  primarioTexto: '#0b1724',
  primarioSuave: '#1c3048',
  bien: '#5cc98a', bienFondo: '#15301f', bienBarra: '#5cc98a',
  proxima: '#f0c050', proximaFondo: '#352a10', proximaBarra: '#e0a100',
  vencida: '#ff8a80', vencidaFondo: '#3a1a18', vencidaBarra: '#ff8a80',
};

/** Uso en un componente:  const c = useColores();  ...  style={{ color: c.texto }} */
export function useColores() {
  return useColorScheme() === 'dark' ? oscuro : claro;
}
