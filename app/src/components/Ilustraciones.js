// Ilustraciones propias de AlDía, dibujadas con SVG (gráficos vectoriales):
// se ven nítidas en cualquier tamaño, pesan muy poco y no necesitan internet.
// Toman los colores del tema, así que también se ven bien en modo oscuro.
//
//   <IlustracionMoto color="#1f4e79" />      <IlustracionCarro />
//   <EscenaCarretera />                       <IlustracionTaller />
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useColores } from '../tema';

const LLANTA = '#1b2533';
const METAL = '#c9d2de';
const LUZ = '#ffd25a';

/** Contenedor que mantiene la proporción del dibujo y ocupa el ancho disponible. */
function Lienzo({ ancho, proporcion, viewBox, children, etiqueta, redondeado = false }) {
  return (
    <View style={{ width: ancho ?? '100%', aspectRatio: proporcion, borderRadius: redondeado ? 18 : 0, overflow: redondeado ? 'hidden' : 'visible' }}
      accessibilityRole="image" accessibilityLabel={etiqueta}>
      <Svg width="100%" height="100%" viewBox={viewBox}>{children}</Svg>
    </View>
  );
}

/** Rueda: llanta, rin y centro. */
function Rueda({ x, y, r }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={LLANTA} />
      <Circle cx={x} cy={y} r={r * 0.62} fill={METAL} />
      <Circle cx={x} cy={y} r={r * 0.45} fill="#8d99a8" />
      <Circle cx={x} cy={y} r={r * 0.16} fill={LLANTA} />
    </G>
  );
}

/** Moto vista de lado (se dibuja en un espacio de 240 x 150). */
function Moto({ color, detalle }) {
  return (
    <G>
      <Ellipse cx={122} cy={140} rx={96} ry={6} fill="#000" opacity={0.15} />
      {/* basculante y exosto */}
      <Line x1={60} y1={110} x2={118} y2={96} stroke="#5a6577" strokeWidth={7} strokeLinecap="round" />
      <Path d="M112 112 L54 106 Q42 104 38 96" stroke="#9aa7b8" strokeWidth={7} strokeLinecap="round" fill="none" />
      <Rueda x={60} y={110} r={28} />
      <Rueda x={185} y={110} r={28} />
      {/* guardabarros */}
      <Path d="M36 96 Q60 74 84 94" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
      <Path d="M164 92 Q185 76 206 92" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* motor */}
      <Rect x={100} y={80} width={44} height={28} rx={6} fill="#5a6577" />
      <Line x1={108} y1={86} x2={108} y2={102} stroke="#8d99a8" strokeWidth={3} />
      <Line x1={118} y1={86} x2={118} y2={102} stroke="#8d99a8" strokeWidth={3} />
      <Line x1={128} y1={86} x2={128} y2={102} stroke="#8d99a8" strokeWidth={3} />
      {/* barra delantera */}
      <Line x1={166} y1={58} x2={185} y2={110} stroke="#9aa7b8" strokeWidth={7} strokeLinecap="round" />
      {/* cola, costado, sillín y tanque */}
      <Path d="M46 74 L68 68 L68 84 L52 86 Z" fill={color} />
      <Path d="M68 80 L118 76 L112 94 L80 96 Z" fill={detalle} />
      <Path d="M62 70 Q90 58 116 62 L118 76 Q88 80 64 82 Z" fill={LLANTA} />
      <Path d="M110 62 Q132 46 162 54 L168 70 Q140 80 114 78 Z" fill={color} />
      <Path d="M120 66 Q140 57 160 61" stroke={detalle} strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* manubrio y farola */}
      <Path d="M156 50 L170 43 L184 45" stroke={LLANTA} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Circle cx={174} cy={60} r={9} fill={LUZ} stroke={LLANTA} strokeWidth={3} />
    </G>
  );
}

