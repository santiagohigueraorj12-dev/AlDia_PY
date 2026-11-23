// Ilustraciones propias de AlDía, dibujadas con SVG (gráficos vectoriales):
// se ven nítidas en cualquier tamaño, pesan muy poco y no necesitan internet.
// Toman los colores del tema, así que también se ven bien en modo oscuro.
//
//   <IlustracionMoto color="#1f4e79" />      <IlustracionCarro />
//   <EscenaCarretera />                       <IlustracionTaller />
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useColores } from '../tema';

const LLANTA = '#15171b';
const METAL = '#c9d2de';

/** Contenedor que mantiene la proporción del dibujo y ocupa el ancho disponible. */
function Lienzo({ ancho, proporcion, viewBox, children, etiqueta, redondeado = false }) {
  return (
    <View style={{ width: ancho ?? '100%', aspectRatio: proporcion, borderRadius: redondeado ? 18 : 0, overflow: redondeado ? 'hidden' : 'visible' }}
      accessibilityRole="image" accessibilityLabel={etiqueta}>
      <Svg width="100%" height="100%" viewBox={viewBox}>{children}</Svg>
    </View>
  );
}

/** Rueda: llanta con banda, rin de 5 radios y, si se pide, disco de freno. */
function Rueda({ x, y, r, disco = false }) {
  const radios = [0, 72, 144, 216, 288].map((a) => (a * Math.PI) / 180);
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={LLANTA} />
      <Circle cx={x} cy={y} r={r * 0.84} fill="none" stroke="#2c3138" strokeWidth={r * 0.05} />
      <Circle cx={x} cy={y} r={r * 0.68} fill="#262a31" />
      {disco && <Circle cx={x} cy={y} r={r * 0.44} fill="none" stroke="#9aa3ad" strokeWidth={r * 0.1} strokeDasharray="2 1.5" />}
      {radios.map((a) => (
        <Line key={a} x1={x} y1={y} x2={x + r * 0.66 * Math.cos(a)} y2={y + r * 0.66 * Math.sin(a)} stroke={METAL} strokeWidth={r * 0.11} strokeLinecap="round" />
      ))}
      <Circle cx={x} cy={y} r={r * 0.68} fill="none" stroke={METAL} strokeWidth={r * 0.07} />
      <Circle cx={x} cy={y} r={r * 0.15} fill="#e5e9ef" />
    </G>
  );
}

