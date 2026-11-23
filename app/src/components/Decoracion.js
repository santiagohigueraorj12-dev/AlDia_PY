// Decoración visual de AlDía (estilo "Carbono": sobrio, como el tablero de un carro deportivo).
// Todo se dibuja con SVG, así que no pesa ni necesita internet.
//
//   <Degradado>...</Degradado>   caja con fondo grafito (o los colores que se pasen)
//   <FondoDecorado />            fondo de pantalla casi liso: un brillo naranja muy
//                                tenue y franjas diagonales finas de competencia
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
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
      {circulos && <Franjas color={c.acento} opacidad={0.55} />}
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
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="xMidYMin slice" viewBox="0 0 400 800">
        <Defs>
          <RadialGradient id={id} cx="85%" cy="0%" r="70%">
            <Stop offset="0" stopColor={c.acento} stopOpacity={c.esOscuro ? 0.16 : 0.07} />
            <Stop offset="1" stopColor={c.acento} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="800" fill={`url(#${id})`} />
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
