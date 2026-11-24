// RN-19: anillo de salud del vehículo, como los anillos de actividad de un reloj.
// Se llena con animación hasta el porcentaje: verde (80 % o más), amarillo
// (50 a 79 %) o rojo (menos de 50 %). En el centro va el número.
import { useId } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColores } from '../tema';
import { useProgreso } from './Animaciones';

// Degradado de cada nivel: claro → intenso
const DEGRADADOS = {
  bien: ['#4ade80', '#16a34a'],
  proxima: ['#fcd34d', '#f59e0b'],
  vencida: ['#fb7185', '#e11d48'],
};

/**
 * @param porcentaje  0 a 100
 * @param nivel       'bien' | 'proxima' | 'vencida'
 * @param tamano      diámetro en px
 * @param claro       true sobre fondos azules (pista y número en blanco)
 * @param texto       palabra bajo el número (ej.: "al día"); se oculta en anillos pequeños
 */
export default function AnilloSalud({ porcentaje, nivel, tamano = 96, claro = false, texto = 'al día' }) {
  const c = useColores();
  const id = `a${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const valor = useProgreso(porcentaje);
  const grosor = Math.max(5, Math.round(tamano * 0.11));
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const [desde, hasta] = DEGRADADOS[nivel] || DEGRADADOS.bien;
  const colorTexto = claro ? '#ffffff' : c.texto;
  const conTexto = tamano >= 72 && texto;

  return (
    <View style={{ width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="progressbar" accessibilityLabel={`Salud: ${porcentaje} % ${texto || ''}`}
      accessibilityValue={{ min: 0, max: 100, now: porcentaje }}>
      <Svg width={tamano} height={tamano} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={desde} />
            <Stop offset="1" stopColor={hasta} />
          </LinearGradient>
        </Defs>
        {/* Pista de fondo */}
        <Circle cx={tamano / 2} cy={tamano / 2} r={radio} stroke={claro ? 'rgba(255,255,255,0.25)' : c.superficie2}
          strokeWidth={grosor} fill="none" />
        {/* Parte llena: empieza arriba (rotada -90°) y avanza en el sentido del reloj */}
        <Circle cx={tamano / 2} cy={tamano / 2} r={radio} stroke={`url(#${id})`} strokeWidth={grosor} fill="none"
          strokeLinecap="round" strokeDasharray={`${circunferencia} ${circunferencia}`}
          strokeDashoffset={circunferencia * (1 - Math.min(100, valor) / 100)}
          transform={`rotate(-90 ${tamano / 2} ${tamano / 2})`} />
      </Svg>
      <Text style={{ color: colorTexto, fontWeight: '800', fontSize: Math.round(tamano * (conTexto ? 0.26 : 0.3)) }}>
        {Math.round(valor)}<Text style={{ fontSize: Math.round(tamano * 0.14) }}>%</Text>
      </Text>
      {conTexto && <Text style={{ color: claro ? colorTexto : c.azul, opacity: 0.9, fontSize: Math.round(tamano * 0.12), fontWeight: '600', marginTop: -2 }}>{texto}</Text>}
    </View>
  );
}
