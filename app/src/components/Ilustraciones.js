// Ilustraciones propias de AlDía, dibujadas con SVG (gráficos vectoriales):
// se ven nítidas en cualquier tamaño, pesan muy poco y no necesitan internet.
// Toman los colores del tema, así que también se ven bien en modo oscuro.
//
//   <IlustracionMoto color="#1f4e79" />      <IlustracionCarro />
//   <EscenaCarretera />                       <IlustracionTaller />
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
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

/** Escena de carretera con una moto, un carro y avisos de "todo al día". Para portadas. */
export function EscenaCarretera({ ancho }) {
  const c = useColores();
  const oscuro = c.esOscuro;
  const cielo = oscuro ? '#16263a' : '#dcebf8';
  const lomaAtras = oscuro ? '#1f3a55' : '#b9d3ea';
  const lomaAdelante = oscuro ? '#1d4632' : '#a9d5b5';
  return (
    <Lienzo ancho={ancho} proporcion={600 / 320} viewBox="0 0 600 320" redondeado etiqueta="Ilustración de una moto y un carro en la carretera">
      <Rect x={0} y={0} width={600} height={320} rx={24} fill={cielo} />
      <Circle cx={505} cy={70} r={34} fill={LUZ} opacity={oscuro ? 0.75 : 1} />
      <Ellipse cx={130} cy={62} rx={42} ry={14} fill="#fff" opacity={oscuro ? 0.15 : 0.9} />
      <Ellipse cx={165} cy={54} rx={30} ry={13} fill="#fff" opacity={oscuro ? 0.15 : 0.9} />
      <Ellipse cx={380} cy={42} rx={34} ry={11} fill="#fff" opacity={oscuro ? 0.12 : 0.8} />
      <Path d="M0 200 Q110 120 230 175 Q330 120 450 165 Q530 135 600 160 L600 230 L0 230 Z" fill={lomaAtras} />
      <Path d="M0 215 Q150 170 300 205 Q450 175 600 200 L600 240 L0 240 Z" fill={lomaAdelante} />
      {/* carretera */}
      <Path d="M0 230 L600 230 L600 320 L0 320 Z" fill="#3a4656" />
      <Line x1={0} y1={276} x2={600} y2={276} stroke="#ffffff" strokeWidth={5} strokeDasharray="34 22" opacity={0.85} />
      <G transform="translate(40 128) scale(1.05)"><Moto color={c.primario} detalle="#e0a100" /></G>
      <G transform="translate(300 146) scale(1.08)"><Carro color="#d9534f" vidrio="#cfe3f5" /></G>
      {/* aviso verde: todo al día */}
      <G transform="translate(208 70)">
        <Rect x={0} y={0} width={150} height={46} rx={23} fill={oscuro ? '#17212d' : '#ffffff'} />
        <Circle cx={23} cy={23} r={14} fill="#1e7b45" />
        <Path d="M16 23 L21 28 L30 18" stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x={46} y={14} width={86} height={7} rx={3.5} fill={oscuro ? '#5a6577' : '#b8c2cf'} />
        <Rect x={46} y={27} width={60} height={6} rx={3} fill={oscuro ? '#3a4656' : '#d8dee8'} />
      </G>
      {/* aviso amarillo: cambio próximo */}
      <G transform="translate(420 118)">
        <Rect x={0} y={0} width={128} height={40} rx={20} fill={oscuro ? '#17212d' : '#ffffff'} />
        <Circle cx={20} cy={20} r={12} fill="#e0a100" />
        <Rect x={18} y={12} width={4} height={10} rx={2} fill="#fff" />
        <Circle cx={20} cy={27} r={2.2} fill="#fff" />
        <Rect x={40} y={12} width={72} height={6} rx={3} fill={oscuro ? '#5a6577' : '#b8c2cf'} />
        <Rect x={40} y={23} width={50} height={5} rx={2.5} fill={oscuro ? '#3a4656' : '#d8dee8'} />
      </G>
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
