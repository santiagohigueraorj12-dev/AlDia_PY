// =====================================================================
// ASISTENTE AlDía (RF-21): botón flotante + ventana de chat.
// El usuario elige un vehículo y toca una de las preguntas prefabricadas;
// el backend arma la respuesta con los datos reales de ese vehículo.
//
// - El botón aparece en las pantallas principales y en el detalle de un
//   vehículo; no aparece en los formularios para no tapar "Guardar".
// - Si se abre desde el detalle de un vehículo, ese vehículo ya viene elegido.
// =====================================================================
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api } from '../api/cliente';
import { useSesion } from '../context/SesionContext';
import { useColores } from '../tema';

const RUTAS_CON_PESTANAS = ['/', '/vehiculos', '/calendario', '/notificaciones', '/cuenta', '/admin'];

export default function AsistenteFlotante() {
  const c = useColores();
  const ruta = usePathname();
  const insets = useSafeAreaInsets();
  const [abierto, setAbierto] = useState(false);

  // ¿Dónde se muestra el botón?
  const enDetalle = ruta.match(/^\/vehiculo\/(\d+)$/);   // detalle de un vehículo: /vehiculo/5
  const conPestanas = RUTAS_CON_PESTANAS.includes(ruta);
  if (!enDetalle && !conPestanas) return null;

  // Sobre las pestañas de abajo, o en la esquina si no hay pestañas
  const abajo = (conPestanas ? 72 : 20) + insets.bottom;

  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel="Abrir el asistente de AlDía"
        style={({ pressed }) => ({
          position: 'absolute', right: 18, bottom: abajo,
          width: 58, height: 58, borderRadius: 29, backgroundColor: c.primario,
          alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1,
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
        })}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color={c.primarioTexto} />
      </Pressable>

      {abierto && (
        <VentanaChat
          vehiculoInicial={enDetalle ? Number(enDetalle[1]) : null}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}

/** La ventana del chat. En el computador es una tarjeta en la esquina; en el celular ocupa toda la pantalla. */
function VentanaChat({ vehiculoInicial, onCerrar }) {
  const c = useColores();
  const { usuario } = useSesion();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ancha = width >= 700;

  const [vehiculos, setVehiculos] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [elegido, setElegido] = useState(null);       // vehículo sobre el que se pregunta
  const [mensajes, setMensajes] = useState([]);       // { de: 'usuario' | 'asistente' | 'aviso', ... }
  const [pensando, setPensando] = useState(false);
  const scroll = useRef(null);

  // Al abrir: se cargan los vehículos y las preguntas
  useEffect(() => {
    Promise.all([api('/vehiculos'), api('/asistente/preguntas')])
      .then(([lista, pregs]) => {
        setVehiculos(lista);
        setPreguntas(pregs);
        const inicial = lista.find((v) => v.id === vehiculoInicial) || (lista.length === 1 ? lista[0] : null);
        setElegido(inicial);
        setMensajes([{
          de: 'asistente',
          texto: lista.length === 0
            ? `Hola, ${usuario.nombre.split(' ')[0]}. Aún no tienes vehículos registrados: registra uno y podré responderte sobre él.`
            : `Hola, ${usuario.nombre.split(' ')[0]}. Soy el asistente de AlDía. ${inicial
              ? `Te respondo sobre ${descripcion(inicial)}: toca una pregunta.`
              : 'Elige un vehículo arriba y toca una pregunta.'}`,
        }]);
      })
      .catch((e) => setMensajes([{ de: 'asistente', texto: `No pude cargar tus datos: ${e.message}` }]));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Cada vez que llega un mensaje, se baja hasta el final del chat
  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [mensajes, pensando]);

  function elegirVehiculo(v) {
    if (v.id === elegido?.id) return;
    setElegido(v);
    setMensajes((m) => [...m, { de: 'aviso', texto: `Ahora hablamos de ${descripcion(v)}` }]);
  }

  async function preguntar(p) {
    if (!elegido || pensando) return;
    setMensajes((m) => [...m, { de: 'usuario', texto: p.texto }]);
    setPensando(true);
    try {
      const respuesta = await api(`/asistente/vehiculos/${elegido.id}/${p.id}`);
      setMensajes((m) => [...m, { de: 'asistente', ...respuesta }]);
    } catch (e) {
      setMensajes((m) => [...m, { de: 'asistente', texto: `No pude responder: ${e.message}` }]);
    } finally {
      setPensando(false);
    }
  }

  const tarjeta = ancha
    ? { position: 'absolute', right: 20, bottom: 20, width: 420, height: Math.min(640, height - 40), borderRadius: 18 }
    : { flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom };

  return (
    <Modal transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={{ flex: 1, backgroundColor: ancha ? 'rgba(10,15,25,0.25)' : c.fondo }}>
        <View style={[{ backgroundColor: c.fondo, overflow: 'hidden', borderColor: c.borde, borderWidth: ancha ? 1 : 0 }, tarjeta]}>
          {/* Encabezado */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: c.primario }}>
            <Ionicons name="chatbubble-ellipses" size={22} color={c.primarioTexto} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.primarioTexto, fontWeight: '800', fontSize: 16 }}>Asistente AlDía</Text>
              <Text style={{ color: c.primarioTexto, opacity: 0.85, fontSize: 12.5 }}>Responde con los datos de tus vehículos</Text>
            </View>
            <Pressable onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar el asistente" style={{ padding: 4 }}>
              <Ionicons name="close" size={26} color={c.primarioTexto} />
            </Pressable>
          </View>

          {/* Elegir vehículo */}
          {vehiculos && vehiculos.length > 1 && (
            <View style={{ padding: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: c.borde, backgroundColor: c.superficie }}>
              <Text style={{ color: c.textoSuave, fontSize: 12.5 }}>¿Sobre qué vehículo?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {vehiculos.map((v) => (
                  <Chip key={v.id} activo={v.id === elegido?.id} onPress={() => elegirVehiculo(v)}
                    texto={`${v.tipo === 'Moto' ? '🏍️' : '🚗'} ${v.placa}`} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Conversación */}
          <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 10 }}>
            {vehiculos === null && <ActivityIndicator color={c.primario} />}
            {mensajes.map((m, i) => <Mensaje key={i} mensaje={m} />)}
            {pensando && <Burbuja de="asistente"><Text style={{ color: c.textoSuave }}>Revisando tus datos…</Text></Burbuja>}
          </ScrollView>

          {/* Preguntas */}
          <View style={{ padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: c.borde, backgroundColor: c.superficie }}>
            {vehiculos?.length === 0 ? (
              <Chip activo texto="Registrar un vehículo" onPress={() => { onCerrar(); router.push('/vehiculo/nuevo'); }} />
            ) : !elegido ? (
              <Text style={{ color: c.textoSuave, fontSize: 13.5, textAlign: 'center' }}>Primero elige un vehículo arriba.</Text>
            ) : (
              <>
                <Text style={{ color: c.textoSuave, fontSize: 12.5 }}>Pregúntame sobre {elegido.placa}:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {preguntas.map((p) => <Chip key={p.id} texto={p.texto} onPress={() => preguntar(p)} deshabilitado={pensando} />)}
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** "tu moto ABC12D (Yamaha NMAX 155)" */
function descripcion(v) {
  return `tu ${v.tipo.toLowerCase()} ${v.placa} (${v.marca} ${v.modelo})`;
}

/** Botón redondeado para vehículos y preguntas. */
function Chip({ texto, onPress, activo = false, deshabilitado = false }) {
  const c = useColores();
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={({ pressed }) => ({
        borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1,
        borderColor: activo ? c.primario : c.borde,
        backgroundColor: activo ? c.primario : c.primarioSuave,
        opacity: deshabilitado ? 0.5 : pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ color: activo ? c.primarioTexto : c.primario, fontWeight: '600', fontSize: 13.5 }}>{texto}</Text>
    </Pressable>
  );
}

/** Contenedor de un mensaje: a la derecha (usuario) o a la izquierda (asistente). */
function Burbuja({ de, children }) {
  const c = useColores();
  const esUsuario = de === 'usuario';
  return (
    <View style={{
      alignSelf: esUsuario ? 'flex-end' : 'flex-start', maxWidth: '88%', gap: 6,
      backgroundColor: esUsuario ? c.primario : c.superficie,
      borderColor: c.borde, borderWidth: esUsuario ? 0 : 1,
      borderRadius: 14, borderBottomRightRadius: esUsuario ? 4 : 14, borderBottomLeftRadius: esUsuario ? 14 : 4,
      paddingHorizontal: 12, paddingVertical: 9,
    }}>
      {children}
    </View>
  );
}

/** Un mensaje del chat. Las respuestas del asistente pueden traer una lista con colores. */
function Mensaje({ mensaje }) {
  const c = useColores();
  if (mensaje.de === 'aviso') {
    return <Text style={{ alignSelf: 'center', color: c.textoSuave, fontSize: 12.5, fontStyle: 'italic' }}>— {mensaje.texto} —</Text>;
  }
  if (mensaje.de === 'usuario') {
    return <Burbuja de="usuario"><Text style={{ color: c.primarioTexto, fontSize: 14.5 }}>{mensaje.texto}</Text></Burbuja>;
  }
  const colorPunto = { bien: c.bienBarra, proxima: c.proximaBarra, vencida: c.vencidaBarra };
  return (
    <Burbuja de="asistente">
      <Text style={{ color: c.texto, fontSize: 14.5 }}>{mensaje.texto}</Text>
      {mensaje.items?.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, marginTop: 6, backgroundColor: colorPunto[item.estado] || c.textoSuave }} />
          <Text style={{ color: c.texto, fontSize: 14, flex: 1 }}>{item.texto}</Text>
        </View>
      ))}
      {mensaje.nota && <Text style={{ color: c.textoSuave, fontSize: 13 }}>{mensaje.nota}</Text>}
    </Burbuja>
  );
}
