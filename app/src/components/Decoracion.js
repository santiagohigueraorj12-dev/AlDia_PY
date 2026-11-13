// Decoración visual de AlDía: degradados y fondo con dibujos.
// Todo se dibuja con SVG e íconos, así que no pesa ni necesita internet.
//
//   <Degradado>...</Degradado>   caja con fondo degradado (azul -> celeste)
//   <FondoDecorado />            fondo de pantalla con figuras suaves y dibujos
//                                de herramientas, vehículos y carretera
import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useColores } from '../tema';

/**
 * Caja con fondo degradado. Los hijos se dibujan encima.
 * colores: lista de colores (por defecto, el degradado del tema)
 * circulos: agrega círculos transparentes de adorno
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
      {circulos && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[estilos.circulo, { width: 180, height: 180, right: -50, top: -70 }]} />
          <View style={[estilos.circulo, { width: 110, height: 110, right: 70, bottom: -60 }]} />
          <View style={[estilos.circulo, { width: 60, height: 60, left: -20, bottom: -15 }]} />
        </View>
      )}
      {children}
    </View>
  );
}

// Dibujos del fondo: [ícono, izquierda %, arriba %, tamaño, giro en grados]
const DIBUJOS = [
  ['construct', 6, 4, 34, -20], ['car-sport', 74, 8, 46, 0], ['speedometer', 44, 15, 30, 10],
  ['bicycle', 12, 27, 40, 0], ['settings', 82, 30, 38, 15], ['calendar', 52, 38, 28, -10],
  ['water', 4, 49, 30, 0], ['shield-checkmark', 70, 52, 36, -8], ['car', 30, 60, 44, 0],
  ['build', 86, 66, 30, 25], ['flash', 10, 74, 30, 12], ['document-text', 56, 77, 32, -12],
  ['notifications', 80, 88, 30, 10], ['color-fill', 22, 90, 30, -15], ['speedometer', 46, 95, 34, 0],
];

/** Fondo de pantalla: manchas de color suaves, una carretera curva y dibujos tenues. */
export function FondoDecorado() {
  const c = useColores();
  const [azul, celeste, naranja] = c.decoracion;
  const opacidadDibujos = c.esOscuro ? 0.09 : 0.11;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 800">
        <Circle cx="380" cy="40" r="150" fill={azul} opacity={0.55} />
        <Circle cx="-30" cy="330" r="130" fill={celeste} opacity={0.6} />
        <Circle cx="420" cy="560" r="120" fill={naranja} opacity={0.45} />
        <Circle cx="40" cy="790" r="140" fill={azul} opacity={0.45} />
        {/* carretera curva con su línea punteada */}
        <Path d="M-20 640 C 90 560, 170 700, 280 620 S 420 560, 440 600" stroke={azul} strokeWidth="34" fill="none" opacity={0.55} strokeLinecap="round" />
        <Path d="M-20 640 C 90 560, 170 700, 280 620 S 420 560, 440 600" stroke="#ffffff" strokeWidth="3" fill="none" opacity={0.7} strokeDasharray="14 12" />
      </Svg>
      {DIBUJOS.map(([icono, x, y, tam, giro], i) => (
        <Ionicons key={i} name={icono} size={tam} color={c.primario}
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, opacity: opacidadDibujos, transform: [{ rotate: `${giro}deg` }] }} />
      ))}
    </View>
  );
}

/** Fondo del encabezado de la app (barra de arriba) en degradado. */
export function FondoEncabezado() {
  return <Degradado estilo={StyleSheet.absoluteFill} />;
}

const estilos = StyleSheet.create({
  circulo: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
});
