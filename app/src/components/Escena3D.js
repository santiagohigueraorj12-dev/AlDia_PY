// Escena 3D de la portada y de las pantallas de inicio de sesión:
// un celular en perspectiva (con grosor y sombra) que muestra AlDía por dentro,
// y tres tarjetas que flotan alrededor con avisos reales de la app.
// Solo usa transformaciones de React Native (perspective, rotateX, rotateY):
// funciona igual en el celular y en el navegador, sin librerías extra.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useColores } from '../tema';
import { IconoAlDia } from './LogoAlDia';

const NATIVO = Platform.OS !== 'web';

/** Valor que sube y baja suave sin parar (para que las tarjetas "floten"). */
export function useFlotar(retraso) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 2600, delay: retraso, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
      Animated.timing(v, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVO }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [v, retraso]);
  return v;
}

/** Tarjeta flotante con un aviso (ícono de color, título y detalle). */
export function Aviso3D({ icono, color, titulo, detalle, estilo, retraso, escala }) {
  const c = useColores();
  const v = useFlotar(retraso);
  return (
    <Animated.View style={[{
      position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8 * escala,
      backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 14 * escala,
      paddingVertical: 9 * escala, paddingHorizontal: 11 * escala,
      boxShadow: c.esOscuro ? '0 18px 34px rgba(0,0,0,0.55)' : '0 18px 34px rgba(13,16,21,0.18)',
      transform: [{ perspective: 800 }, { rotateY: '-14deg' }, { rotateX: '6deg' },
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-6 * escala, 6 * escala] }) }],
    }, estilo]}>
      <View style={{ width: 30 * escala, height: 30 * escala, borderRadius: 9 * escala, backgroundColor: `${color}22`, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icono} size={17 * escala} color={color} />
      </View>
      <View>
        <Text style={{ color: c.texto, fontWeight: '800', fontSize: 12.5 * escala }}>{titulo}</Text>
        <Text style={{ color, fontWeight: '700', fontSize: 11.5 * escala }}>{detalle}</Text>
      </View>
    </Animated.View>
  );
}

/** Fila de "Lo que debes hacer" dentro del celular. */
function Tarea({ color, ancho, escala }) {
  const c = useColores();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 * escala, backgroundColor: c.superficie, borderRadius: 8 * escala, padding: 7 * escala, borderWidth: 1, borderColor: c.borde }}>
      <View style={{ width: 16 * escala, height: 16 * escala, borderRadius: 8 * escala, backgroundColor: `${color}26`, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 7 * escala, height: 7 * escala, borderRadius: 4 * escala, backgroundColor: color }} />
      </View>
      <View style={{ flex: 1, gap: 4 * escala }}>
        <View style={{ height: 5 * escala, width: ancho, borderRadius: 3, backgroundColor: c.texto, opacity: 0.75 }} />
        <View style={{ height: 4 * escala, width: '55%', borderRadius: 3, backgroundColor: c.textoSuave, opacity: 0.45 }} />
      </View>
      <View style={{ width: 26 * escala, height: 11 * escala, borderRadius: 4 * escala, backgroundColor: c.primario }} />
    </View>
  );
}

/**
 * @param tamano ancho del celular en px (la escena mide ~1,75 veces eso de ancho)
 */
