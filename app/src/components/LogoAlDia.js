// Logo oficial de AlDía: "Ruta al amanecer".
// La "A" es una carretera en perspectiva (sus dos bordes y la línea central)
// que sube hacia un sol naranja: el día. Al + Día.
// Es el mismo dibujo de app/assets/logo/aldia-icono.svg, hecho con react-native-svg
// para que se vea nítido en cualquier tamaño (celular y navegador).
import { useRef } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Cada logo en pantalla necesita ids propios para sus degradados
let contador = 0;

/** Solo el ícono (cuadro azul con la carretera y el sol). */
export function IconoAlDia({ tamano = 40 }) {
  const id = useRef(`aldia${(contador += 1)}`).current;
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 512 512" accessibilityLabel="Logo de AlDía">
      <Defs>
        <LinearGradient id={`${id}f`} x1="0" y1="0" x2="0.35" y2="1">
          <Stop offset="0" stopColor="#172e73" />
          <Stop offset="0.6" stopColor="#2563eb" />
          <Stop offset="1" stopColor="#0b6fb8" />
        </LinearGradient>
        <RadialGradient id={`${id}r`} cx="256" cy="200" r="190" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#ff9a2e" stopOpacity="0.45" />
          <Stop offset="0.55" stopColor="#ff9a2e" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#ff9a2e" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffd166" />
          <Stop offset="1" stopColor="#ff7a00" />
        </LinearGradient>
      </Defs>
      <Rect width="512" height="512" rx="116" fill={`url(#${id}f)`} />
      <Rect width="512" height="512" rx="116" fill={`url(#${id}r)`} />
      <Circle cx="256" cy="186" r="86" fill={`url(#${id}s)`} />
      <Path
        d="M 104 430 L 160 430 L 264 146 L 248 146 Z M 352 430 L 408 430 L 264 146 L 248 146 Z"
        fill="#ffffff" stroke="#ffffff" strokeWidth={14} strokeLinejoin="round"
      />
      <G fill="#ffffff">
        <Rect x="244" y="378" width="24" height="54" rx="12" />
        <Rect x="246.5" y="324" width="19" height="38" rx="9.5" />
        <Rect x="249" y="281" width="14" height="27" rx="7" />
        <Rect x="251" y="248" width="10" height="19" rx="5" />
      </G>
    </Svg>
  );
}

/**
 * Ícono + nombre "AlDía".
 * @param tamano  tamaño de la letra; el ícono es un poco más grande
 * @param color   color del texto ("Día" va en azul o en el color que se indique)
 * @param colorDia color de "Día"
 */
export default function LogoAlDia({ tamano = 22, color, colorDia }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Math.round(tamano * 0.4) }}>
      <IconoAlDia tamano={Math.round(tamano * 1.65)} />
      <Text style={{ fontSize: tamano, fontWeight: '800', color, letterSpacing: -0.5 }}>
        Al<Text style={{ color: colorDia }}>Día</Text>
      </Text>
    </View>
  );
}
