// Decoración visual de AlDía (estilo "Carbono": sobrio, como el tablero de un carro deportivo).
// Todo se dibuja con SVG, así que no pesa ni necesita internet.
//
//   <Degradado>...</Degradado>   caja con fondo grafito (o los colores que se pasen)
//   <FondoDecorado />            fondo de pantalla casi liso: un brillo naranja muy
//                                tenue y franjas diagonales finas de competencia
import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useColores } from '../tema';

/** Franjas diagonales finas (como las de un carro de carreras), para la esquina de una caja. */
function Franjas({ color, opacidad }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="xMaxYMin slice" viewBox="0 0 400 200" pointerEvents="none">
      <G opacity={opacidad}>
        {[0, 1, 2].map((i) => (
          <Line key={i} x1={300 + i * 22} y1={-10} x2={220 + i * 22} y2={210} stroke={color} strokeWidth={i === 0 ? 6 : 2} />
        ))}
      </G>
    </Svg>
  );
}

/**
 * Caja con fondo degradado. Los hijos se dibujan encima.
 * colores: lista de colores (por defecto, el grafito del tema)
 * circulos: agrega las franjas diagonales de adorno (el nombre se conserva por compatibilidad)
 */
export function Degradado({ colores, circulos = false, estilo, children }) {
  const c = useColores();
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const lista = colores || c.degradado;
  return (
    <View style={[{ overflow: 'hidden' }, estilo]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {lista.map((color, i) => <Stop key={color + i} offset={i / (lista.length - 1)} stopColor={color} />)}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={`url(#${id})`} />
      </Svg>
      {circulos && <Franjas color={c.acento} opacidad={c.esOscuro ? 0.55 : 0.28} />}
      {children}
    </View>
  );
}

/** Fondo de pantalla: casi liso, con un brillo naranja muy tenue arriba y franjas finas. */
export function FondoDecorado() {
  const c = useColores();
  const id = `f${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* brillo azul (el del logo) abajo a la izquierda, para equilibrar el naranja de arriba */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="xMidYMin slice" viewBox="0 0 400 800">
        <Defs>
          <RadialGradient id={id} cx="85%" cy="0%" r="70%">
            <Stop offset="0" stopColor={c.acento} stopOpacity={c.esOscuro ? 0.16 : 0.07} />
            <Stop offset="1" stopColor={c.acento} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`${id}a`} cx="0%" cy="100%" r="75%">
            <Stop offset="0" stopColor={c.secundario} stopOpacity={c.esOscuro ? 0.14 : 0.07} />
            <Stop offset="1" stopColor={c.secundario} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="800" fill={`url(#${id})`} />
        <Rect x="0" y="0" width="400" height="800" fill={`url(#${id}a)`} />
        <G opacity={c.esOscuro ? 0.07 : 0.05}>
          {[0, 1, 2].map((i) => (
            <Line key={i} x1={360 + i * 16} y1={-20} x2={160 + i * 16} y2={420} stroke={c.texto} strokeWidth={i === 0 ? 10 : 3} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

/**
 * Relleno de un elemento de color (botón, pestaña activa, botón del asistente...).
 * Con la paleta "Carbono" los elementos son de color sólido, así que no dibuja nada;
 * se conserva para el caso de que una paleta use degradados (c.rellenoDegradado).
 */
export function RellenoPrimario() {
  const c = useColores();
  return c.rellenoDegradado ? <Degradado estilo={StyleSheet.absoluteFill} /> : null;
}

/** Fondo del encabezado de la app: grafito con una línea naranja abajo. */
export function FondoEncabezado() {
  const c = useColores();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Degradado estilo={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: c.acento }} />
    </View>
  );
}

// ---------------------------------------------------------------------
// Burbujas de fondo: círculos suaves (naranja, pizarra y verde) que flotan despacio
// detrás del contenido. Cada "variante" las acomoda distinto para que las secciones
// no se vean iguales. No reciben toques (pointerEvents="none").
// ---------------------------------------------------------------------
const DISPOSICIONES = [
  [{ x: '-4%', y: '8%', d: 220, t: 0 }, { x: '78%', y: '-10%', d: 300, t: 1 }, { x: '60%', y: '70%', d: 120, t: 2 }, { x: '30%', y: '85%', d: 70, t: 0 }],
  [{ x: '85%', y: '15%', d: 200, t: 0 }, { x: '-6%', y: '55%', d: 260, t: 1 }, { x: '45%', y: '-8%', d: 90, t: 2 }],
  [{ x: '10%', y: '-12%', d: 180, t: 1 }, { x: '88%', y: '60%', d: 240, t: 0 }, { x: '50%', y: '80%', d: 80, t: 0 }, { x: '70%', y: '5%', d: 60, t: 2 }],
  [{ x: '-8%', y: '-15%', d: 260, t: 0 }, { x: '82%', y: '40%', d: 160, t: 2 }, { x: '35%', y: '75%', d: 110, t: 1 }],
];

function Burbuja({ x, y, d, color, opacidad, brillo, duracion, retraso }) {
  const id = `b${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const mov = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(mov, { toValue: 1, duration: duracion, delay: retraso, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(mov, { toValue: 0, duration: duracion, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [mov, duracion, retraso]);
  const translateY = mov.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const translateX = mov.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, width: d, height: d, transform: [{ translateY }, { translateX }] }}>
      <Svg width={d} height={d} viewBox="0 0 100 100">
        <Defs>
          {/* brillo arriba a la izquierda, como una burbuja de verdad */}
          <RadialGradient id={id} cx="35%" cy="30%" r="70%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={opacidad * brillo} />
            <Stop offset="0.35" stopColor={color} stopOpacity={opacidad} />
            <Stop offset="1" stopColor={color} stopOpacity={opacidad * 0.25} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="48" fill={`url(#${id})`} stroke={color} strokeOpacity={opacidad * 0.8} strokeWidth="0.8" />
      </Svg>
    </Animated.View>
  );
}

/** <Burbujas variante={0..3} />  dentro de una caja con position relativa y overflow hidden. */
export function Burbujas({ variante = 0, escala = 1 }) {
  const c = useColores();
  const tonos = [c.acento, c.secundario, c.bienBarra];
  const opacidad = c.esOscuro ? 0.22 : 0.16;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {DISPOSICIONES[variante % DISPOSICIONES.length].map((b, i) => (
        <Burbuja key={i} x={b.x} y={b.y} d={b.d * escala} color={tonos[b.t]} brillo={c.esOscuro ? 0.3 : 0.9} opacidad={b.t === 0 ? opacidad : opacidad * 0.8}
          duracion={5000 + i * 1300} retraso={i * 400} />
      ))}
    </View>
  );
}
