// Colores de la app en modo claro y oscuro (RNF-05).
// Por defecto el modo se toma del celular o computador; el usuario puede cambiarlo
// con el botón de sol / luna de la barra superior (components/BotonTema.js) y la
// app recuerda su elección.
// Estados: verde = bien, amarillo = próxima, rojo = vencida (RNF-04).
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const claro = {
  esOscuro: false,
  // Azules vivos: fondo celeste, tarjetas blancas y azul intenso en lo importante
  fondo: '#dbeafe',
  superficie: '#ffffff',
  superficie2: '#e0ecff',
  borde: '#bcd3f7',
  texto: '#0f1e46',
  textoSuave: '#3f5378',
  primario: '#1d4ed8',
  primarioTexto: '#ffffff',
  primarioSuave: '#dbeafe',
  acento: '#ff8a1f',
  rellenoDegradado: true,    // los elementos azules llevan el degradado (más llamativo)
  sobrePrimario: '#ffffff',  // color del texto sobre un elemento relleno de azul
  // Degradado de encabezados, botones y tarjetas destacadas (azul marino -> azul -> azul océano)
  degradado: ['#1e3a8a', '#2563eb', '#0369a1'],  // blanco encima: contraste ≥ 5,1 (WCAG AA)
  // Figuras del fondo decorado: azul, celeste y un toque naranja
  decoracion: ['#93c5fd', '#7dd3fc', '#fdba74'],
  sombra: 'rgba(37, 99, 235, 0.18)',  // sombra azulada
  bien: '#1e7b45', bienFondo: '#e3f4ea', bienBarra: '#1e7b45',
  proxima: '#8a5a00', proximaFondo: '#fff3d6', proximaBarra: '#e0a100',
  vencida: '#b42318', vencidaFondo: '#fde8e6', vencidaBarra: '#b42318',
};

const oscuro = {
  esOscuro: true,
  // Azul noche con brillos de color (violeta, azul, turquesa y naranja)
  fondo: '#0a0f1f',
  superficie: '#131b31',
  superficie2: '#1b2542',
  borde: '#2a3a64',
  texto: '#eef2ff',
  textoSuave: '#a5b4d4',
  primario: '#60a5fa',
  primarioTexto: '#0b1220',
  primarioSuave: '#1e2f5c',
  acento: '#fb923c',
  rellenoDegradado: true,    // los elementos azules llevan el degradado (más llamativo)
  sobrePrimario: '#ffffff',
  // Violeta -> azul -> turquesa; blanco encima: contraste ≥ 4,5 (WCAG AA)
  degradado: ['#4c1d95', '#1d4ed8', '#0e7490'],
  decoracion: ['#1e40af', '#0e7490', '#9a3412'],
  sombra: 'rgba(59, 130, 246, 0.22)',  // brillo azul alrededor de las tarjetas
  bien: '#4ade80', bienFondo: '#0f3a24', bienBarra: '#22c55e',
  proxima: '#fbbf24', proximaFondo: '#3d2e08', proximaBarra: '#f59e0b',
  vencida: '#f87171', vencidaFondo: '#45161a', vencidaBarra: '#ef4444',
};

// ---------------------------------------------------------------------
// Preferencia del usuario: 'sistema' (sigue al dispositivo), 'claro' u 'oscuro'.
// Se guarda en el navegador (localStorage) o en el celular (SecureStore).
// ---------------------------------------------------------------------
const CLAVE = 'aldia_tema';

async function leerPreferencia() {
  try {
    return Platform.OS === 'web' ? localStorage.getItem(CLAVE) : await SecureStore.getItemAsync(CLAVE);
  } catch {
    return null;  // sin almacenamiento disponible: se usa el modo del sistema
  }
}

async function guardarPreferencia(valor) {
  try {
    if (Platform.OS === 'web') localStorage.setItem(CLAVE, valor);
    else await SecureStore.setItemAsync(CLAVE, valor);
  } catch { /* si no se puede guardar, el cambio dura hasta cerrar la app */ }
}

const TemaContext = createContext({ preferencia: 'sistema', setPreferencia: () => {} });

/** Envuelve toda la app (src/app/_layout.js) para que cualquier pantalla sepa el tema elegido. */
export function TemaProvider({ children }) {
  const [preferencia, setPreferencia] = useState('sistema');
  useEffect(() => {
    leerPreferencia().then((v) => { if (v === 'claro' || v === 'oscuro') setPreferencia(v); });
  }, []);
  return <TemaContext.Provider value={{ preferencia, setPreferencia }}>{children}</TemaContext.Provider>;
}

/** true si en este momento se ve el modo oscuro (por elección del usuario o del sistema). */
function useEsOscuro() {
  const sistema = useColorScheme();
  const { preferencia } = useContext(TemaContext);
  return preferencia === 'sistema' ? sistema === 'dark' : preferencia === 'oscuro';
}

/** Uso en un componente:  const c = useColores();  ...  style={{ color: c.texto }} */
export function useColores() {
  return useEsOscuro() ? oscuro : claro;
}

/** Para el botón de la barra superior: { esOscuro, alternar } */
export function useTema() {
  const esOscuro = useEsOscuro();
  const { setPreferencia } = useContext(TemaContext);
  const alternar = () => {
    const nueva = esOscuro ? 'claro' : 'oscuro';
    setPreferencia(nueva);
    guardarPreferencia(nueva);
  };
  return { esOscuro, alternar };
}
