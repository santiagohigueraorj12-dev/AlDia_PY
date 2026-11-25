// Barra superior de las pantallas públicas (inicio, iniciar sesión, crear cuenta).
// Izquierda: el logo (lleva a la página de inicio).
// Derecha: "Iniciar sesión" y "Crear cuenta" (se oculta el de la pantalla actual).
// En pantallas anchas también muestra enlaces a las secciones de la página de inicio.
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColores } from '../tema';
import { ANCHO_PAGINA, Boton, margenLateral } from './ui';
import LogoAlDia from './LogoAlDia';
import BotonTema from './BotonTema';

/** Logo oficial de AlDía (components/LogoAlDia.js): ícono + nombre. */
export function Logo({ tamano = 22 }) {
  const c = useColores();
  return <LogoAlDia tamano={tamano} color={c.texto} colorDia={c.primario} />;
}

/**
 * @param ocultar  'login' | 'registro'  botón que no se muestra (el de la pantalla actual)
 * @param enlaces  [{ texto, onPress }]  enlaces a secciones (solo en pantallas anchas)
 */
export default function EncabezadoPublico({ ocultar, enlaces = [] }) {
  const c = useColores();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ancha = width >= 800;
  const angosta = width < 430;      // celular: botones más pequeños
  const muyAngosta = width < 370;   // celular pequeño: solo "Crear cuenta" (en la portada está "Ya tengo cuenta")

  return (
    <View style={{
      backgroundColor: c.superficie, borderBottomWidth: 1, borderBottomColor: c.borde,
      paddingTop: insets.top + (angosta ? 8 : 12), paddingBottom: angosta ? 8 : 12, paddingHorizontal: angosta ? 12 : margenLateral(width),
    }}>
      {/* Usa el ancho de la pantalla (hasta 1440 px), igual que el contenido de la portada */}
      <View style={{ width: '100%', maxWidth: ANCHO_PAGINA, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: ancha ? 28 : 12 }}>
        <Pressable onPress={() => router.replace('/bienvenida')} accessibilityRole="link" accessibilityLabel="Ir al inicio">
          <Logo tamano={muyAngosta ? 16 : angosta ? 18 : 22} />
        </Pressable>

        {ancha && (
          <View style={{ flexDirection: 'row', gap: 22, marginLeft: 28 }}>
            {enlaces.map((e) => (
              <Pressable key={e.texto} onPress={e.onPress} accessibilityRole="link">
                <Text style={{ color: c.texto, fontWeight: '600', fontSize: 15 }}>{e.texto}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Esquina superior derecha */}
        <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: angosta ? 6 : 8, alignItems: 'center', flexShrink: 1 }}>
          <BotonTema sobreClaro />
          {ocultar !== 'login' && !(muyAngosta && ocultar !== 'registro') && (
            <Boton titulo={angosta ? 'Entrar' : 'Iniciar sesión'} tipo="normal" pequeno={angosta} onPress={() => router.push('/login')} />
          )}
          {ocultar !== 'registro' && (
            <Boton titulo="Crear cuenta" tipo="primario" pequeno={angosta} onPress={() => router.push('/registro')} />
          )}
        </View>
      </View>
    </View>
  );
}