/** Carro visto de lado (se dibuja en un espacio de 260 x 140). */
function Carro({ color, vidrio }) {
  return (
    <G>
      <Ellipse cx={133} cy={130} rx={110} ry={6} fill="#000" opacity={0.15} />
      <Path d="M20 98 Q18 78 40 74 L72 70 L100 44 Q106 38 116 38 L176 38 Q188 38 196 46 L220 70 L236 74 Q246 78 246 92 L246 104 L20 104 Z" fill={color} />
      {/* ventanas */}
      <Path d="M110 48 L86 70 L144 70 L144 48 Z" fill={vidrio} />
      <Path d="M152 48 L152 70 L208 70 L190 51 Q186 48 180 48 Z" fill={vidrio} />
      {/* puertas y manijas */}
      <Line x1={148} y1={74} x2={148} y2={100} stroke="#000" strokeOpacity={0.25} strokeWidth={2} />
      <Rect x={124} y={80} width={14} height={4} rx={2} fill="#000" opacity={0.3} />
      <Rect x={164} y={80} width={14} height={4} rx={2} fill="#000" opacity={0.3} />
      {/* luces y bómper */}
      <Rect x={232} y={80} width={13} height={8} rx={3} fill={LUZ} />
      <Rect x={20} y={80} width={9} height={9} rx={2} fill="#ff6b5b" />
      <Rect x={16} y={100} width={234} height={8} rx={4} fill={LLANTA} opacity={0.85} />
      <Rueda x={70} y={106} r={22} />
      <Rueda x={200} y={106} r={22} />
    </G>
  );
}

/** Moto sola. color: color del tanque (por defecto, el azul de AlDía). */
export function IlustracionMoto({ ancho, color, detalle = '#e0a100' }) {
  const c = useColores();
  return (
    <Lienzo ancho={ancho} proporcion={240 / 150} viewBox="0 0 240 150" etiqueta="Ilustración de una moto">
      <Moto color={color || c.primario} detalle={detalle} />
    </Lienzo>
  );
}

/** Carro solo. */
export function IlustracionCarro({ ancho, color }) {
  const c = useColores();
  return (
    <Lienzo ancho={ancho} proporcion={260 / 140} viewBox="0 0 260 140" etiqueta="Ilustración de un carro">
      <Carro color={color || c.primario} vidrio="#cfe3f5" />
    </Lienzo>
  );
}

/** Moto o carro según el tipo del vehículo. */
export function IlustracionVehiculo({ tipo, ancho, color }) {
  return tipo === 'Moto' ? <IlustracionMoto ancho={ancho} color={color} /> : <IlustracionCarro ancho={ancho} color={color} />;
}

/**
 * Portada: tablero de instrumentos (estilo "Carbono"), como el de un carro deportivo.
 * Un indicador semicircular con el porcentaje de salud y tres filas de estado
 * (al día, próximo y vencido). Se conserva el nombre EscenaCarretera porque la usan
 * la página de inicio, el inicio de sesión y las pantallas vacías.
 */
