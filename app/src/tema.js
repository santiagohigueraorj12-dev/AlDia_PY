// Colores de la app en modo claro y oscuro (RNF-05).
// Por defecto la app se ve en modo CLARO (aunque el celular esté en oscuro); el usuario
// puede cambiarlo con el botón de sol / luna de la barra superior (components/BotonTema.js)
// y la app recuerda su elección.
// Estados: verde = bien, amarillo = próxima, rojo = vencida (RNF-04).
// Estilo visual: paleta "Carbono" (grafito + naranja de competencia), ver abajo.
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Paleta "Carbono": inspirada en los tableros de los carros deportivos.
// Grafito casi negro, superficies neutras y UN solo acento naranja de competencia
// (el mismo naranja del sol del logo) y el azul del logo como segundo color. Los colores de estado son sobrios y solo
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
  secundario: '#2563eb',     // azul del logo: segundo color de las gráficas y adornos
  azul: '#1d4ed8',           // azul del logo para íconos e información: 6,7:1 sobre blanco
  azulSuave: '#e8effd',
  rellenoDegradado: false,   // botones de color sólido, sin degradado
  sobrePrimario: '#ffffff',
  // Modo claro: encabezados, saludo y cifras en blanco con un toque cálido y letras oscuras (etiquetas de estado ≥ 5:1)
  degradado: ['#ffffff', '#fdf7f3', '#fbefe7'],
  sobreDegradado: '#0d1015',        // texto sobre el degradado
  sobreDegradadoSuave: '#596171',
  decoracion: ['#c2410c', '#94a3b8', '#0d1015'],
  sombra: 'rgba(13, 16, 21, 0.08)',
  bien: '#126b33', bienFondo: '#e8f5ec', bienBarra: '#16a34a',
  proxima: '#8f5606', proximaFondo: '#fdf3df', proximaBarra: '#d97706',
  vencida: '#b91c1c', vencidaFondo: '#fdebeb', vencidaBarra: '#dc2626',
};

// Modo oscuro (opcional, con el botón de luna): pizarra profunda en vez de negro puro,
// tarjetas un poco más claras que el fondo para que se separen, texto suave que no
// encandila y el mismo naranja de competencia. Contrastes medidos con WCAG 2.1.
const oscuro = {
  esOscuro: true,
  fondo: '#0e1116',          // pizarra profunda
  superficie: '#171b22',     // tarjetas: se despegan del fondo
  superficie2: '#20252e',
  borde: '#2b313c',
  texto: '#eef1f5',
  textoSuave: '#a6aebb',
  primario: '#ff7a2e',       // naranja de competencia
  primarioTexto: '#111318',  // texto oscuro sobre el naranja
  primarioSuave: '#2a1c13',
  acento: '#ff7a2e',
  secundario: '#60a5fa',     // azul del logo, más claro para el fondo oscuro
  azul: '#7cb4fb',           // 8,6:1 sobre las tarjetas oscuras
  azulSuave: '#16233a',
  rellenoDegradado: false,
  sobrePrimario: '#111318',
  degradado: ['#171b22', '#1b2029', '#222833'],
  sobreDegradado: '#ffffff',
  sobreDegradadoSuave: '#b3bac6',
  decoracion: ['#ff7a2e', '#475569', '#0e1116'],
  sombra: 'rgba(0, 0, 0, 0.45)',
  bien: '#4ade80', bienFondo: '#12291d', bienBarra: '#22c55e',
  proxima: '#fbbf24', proximaFondo: '#2d230d', proximaBarra: '#f59e0b',
  vencida: '#f87171', vencidaFondo: '#331719', vencidaBarra: '#ef4444',
};

// ---------------------------------------------------------------------
// Preferencia del usuario: 'sistema' (sigue al dispositivo), 'claro' u 'oscuro'.
// Se guarda en el navegador (localStorage) o en el celular (SecureStore).
// ---------------------------------------------------------------------
// v2: la preferencia guardada antes se descarta para que todos arranquen en modo claro
const CLAVE = 'aldia_tema_v2';

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
  const [preferencia, setPreferencia] = useState('claro');  // claro por defecto
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
