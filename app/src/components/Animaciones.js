// Animaciones de la app: que todo se sienta fluido y profesional.
//  - useProgreso: un número que sube suave de 0 al valor (anillos y barras).
//  - Aparecer: el contenido entra deslizándose hacia arriba y aclarándose.
//  - Siluetas: mientras carga, figuras grises que "respiran" en vez de un círculo girando.
// Solo usa Animated de React Native: funciona igual en el celular y en el navegador.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { useColores } from '../tema';

// En el navegador no existe el "driver nativo" de animaciones
const NATIVO = Platform.OS !== 'web';

/** Curva suave: arranca rápido y frena al final. */
const suavizar = (t) => 1 - (1 - t) ** 3;

/**
 * Número que va de su valor anterior al nuevo en "duracion" ms.
 *   const p = useProgreso(82);   // 0 → 82 en 900 ms
 */
export function useProgreso(destino, duracion = 900) {
  const [valor, setValor] = useState(0);
  const desdeRef = useRef(0);
  useEffect(() => {
    const desde = desdeRef.current;
    const inicio = Date.now();
    let cuadro;
    const paso = () => {
      const t = Math.min(1, (Date.now() - inicio) / duracion);
      const actual = desde + (destino - desde) * suavizar(t);
      desdeRef.current = actual;
      setValor(actual);
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [destino, duracion]);
  return valor;
}

/** El contenido aparece deslizándose desde abajo. "retraso" en ms para escalonar. */
export function Aparecer({ children, retraso = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 380, delay: retraso, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVO,
    }).start();
  }, [anim, retraso]);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    }}>
      {children}
    </Animated.View>
  );
}

/** Opacidad que sube y baja sin parar (para las siluetas de carga). */
function usePulso() {
  const anim = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 650, useNativeDriver: NATIVO }),
      Animated.timing(anim, { toValue: 0.45, duration: 650, useNativeDriver: NATIVO }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [anim]);
  return anim;
}

/** Un bloque gris redondeado que "respira". */
function Bloque({ alto, ancho = '100%', radio = 12, pulso, estilo }) {
  const c = useColores();
  return <Animated.View style={[{ height: alto, width: ancho, borderRadius: radio, backgroundColor: c.superficie2, opacity: pulso }, estilo]} />;
}

/**
 * Pantalla de carga con siluetas: insinúa lo que va a aparecer
 * (un encabezado, cifras y tarjetas), como YouTube o LinkedIn.
 */
export function Siluetas() {
  const c = useColores();
  const pulso = usePulso();
  const tarjeta = (i) => (
    <View key={i} style={{ backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 16, padding: 14, gap: 10, flexDirection: 'row', alignItems: 'center' }}>
      <Bloque alto={52} ancho={76} radio={10} pulso={pulso} />
      <View style={{ flex: 1, gap: 8 }}>
        <Bloque alto={14} ancho="45%" pulso={pulso} />
        <Bloque alto={11} ancho="80%" pulso={pulso} />
        <Bloque alto={11} ancho="60%" pulso={pulso} />
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }} accessibilityLabel="Cargando" accessibilityRole="progressbar">
      <View style={{ padding: 16, gap: 14, width: '100%', maxWidth: 820, alignSelf: 'center' }}>
        <Bloque alto={110} radio={20} pulso={pulso} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Bloque alto={64} ancho="49%" radio={16} pulso={pulso} />
          <Bloque alto={64} ancho="49%" radio={16} pulso={pulso} />
        </View>
        {[0, 1, 2].map(tarjeta)}
      </View>
    </View>
  );
}
