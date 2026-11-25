// Escena 3D de las pantallas de inicio de sesión, registro y recuperación:
// el tablero de instrumentos de un vehículo en perspectiva, con el velocímetro
// (aguja animada y arco del naranja al azul del logo), el odómetro, los testigos
// del tablero (uno parpadea) y tarjetas con avisos que flotan alrededor.
// Es distinta a la de la portada (Escena3D, el celular) para no repetir imagen.
// Solo usa transformaciones de React Native y SVG: funciona en el celular y en el navegador.
import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useColores } from '../tema';
import { Aviso3D } from './Escena3D';

const NATIVO = Platform.OS !== 'web';

/** Punto de un círculo: ángulo en grados (0 = derecha, sentido horario). */
function punto(cx, cy, r, grados) {
  const rad = (grados * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** Arco SVG entre dos ángulos. */
function arco(cx, cy, r, desde, hasta) {
  const [x1, y1] = punto(cx, cy, r, desde);
  const [x2, y2] = punto(cx, cy, r, hasta);
  const grande = hasta - desde > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${grande} 1 ${x2} ${y2}`;
}

/** Valor que va y viene sin parar (la aguja "acelera" y "frena"). */
function useVaiven(duracion, retraso = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: duracion, delay: retraso, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVO }),
      Animated.timing(v, { toValue: 0, duration: duracion, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVO }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [v, duracion, retraso]);
  return v;
}

/** Velocímetro: arco del naranja al azul, marcas y aguja animada. */
function Velocimetro({ tamano }) {
  const id = `v${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const aguja = useVaiven(2200);
  // El arco va de 135° a 405° (270° de recorrido); la aguja se mueve entre el 25 % y el 70 %
  const giro = aguja.interpolate({ inputRange: [0, 1], outputRange: ['-60deg', '60deg'] });
  return (
    <View style={{ width: tamano, height: tamano }}>
      <Svg width={tamano} height={tamano} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id={`${id}a`} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#ff7a2e" />
            <Stop offset="0.6" stopColor="#ff9a5c" />
            <Stop offset="1" stopColor="#3b82f6" />
          </LinearGradient>
          <RadialGradient id={`${id}b`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#ff7a2e" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#ff7a2e" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="100" cy="100" r="96" fill={`url(#${id}b)`} />
        <Path d={arco(100, 100, 78, 135, 405)} stroke="#2a313d" strokeWidth="12" fill="none" strokeLinecap="round" />
        <Path d={arco(100, 100, 78, 135, 325)} stroke={`url(#${id}a)`} strokeWidth="12" fill="none" strokeLinecap="round" />
        {Array.from({ length: 11 }, (_, i) => {
          const g = 135 + i * 27;
          const [x1, y1] = punto(100, 100, 62, g);
          const [x2, y2] = punto(100, 100, i % 2 ? 56 : 52, g);
          return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9d2de" strokeWidth={i % 2 ? 1.5 : 2.5} strokeLinecap="round" />;
        })}
        {[0, 2, 4, 6, 8, 10].map((i) => {
          const [x, y] = punto(100, 100, 40, 135 + i * 27);
          return <SvgText key={i} x={x} y={y + 4} fill="#8f9bb0" fontSize="11" fontWeight="700" textAnchor="middle">{i * 20}</SvgText>;
        })}
        <SvgText x="100" y="150" fill="#8f9bb0" fontSize="10" fontWeight="700" textAnchor="middle">km/h</SvgText>
      </Svg>
      {/* Aguja: gira alrededor del centro */}
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: tamano, height: tamano, transform: [{ rotate: giro }] }}>
        <Svg width={tamano} height={tamano} viewBox="0 0 200 200">
          <Path d="M 97 100 L 100 34 L 103 100 Z" fill="#ff7a2e" />
          <Circle cx="100" cy="100" r="9" fill="#1b2029" stroke="#ff7a2e" strokeWidth="3" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Testigo del tablero (ícono). "parpadea" = se enciende y se apaga. */
function Testigo({ icono, color, parpadea = false, tamano }) {
  const v = useVaiven(700);
  return (
    <Animated.View style={{ opacity: parpadea ? v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] }) : 0.9 }}>
      <Ionicons name={icono} size={tamano} color={color} />
    </Animated.View>
  );
}

/** @param tamano ancho del tablero en px */
export default function Tablero3D({ tamano = 300 }) {
  const c = useColores();
  const e = tamano / 300;
  const ancho = tamano * 1.55;
  const alto = tamano * 1.15;
  return (
    <View style={{ width: ancho, height: alto, alignSelf: 'center' }} accessibilityLabel="Tablero de un vehículo con los avisos de AlDía" accessible>
      {/* Sombra en el piso */}
      <Svg width={ancho} height={alto} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Defs>
          <RadialGradient id="sombraTablero" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#000" stopOpacity={c.esOscuro ? 0.5 : 0.22} />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx={ancho * 0.5} cy={alto * 0.86} rx={tamano * 0.62} ry={tamano * 0.09} fill="url(#sombraTablero)" />
      </Svg>

      {/* El tablero en perspectiva */}
      <View style={{
        position: 'absolute', left: (ancho - tamano) / 2, top: alto * 0.14, width: tamano, height: tamano * 0.66,
        transform: [{ perspective: 900 }, { rotateX: '16deg' }, { rotateY: '-18deg' }, { rotateZ: '-2deg' }],
      }}>
        {/* grosor (cara de abajo) */}
        <View style={{ position: 'absolute', left: 6 * e, right: -6 * e, top: 10 * e, bottom: -10 * e, borderRadius: 30 * e, backgroundColor: '#0a0d12' }} />
        <View style={{
          flex: 1, borderRadius: 30 * e, backgroundColor: '#151a22', borderWidth: 2, borderColor: '#2a313d', overflow: 'hidden',
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 * e, gap: 10 * e,
          boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        }}>
          {/* brillo del vidrio */}
          <View style={{ position: 'absolute', left: -40 * e, top: -60 * e, width: tamano * 0.9, height: tamano * 0.5, borderRadius: tamano, backgroundColor: '#ffffff', opacity: 0.05, transform: [{ rotate: '-18deg' }] }} />
          <Velocimetro tamano={tamano * 0.52} />
          <View style={{ flex: 1, gap: 9 * e }}>
            {/* Odómetro */}
            <View style={{ backgroundColor: '#0d1117', borderRadius: 10 * e, paddingVertical: 6 * e, paddingHorizontal: 8 * e, borderWidth: 1, borderColor: '#2a313d' }}>
              <Text numberOfLines={1} style={{ color: '#8f9bb0', fontSize: 8 * e, fontWeight: '800', letterSpacing: 0.8 }}>ODÓMETRO (KM)</Text>
              <Text numberOfLines={1} style={{ color: '#ffffff', fontSize: 16 * e, fontWeight: '800', letterSpacing: 0.5, fontVariant: ['tabular-nums'] }}>15.400</Text>
            </View>
            {/* Barra de desgaste del aceite */}
            <View style={{ gap: 4 * e }}>
              <Text style={{ color: '#c9d2de', fontSize: 10 * e, fontWeight: '700' }}>Aceite · 82 %</Text>
              <View style={{ height: 6 * e, borderRadius: 3, backgroundColor: '#2a313d', overflow: 'hidden' }}>
                <View style={{ width: '82%', height: '100%', borderRadius: 3, backgroundColor: '#fbbf24' }} />
              </View>
            </View>
            {/* Testigos */}
            <View style={{ flexDirection: 'row', gap: 10 * e, alignItems: 'center' }}>
              <Testigo icono="water" color="#fbbf24" parpadea tamano={16 * e} />
              <Testigo icono="battery-half" color="#4ade80" tamano={16 * e} />
              <Testigo icono="disc-outline" color="#60a5fa" tamano={16 * e} />
              <Testigo icono="thermometer-outline" color="#8f9bb0" tamano={16 * e} />
            </View>
          </View>
        </View>
      </View>

      {/* Avisos flotando alrededor */}
      <Aviso3D icono="construct" color={c.proximaBarra} titulo="Cambio de aceite" detalle="Faltan 450 km" escala={e} retraso={0}
        estilo={{ right: 0, top: alto * 0.02 }} />
      <Aviso3D icono="shield-checkmark" color={c.bienBarra} titulo="SOAT al día" detalle="Vence en 8 meses" escala={e} retraso={700}
        estilo={{ left: 0, top: alto * 0.6 }} />
      <Aviso3D icono="speedometer" color={c.secundario} titulo="Kilometraje" detalle="Actualizado hoy" escala={e} retraso={1400}
        estilo={{ right: ancho * 0.04, top: alto * 0.74 }} />
    </View>
  );
}