export function EscenaCarretera({ ancho }) {
  const filas = [
    { y: 70, color: '#34d399', parte: 'Aceite de motor', valor: 'Al día' },
    { y: 140, color: '#fbbf24', parte: 'Pastillas de freno', valor: '85 %' },
    { y: 210, color: '#f87171', parte: 'SOAT', valor: 'Vence en 7 días' },
  ];
  return (
    <Lienzo ancho={ancho} proporcion={600 / 320} viewBox="0 0 600 320" redondeado etiqueta="Tablero de AlDía con la salud del vehículo y el estado de sus partes">
      <Defs>
        <LinearGradient id="tableroFondo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#111317" />
          <Stop offset="1" stopColor="#1f2228" />
        </LinearGradient>
        <LinearGradient id="tableroArco" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#ff9a5c" />
          <Stop offset="1" stopColor="#ff5a0a" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={600} height={320} rx={18} fill="url(#tableroFondo)" />
      {/* franjas de competencia */}
      <G opacity={0.5}>
        <Line x1={560} y1={-10} x2={500} y2={330} stroke="#ff6b1a" strokeWidth={6} />
        <Line x1={580} y1={-10} x2={520} y2={330} stroke="#ff6b1a" strokeWidth={2} />
      </G>
      {/* indicador: pista, avance (78 %) y marcas */}
      <Path d="M 69.1 242.5 A 105 105 0 1 1 250.9 242.5" stroke="#2a2e35" strokeWidth={16} fill="none" strokeLinecap="round" />
      <Path d="M 69.1 242.5 A 105 105 0 1 1 256.8 149.3" stroke="url(#tableroArco)" strokeWidth={16} fill="none" strokeLinecap="round" />
      {[210, 150, 90, 30, -30].map((a) => {
        const r1 = 82;
        const r2 = 72;
        const rad = (a * Math.PI) / 180;
        return <Line key={a} x1={160 + r1 * Math.cos(rad)} y1={190 - r1 * Math.sin(rad)} x2={160 + r2 * Math.cos(rad)} y2={190 - r2 * Math.sin(rad)} stroke="#4b5260" strokeWidth={3} strokeLinecap="round" />;
      })}
      <SvgText x={160} y={198} fill="#ffffff" fontSize={46} fontWeight="800" textAnchor="middle" fontFamily="Arial">78%</SvgText>
      <SvgText x={160} y={226} fill="#9aa1ab" fontSize={14} fontWeight="700" textAnchor="middle" letterSpacing={2} fontFamily="Arial">AL DÍA</SvgText>
      {/* filas de estado */}
      {filas.map((f) => (
        <G key={f.y}>
          <Rect x={318} y={f.y} width={232} height={50} rx={8} fill="#1a1d22" stroke="#2a2e35" strokeWidth={1} />
          <Rect x={318} y={f.y} width={4} height={50} rx={2} fill={f.color} />
          <SvgText x={336} y={f.y + 21} fill="#e5e7eb" fontSize={15} fontWeight="700" fontFamily="Arial">{f.parte}</SvgText>
          <SvgText x={336} y={f.y + 40} fill={f.color} fontSize={13} fontWeight="700" fontFamily="Arial">{f.valor}</SvgText>
        </G>
      ))}
    </Lienzo>
  );
}

/** Taller: engranaje, llave y lista de chequeo. Para pantallas vacías. */
export function IlustracionTaller({ ancho = 180 }) {
  const c = useColores();
  return (
    <Lienzo ancho={ancho} proporcion={200 / 160} viewBox="0 0 200 160" etiqueta="Ilustración de herramientas de taller">
      <Circle cx={100} cy={84} r={70} fill={c.primarioSuave} />
      {/* engranaje: un círculo con borde punteado grueso parece los dientes */}
      <Circle cx={76} cy={78} r={30} fill="none" stroke="#8d99a8" strokeWidth={12} strokeDasharray="9 7" />
      <Circle cx={76} cy={78} r={24} fill="#8d99a8" />
      <Circle cx={76} cy={78} r={9} fill={c.primarioSuave} />
      {/* llave de tuercas */}
      <G transform="rotate(-40 110 90)">
        <Rect x={70} y={84} width={84} height={12} rx={6} fill={c.primario} />
        <Path d="M150 74 a16 16 0 1 1 0 32 l0 -9 l-8 0 l0 -14 l8 0 Z" fill={c.primario} />
      </G>
      {/* lista de chequeo */}
      <Rect x={118} y={30} width={56} height={70} rx={8} fill={c.superficie} stroke={c.borde} strokeWidth={2} />
      <Rect x={134} y={24} width={24} height={10} rx={4} fill="#8d99a8" />
      {[48, 64, 80].map((y, i) => (
        <G key={y}>
          <Circle cx={130} cy={y} r={5} fill={i < 2 ? '#1e7b45' : '#e0a100'} />
          <Rect x={140} y={y - 3} width={26} height={6} rx={3} fill={c.borde} />
        </G>
      ))}
    </Lienzo>
  );
}