/** Moto deportiva vista de lado (se dibuja en un espacio de 240 x 150). */
function Moto({ color, detalle }) {
  return (
    <G>
      <Ellipse cx={122} cy={142} rx={98} ry={5} fill="#000" opacity={0.18} />
      {/* basculante y cadena */}
      <Path d="M58 112 L122 98 L124 107 L60 119 Z" fill="#2a2e35" />
      <Line x1={62} y1={110} x2={118} y2={100} stroke="#6b7280" strokeWidth={1.5} />
      {/* exhosto */}
      <Path d="M108 110 Q84 118 60 104" stroke="#9aa3ad" strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M36 93 L66 101 L62 110 L32 101 Z" fill="#c9d2de" />
      <Path d="M36 93 L66 101" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={1.5} />
      <Rueda x={58} y={112} r={30} />
      <Rueda x={188} y={112} r={30} disco />
      {/* chasis multitubular */}
      <Path d="M160 52 L122 100 M160 52 L104 86 M122 70 L122 100" stroke="#2a2e35" strokeWidth={4} fill="none" strokeLinecap="round" />
      {/* motor con aletas */}
      <Path d="M100 84 L146 82 L150 106 L104 110 Z" fill="#3b4048" />
      {[108, 116, 124, 132, 140].map((x) => <Line key={x} x1={x} y1={86} x2={x + 2} y2={106} stroke="#5b616b" strokeWidth={2} />)}
      <Circle cx={138} cy={102} r={6} fill="#2a2e35" stroke="#6b7280" strokeWidth={1.5} />
      {/* horquilla invertida */}
      <Line x1={160} y1={50} x2={188} y2={112} stroke="#c9d2de" strokeWidth={7} strokeLinecap="round" />
      <Line x1={174} y1={80} x2={188} y2={112} stroke="#d4a017" strokeWidth={7} strokeLinecap="round" />
      {/* guardabarros delantero */}
      <Path d="M170 90 Q188 76 206 90" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* cola, colín y piloto */}
      <Path d="M34 56 L70 60 L70 72 L40 67 Z" fill={color} />
      <Path d="M30 55 L38 56 L38 62 L31 61 Z" fill="#ef4444" />
      {/* tapa lateral */}
      <Path d="M64 66 L112 62 L110 80 L90 84 L68 80 Z" fill={color} opacity={0.9} />
      <Path d="M70 76 L106 72" stroke={detalle} strokeWidth={3} strokeLinecap="round" />
      {/* sillín */}
      <Path d="M62 62 Q88 52 116 56 L116 63 Q90 61 64 68 Z" fill={LLANTA} />
      {/* tanque con brillo */}
      <Path d="M110 58 Q130 42 158 46 L166 62 Q140 76 112 74 Z" fill={color} />
      <Path d="M120 54 Q138 46 156 50" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* manubrio, farola y tablero */}
      <Path d="M148 44 L160 40 L176 41" stroke={LLANTA} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M164 50 L178 48 L182 62 L168 66 Z" fill="#2a2e35" />
      <Circle cx={177} cy={57} r={5} fill="#f3f4f6" />
    </G>
  );
}

