// Celebración al completar algo importante (registrar un cambio, renovar un documento...).
// Cae confeti de colores y aparece un ✓ grande con un mensaje, por menos de 2 segundos.
// Vive en la raíz de la app: así se ve aunque la pantalla se cierre justo después.
//
//   const celebrar = useCelebracion();
//   celebrar('¡Cambio registrado!');
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const NATIVO = Platform.OS !== 'web';
const COLORES = ['#ff6b1a', '#ff9a5c', '#ffffff', '#94a3b8', '#34d399', '#fbbf24', '#1c1f24'];  // paleta "Carbono"
const PIEZAS = 36;
const DURACION = 1900;

const CelebracionContext = createContext(() => {});

export function useCelebracion() {
  return useContext(CelebracionContext);
}

export function CelebracionProvider({ children }) {
  const [mensaje, setMensaje] = useState(null);  // { texto, id }
  const celebrar = useCallback((texto = '¡Listo!') => setMensaje({ texto, id: Date.now() }), []);
  return (
    <CelebracionContext.Provider value={celebrar}>
      {children}
      {mensaje && <Fiesta key={mensaje.id} texto={mensaje.texto} alTerminar={() => setMensaje(null)} />}
    </CelebracionContext.Provider>
  );
}

function Fiesta({ texto, alTerminar }) {
  const { width, height } = useWindowDimensions();
  const avance = useRef(new Animated.Value(0)).current;
  const insignia = useRef(new Animated.Value(0)).current;
  const terminar = useRef(alTerminar);
  terminar.current = alTerminar;

  // Cada pieza con su posición, color, tamaño, giro y retraso al azar
  const piezas = useMemo(() => Array.from({ length: PIEZAS }, (_, i) => ({
    x: Math.random() * width,
    deriva: (Math.random() - 0.5) * 120,
    color: COLORES[i % COLORES.length],
    ancho: 7 + Math.random() * 7,
    alto: 10 + Math.random() * 8,
    giro: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
    retraso: Math.random() * 0.25,
    redonda: i % 4 === 0,
  })), [width]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(avance, { toValue: 1, duration: DURACION, easing: Easing.linear, useNativeDriver: NATIVO }),
      Animated.sequence([
        Animated.spring(insignia, { toValue: 1, friction: 5, tension: 120, useNativeDriver: NATIVO }),
        Animated.delay(DURACION - 900),
        Animated.timing(insignia, { toValue: 0, duration: 300, useNativeDriver: NATIVO }),
      ]),
    ]).start(() => terminar.current());
  }, [avance, insignia]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} accessibilityLiveRegion="polite">
      {piezas.map((p, i) => {
        const inicio = p.retraso;
        const caida = avance.interpolate({ inputRange: [0, inicio, 1], outputRange: [-30, -30, height + 40] });
        const lado = avance.interpolate({ inputRange: [0, 1], outputRange: [0, p.deriva] });
        const giro = avance.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.giro}deg`] });
        return (
          <Animated.View key={i} style={{
            position: 'absolute', left: p.x, top: 0, width: p.ancho, height: p.redonda ? p.ancho : p.alto,
            borderRadius: p.redonda ? p.ancho : 2, backgroundColor: p.color,
            transform: [{ translateY: caida }, { translateX: lado }, { rotate: giro }],
          }} />
        );
      })}

      {/* ✓ grande con el mensaje */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={{
          alignItems: 'center', gap: 10, backgroundColor: 'rgba(15,23,42,0.88)', paddingVertical: 22, paddingHorizontal: 30, borderRadius: 24,
          opacity: insignia, transform: [{ scale: insignia.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark" size={42} color="#ffffff" />
          </View>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{texto}</Text>
        </Animated.View>
      </View>
    </View>
  );
}
