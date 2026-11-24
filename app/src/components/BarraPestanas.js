// Barra de navegación de la app (con sesión iniciada).
//
// Computador (pantalla ancha): una sola barra ARRIBA con el logo, las pestañas,
//   la campana de alertas, el botón de tema y el acceso a "Mi cuenta".
// Celular: las pestañas van ABAJO (al alcance del pulgar) y la campana, el tema
//   y la cuenta quedan en la barra de arriba de cada pantalla (AccionesEncabezado).
//
// Las pantallas "notificaciones" y "cuenta" no son pestañas: se abren con la
// campana y con el círculo de la cuenta.
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColores } from '../tema';
import { useSesion } from '../context/SesionContext';
import { ANCHO_PAGINA, margenLateral } from './ui';
import BotonTema from './BotonTema';
import LogoAlDia from './LogoAlDia';

/** Pestañas que se muestran en la barra, en este orden. */
export const PESTANAS_VISIBLES = ['index', 'vehiculos', 'danos', 'documentos', 'calendario', 'admin'];

/** Campana con el número de alertas sin leer. */
function Campana({ noLeidas, activa }) {
  const c = useColores();
  return (
    <Pressable onPress={() => router.push('/notificaciones')} accessibilityRole="button" accessibilityLabel={`Alertas${noLeidas ? `: ${noLeidas} sin leer` : ''}`} hitSlop={6}
      style={({ pressed, hovered }) => ({
        width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
        backgroundColor: activa ? c.primarioSuave : hovered ? c.superficie2 : 'transparent', opacity: pressed ? 0.6 : 1,
      })}>
      <Ionicons name={activa ? 'notifications' : 'notifications-outline'} size={21} color={activa ? c.primario : c.texto} />
      {noLeidas > 0 && (
        <View style={{ position: 'absolute', top: 2, right: 1, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: c.vencidaBarra, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.superficie }}>
          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>{noLeidas > 99 ? '99+' : noLeidas}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Círculo con las iniciales del usuario: abre "Mi cuenta". */
function BotonCuenta({ activa, conNombre = false }) {
  const c = useColores();
  const { usuario } = useSesion();
  const nombre = usuario?.nombre || '';
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
  return (
    <Pressable onPress={() => router.push('/cuenta')} accessibilityRole="button" accessibilityLabel="Mi cuenta" hitSlop={6}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 3, paddingRight: conNombre ? 12 : 3, height: 38, borderRadius: 19,
        backgroundColor: activa ? c.primarioSuave : hovered ? c.superficie2 : 'transparent', opacity: pressed ? 0.6 : 1,
        borderWidth: conNombre ? 1 : 0, borderColor: activa ? c.primario : c.borde,
      })}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.primario, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.primarioTexto, fontWeight: '800', fontSize: 13 }}>{iniciales}</Text>
      </View>
      {conNombre && <Text style={{ color: c.texto, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{nombre.split(' ')[0]}</Text>}
    </Pressable>
  );
}

/** Lado derecho de la barra de cada pantalla en el celular: campana, tema y cuenta. */
export function AccionesEncabezado({ noLeidas, ruta }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 10 }}>
      <Campana noLeidas={noLeidas} activa={ruta === '/notificaciones'} />
      <BotonTema sobreClaro />
      <BotonCuenta activa={ruta === '/cuenta'} />
    </View>
  );
}

/**
 * Barra de pestañas (prop "tabBar" de las Tabs).
 * arriba = true en el computador; false en el celular.
 */
export default function BarraPestanas({ state, descriptors, navigation, arriba, noLeidas, ruta, ancho }) {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { usuario } = useSesion();
  const rutas = state.routes
    .map((r, i) => ({ r, i, opciones: descriptors[r.key].options }))
    // "Administración" solo para el administrador
    .filter(({ r }) => PESTANAS_VISIBLES.includes(r.name) && (r.name !== 'admin' || usuario?.rol === 'admin'));

  const ir = (r, enfocada) => {
    const evento = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
    if (!enfocada && !evento.defaultPrevented) navigation.navigate(r.name);
  };

  if (arriba) {
    return (
      <View style={{ backgroundColor: c.superficie, borderBottomWidth: 2, borderBottomColor: c.acento, boxShadow: `0 4px 16px ${c.sombra}` }}>
        <View style={{ width: '100%', maxWidth: ANCHO_PAGINA, alignSelf: 'center', paddingHorizontal: margenLateral(ancho), height: 64, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable onPress={() => navigation.navigate('index')} accessibilityRole="link" accessibilityLabel="Ir al inicio" style={{ marginRight: 22 }}>
            <LogoAlDia tamano={22} color={c.texto} colorDia={c.esOscuro ? '#ffd166' : c.primario} />
          </Pressable>
          {rutas.map(({ r, i, opciones }) => {
            const enfocada = state.index === i;
            return (
              <Pressable key={r.key} onPress={() => ir(r, enfocada)} accessibilityRole="tab" accessibilityState={{ selected: enfocada }}
                style={({ hovered, pressed }) => ({
                  height: 64, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1,
                  borderBottomWidth: 3, borderBottomColor: enfocada ? c.primario : 'transparent',
                  backgroundColor: hovered && !enfocada ? c.superficie2 : 'transparent',
                })}>
                {opciones.tabBarIcon?.({ color: enfocada ? c.primario : c.textoSuave, size: 19, focused: enfocada })}
                <Text style={{ color: enfocada ? c.primario : c.texto, fontWeight: enfocada ? '800' : '600', fontSize: 15 }}>{opciones.title}</Text>
              </Pressable>
            );
          })}
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Campana noLeidas={noLeidas} activa={ruta === '/notificaciones'} />
            <BotonTema sobreClaro />
            <BotonCuenta activa={ruta === '/cuenta'} conNombre />
          </View>
        </View>
      </View>
    );
  }

  // Celular: pestañas abajo
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.superficie, borderTopWidth: 1, borderTopColor: c.borde, paddingBottom: insets.bottom, boxShadow: `0 -4px 16px ${c.sombra}` }}>
      {rutas.map(({ r, i, opciones }) => {
        const enfocada = state.index === i;
        const color = enfocada ? c.primario : c.textoSuave;
        return (
          <Pressable key={r.key} onPress={() => ir(r, enfocada)} accessibilityRole="tab" accessibilityState={{ selected: enfocada }} accessibilityLabel={opciones.title}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, gap: 2, opacity: pressed ? 0.6 : 1 })}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 3, borderRadius: 99, backgroundColor: enfocada ? c.primarioSuave : 'transparent' }}>
              {opciones.tabBarIcon?.({ color, size: 21, focused: enfocada })}
            </View>
            <Text style={{ color, fontSize: 11, fontWeight: enfocada ? '800' : '600' }} numberOfLines={1}>{opciones.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