/** Carro (sedán moderno) visto de lado (se dibuja en un espacio de 260 x 140). */
function Carro({ color, vidrio }) {
  return (
    <G>
      <Ellipse cx={133} cy={130} rx={112} ry={5} fill="#000" opacity={0.18} />
      {/* arcos de las ruedas */}
      <Circle cx={70} cy={106} r={26} fill="#0f1115" />
      <Circle cx={200} cy={106} r={26} fill="#0f1115" />
      {/* carrocería */}
      <Path d="M18 100 Q16 84 30 80 L68 74 Q92 52 118 44 Q130 40 150 40 L178 40 Q196 40 210 52 L228 70 Q246 74 248 88 L248 102 Q248 106 244 106 L226 106 A26 26 0 0 0 174 106 L96 106 A26 26 0 0 0 44 106 L22 106 Q18 106 18 100 Z" fill={color} />
      {/* línea de hombro (brillo) y estribo oscuro */}
      <Path d="M34 82 L232 74" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={2} />
      <Path d="M96 98 L174 98 L174 104 L96 104 Z" fill="#000" opacity={0.2} />
      {/* vidrios polarizados con reflejo */}
      <Path d="M90 70 Q106 54 122 48 L150 47 L150 70 Z" fill={vidrio} />
      <Path d="M156 47 L178 47 Q192 47 202 56 L214 70 L156 70 Z" fill={vidrio} />
      <Path d="M112 66 L134 50" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={4} />
      <Path d="M170 66 L186 50" stroke="#ffffff" strokeOpacity={0.12} strokeWidth={3} />
      {/* espejo, puertas y manijas */}
      <Path d="M86 70 L96 66 L98 73 L88 74 Z" fill={color} stroke="#000" strokeOpacity={0.25} strokeWidth={1} />
      <Line x1={152} y1={72} x2={150} y2={98} stroke="#000" strokeOpacity={0.25} strokeWidth={1.5} />
      <Line x1={98} y1={74} x2={100} y2={98} stroke="#000" strokeOpacity={0.15} strokeWidth={1.5} />
      <Rect x={126} y={79} width={14} height={3} rx={1.5} fill="#000" opacity={0.35} />
      <Rect x={176} y={77} width={14} height={3} rx={1.5} fill="#000" opacity={0.35} />
      {/* farola LED y stop */}
      <Path d="M230 78 L247 82 L247 87 L228 84 Z" fill="#f3f4f6" />
      <Path d="M232 88 L246 90" stroke="#ff9a3c" strokeWidth={2} strokeLinecap="round" />
      <Path d="M19 82 L34 80 L34 86 L19 89 Z" fill="#ef4444" />
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
      <Carro color={color || c.primario} vidrio="#1b1f26" />
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
  const c = useColores();
  const os = c.esOscuro;
  const filas = [
    { y: 70, color: os ? '#34d399' : '#15803d', parte: 'Aceite de motor', valor: 'Al día' },
    { y: 140, color: os ? '#fbbf24' : '#b45309', parte: 'Pastillas de freno', valor: '85 %' },
    { y: 210, color: os ? '#f87171' : '#b91c1c', parte: 'SOAT', valor: 'Vence en 7 días' },
  ];
  return (
    <Lienzo ancho={ancho} proporcion={600 / 320} viewBox="0 0 600 320" redondeado etiqueta="Tablero de AlDía con la salud del vehículo y el estado de sus partes">
      <Defs>
        <LinearGradient id="tableroFondo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={os ? '#111317' : '#ffffff'} />
          <Stop offset="1" stopColor={os ? '#1f2228' : '#f3f4f6'} />
        </LinearGradient>
        <LinearGradient id="tableroArco" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#ff9a5c" />
          <Stop offset="1" stopColor="#ff5a0a" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={600} height={320} rx={18} fill="url(#tableroFondo)" stroke={os ? 'none' : c.borde} strokeWidth={2} />
      {/* franjas de competencia */}
      <G opacity={0.5}>
        <Line x1={560} y1={-10} x2={500} y2={330} stroke="#ff6b1a" strokeWidth={6} />
        <Line x1={580} y1={-10} x2={520} y2={330} stroke="#ff6b1a" strokeWidth={2} />
      </G>
      {/* indicador: pista, avance (78 %) y marcas */}
      <Path d="M 69.1 242.5 A 105 105 0 1 1 250.9 242.5" stroke={os ? '#2a2e35' : '#e5e7eb'} strokeWidth={16} fill="none" strokeLinecap="round" />
      <Path d="M 69.1 242.5 A 105 105 0 1 1 256.8 149.3" stroke="url(#tableroArco)" strokeWidth={16} fill="none" strokeLinecap="round" />
      {[210, 150, 90, 30, -30].map((a) => {
        const r1 = 82;
        const r2 = 72;
        const rad = (a * Math.PI) / 180;
        return <Line key={a} x1={160 + r1 * Math.cos(rad)} y1={190 - r1 * Math.sin(rad)} x2={160 + r2 * Math.cos(rad)} y2={190 - r2 * Math.sin(rad)} stroke={os ? '#4b5260' : '#c4c9d1'} strokeWidth={3} strokeLinecap="round" />;
      })}
      <SvgText x={160} y={198} fill={c.texto} fontSize={46} fontWeight="800" textAnchor="middle" fontFamily="Arial">78%</SvgText>
      <SvgText x={160} y={226} fill={c.textoSuave} fontSize={14} fontWeight="700" textAnchor="middle" letterSpacing={2} fontFamily="Arial">AL DÍA</SvgText>
      {/* filas de estado */}
      {filas.map((f) => (
        <G key={f.y}>
          <Rect x={318} y={f.y} width={232} height={50} rx={8} fill={os ? '#1a1d22' : '#ffffff'} stroke={os ? '#2a2e35' : c.borde} strokeWidth={1} />
          <Rect x={318} y={f.y} width={4} height={50} rx={2} fill={f.color} />
          <SvgText x={336} y={f.y + 21} fill={c.texto} fontSize={15} fontWeight="700" fontFamily="Arial">{f.parte}</SvgText>
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