export default function Escena3D({ tamano = 230 }) {
  const c = useColores();
  const escala = tamano / 230;
  const anchoTel = tamano;
  const altoTel = tamano * 2.02;
  const ancho = tamano * 1.8;
  const alto = altoTel * 1.12;
  const radio = tamano * 0.15;
  const verde = c.esOscuro ? '#34d399' : '#15803d';
  const ambar = c.esOscuro ? '#fbbf24' : '#b45309';
  const rojo = c.esOscuro ? '#f87171' : '#b91c1c';

  return (
    <View style={{ width: ancho, height: alto, alignSelf: 'center' }} accessibilityRole="image"
      accessibilityLabel="Celular con AlDía mostrando la salud del vehículo y sus avisos">
      {/* Brillo naranja detrás y sombra en el piso */}
      <Svg width={ancho} height={alto} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="brillo3d" cx="50%" cy="45%" r="50%">
            <Stop offset="0" stopColor={c.acento} stopOpacity={c.esOscuro ? 0.32 : 0.22} />
            <Stop offset="1" stopColor={c.acento} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="piso3d" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#000" stopOpacity={c.esOscuro ? 0.6 : 0.28} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={ancho / 2} cy={alto * 0.45} rx={ancho * 0.5} ry={alto * 0.42} fill="url(#brillo3d)" />
        <Ellipse cx={ancho / 2 + tamano * 0.08} cy={alto * 0.95} rx={anchoTel * 0.62} ry={tamano * 0.07} fill="url(#piso3d)" />
      </Svg>

      {/* El celular en perspectiva */}
      <View style={{
        position: 'absolute', left: (ancho - anchoTel) / 2, top: alto * 0.02, width: anchoTel, height: altoTel,
        transform: [{ perspective: 1400 }, { rotateY: '-20deg' }, { rotateX: '9deg' }, { rotateZ: '3deg' }],
      }}>
        {/* grosor del celular: una copia más oscura corrida hacia atrás */}
        <View style={{ position: 'absolute', left: 9 * escala, top: 7 * escala, width: anchoTel, height: altoTel, borderRadius: radio, backgroundColor: '#050607' }} />
        <View style={{ position: 'absolute', left: 4.5 * escala, top: 3.5 * escala, width: anchoTel, height: altoTel, borderRadius: radio, backgroundColor: '#24272d' }} />
        {/* cuerpo */}
        <View style={{ width: anchoTel, height: altoTel, borderRadius: radio, backgroundColor: '#121418', padding: 8 * escala,
          boxShadow: '30px 40px 60px rgba(0,0,0,0.35)' }}>
          {/* pantalla */}
          <View style={{ flex: 1, borderRadius: radio * 0.8, overflow: 'hidden', backgroundColor: c.fondo }}>
            {/* barra superior */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 * escala, paddingHorizontal: 10 * escala, paddingTop: 16 * escala, paddingBottom: 8 * escala,
              backgroundColor: c.superficie, borderBottomWidth: 2, borderBottomColor: c.acento }}>
              <IconoAlDia tamano={18 * escala} />
              <Text style={{ color: c.texto, fontWeight: '800', fontSize: 13 * escala }}>Al<Text style={{ color: c.primario }}>Día</Text></Text>
            </View>
            <View style={{ padding: 9 * escala, gap: 8 * escala }}>
              {/* saludo con el anillo de salud */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.superficie, borderRadius: 10 * escala, padding: 10 * escala, borderWidth: 1, borderColor: c.borde }}>
                <View style={{ flex: 1, gap: 5 * escala }}>
                  <Text style={{ color: c.texto, fontWeight: '800', fontSize: 12 * escala }}>¡Hola, Laura!</Text>
                  <View style={{ height: 5 * escala, width: '85%', borderRadius: 3, backgroundColor: c.textoSuave, opacity: 0.4 }} />
                  <View style={{ height: 5 * escala, width: '60%', borderRadius: 3, backgroundColor: c.textoSuave, opacity: 0.4 }} />
                </View>
                <View style={{ width: 46 * escala, height: 46 * escala, borderRadius: 23 * escala, borderWidth: 5 * escala, borderColor: c.superficie2,
                  borderTopColor: c.acento, borderRightColor: c.acento, borderBottomColor: c.acento, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '20deg' }] }}>
                  <Text style={{ color: c.texto, fontWeight: '800', fontSize: 11 * escala, transform: [{ rotate: '-20deg' }] }}>82%</Text>
                </View>
              </View>
              <Text style={{ color: c.texto, fontWeight: '800', fontSize: 10.5 * escala }}>Lo que debes hacer</Text>
              <Tarea color={rojo} ancho="80%" escala={escala} />
              <Tarea color={ambar} ancho="65%" escala={escala} />
              <Tarea color={verde} ancho="72%" escala={escala} />
              {/* mini gráfica de gastos */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 * escala, height: 44 * escala, backgroundColor: c.superficie, borderRadius: 8 * escala, padding: 7 * escala, borderWidth: 1, borderColor: c.borde }}>
                {[0.35, 0.6, 0.25, 0.8, 0.45, 0.95, 0.5].map((h, i) => (
                  <View key={i} style={{ flex: 1, height: `${h * 100}%`, borderRadius: 2, backgroundColor: i === 5 ? c.primario : c.secundario, opacity: i === 5 ? 1 : 0.55 }} />
                ))}
              </View>
            </View>
            {/* barra de pestañas */}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 * escala,
              backgroundColor: c.superficie, borderTopWidth: 1, borderTopColor: c.borde }}>
              {['home', 'car-sport', 'document-text', 'calendar', 'notifications'].map((n, i) => (
                <Ionicons key={n} name={n} size={14 * escala} color={i === 0 ? c.primario : c.textoSuave} />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Avisos flotando alrededor */}
      <Aviso3D icono="checkmark-circle" color={verde} titulo="Aceite de motor" detalle="Al día" escala={escala} retraso={0}
        estilo={{ left: 0, top: alto * 0.16 }} />
      <Aviso3D icono="time" color={ambar} titulo="Pastillas de freno" detalle="85 % de desgaste" escala={escala} retraso={700}
        estilo={{ right: 0, top: alto * 0.42 }} />
      <Aviso3D icono="document-text" color={rojo} titulo="SOAT" detalle="Vence en 7 días" escala={escala} retraso={1400}
        estilo={{ left: tamano * 0.02, top: alto * 0.7 }} />
    </View>
  );
}
