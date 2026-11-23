// Colores de la app en modo claro y oscuro (RNF-05).
// Por defecto el modo se toma del celular o computador; el usuario puede cambiarlo
// con el botón de sol / luna de la barra superior (components/BotonTema.js) y la
// app recuerda su elección.
// Estados: verde = bien, amarillo = próxima, rojo = vencida (RNF-04).
// Estilo visual: paleta "Carbono" (grafito + naranja de competencia), ver abajo.
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Paleta "Carbono": inspirada en los tableros de los carros deportivos.
// Grafito casi negro, superficies neutras y UN solo acento naranja de competencia
// (el mismo naranja del sol del logo). Los colores de estado son sobrios y solo
// aparecen donde informan algo. Contrastes medidos con WCAG 2.1 (RNF-05).
const claro = {
  esOscuro: false,
  fondo: '#f1f2f4',          // gris claro neutro (no celeste)
  superficie: '#ffffff',
  superficie2: '#e8eaee',
  borde: '#dcdfe5',
  texto: '#0d1015',          // casi negro: 19:1 sobre blanco
  textoSuave: '#596171',     // 6,2:1 sobre blanco
  primario: '#c2410c',       // naranja quemado: 5,2:1 con texto blanco
  primarioTexto: '#ffffff',
  primarioSuave: '#fdeee6',
  acento: '#ea580c',
  secundario: '#334155',     // pizarra: segundo color de las gráficas
  rellenoDegradado: false,   // botones de color sólido, sin degradado
  sobrePrimario: '#ffffff',
  // Grafito: encabezados, saludo y cifras. Blanco encima: contraste ≥ 15:1; etiquetas de estado ≥ 5:1
  degradado: ['#0e1014', '#181b21', '#22262d'],
  decoracion: ['#c2410c', '#94a3b8', '#0d1015'],
  sombra: 'rgba(13, 16, 21, 0.08)',
  bien: '#126b33', bienFondo: '#e8f5ec', bienBarra: '#16a34a',
  proxima: '#8f5606', proximaFondo: '#fdf3df', proximaBarra: '#d97706',
  vencida: '#b91c1c', vencidaFondo: '#fdebeb', vencidaBarra: '#dc2626',
};

const oscuro = {
  esOscuro: true,
  fondo: '#0a0b0d',          // negro carbón
  superficie: '#131519',
  superficie2: '#1c1f24',
  borde: '#2a2e35',
  texto: '#f2f3f5',
  textoSuave: '#9aa1ab',     // 7:1 sobre la superficie
  primario: '#ff6b1a',       // naranja de competencia
  primarioTexto: '#0a0b0d',  // texto negro sobre naranja: 6,9:1
  primarioSuave: '#2a1a10',
  acento: '#ff6b1a',
  secundario: '#94a3b8',
  rellenoDegradado: false,
  sobrePrimario: '#0a0b0d',
  degradado: ['#15171b', '#1d2026', '#262a31'],
  decoracion: ['#ff6b1a', '#475569', '#0a0b0d'],
  sombra: 'rgba(0, 0, 0, 0.5)',
  bien: '#34d399', bienFondo: '#0f2a20', bienBarra: '#22c55e',
  proxima: '#fbbf24', proximaFondo: '#2e2309', proximaBarra: '#f59e0b',
  vencida: '#f87171', vencidaFondo: '#341416', vencidaBarra: '#ef4444',
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
