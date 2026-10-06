// Componentes pequeños que se reutilizan en todas las pantallas.
// Así cada pantalla se lee fácil: <Pantalla>, <Tarjeta>, <Boton>, <Campo>...
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColores } from '../tema';

/**
 * Contenedor con scroll y márgenes para el contenido de una pantalla.
 * Si recibe onRefrescar, se puede deslizar hacia abajo para recargar.
 */
export function Pantalla({ children, onRefrescar, refrescando = false }) {
  const c = useColores();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.fondo }}
      // En el computador el contenido no pasa de 820 px de ancho y queda centrado
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14, width: '100%', maxWidth: 820, alignSelf: 'center' }}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefrescar ? <RefreshControl refreshing={refrescando} onRefresh={onRefrescar} tintColor={c.primario} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Tarjeta({ children, estilo }) {
  const c = useColores();
  return (
    <View style={[{ backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 12, padding: 14, gap: 8 }, estilo]}>
      {children}
    </View>
  );
}

/** Texto con variantes: titulo, subtitulo, normal, suave, pequeno. */
export function Texto({ variante = 'normal', estilo, children, ...props }) {
  const c = useColores();
  const variantes = {
    titulo: { fontSize: 22, fontWeight: '700', color: c.texto },
    subtitulo: { fontSize: 17, fontWeight: '700', color: c.texto },
    normal: { fontSize: 15, color: c.texto },
    negrita: { fontSize: 15, color: c.texto, fontWeight: '700' },
    suave: { fontSize: 14, color: c.textoSuave },
    pequeno: { fontSize: 12.5, color: c.textoSuave },
  };
  return <Text style={[variantes[variante], estilo]} {...props}>{children}</Text>;
}

/** Botón. tipo: 'primario' | 'normal' | 'peligro' | 'enlace' */
export function Boton({ titulo, onPress, tipo = 'normal', deshabilitado = false, estilo }) {
  const c = useColores();
  const colores = {
    primario: { fondo: c.primario, texto: c.primarioTexto, borde: c.primario },
    normal: { fondo: c.superficie, texto: c.texto, borde: c.borde },
    peligro: { fondo: c.superficie, texto: c.vencida, borde: c.vencida },
    enlace: { fondo: 'transparent', texto: c.primario, borde: 'transparent' },
  }[tipo];
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          backgroundColor: colores.fondo, borderColor: colores.borde, borderWidth: 1, borderRadius: 10,
          paddingVertical: tipo === 'enlace' ? 4 : 11, paddingHorizontal: tipo === 'enlace' ? 2 : 16,
          alignItems: 'center', opacity: deshabilitado ? 0.5 : pressed ? 0.75 : 1,
        },
        estilo,
      ]}
    >
      <Text style={{ color: colores.texto, fontWeight: '600', fontSize: 15 }}>{titulo}</Text>
    </Pressable>
  );
}

/** Campo de texto con su etiqueta. Recibe las mismas props que TextInput. */
export function Campo({ etiqueta, ayuda, ...props }) {
  const c = useColores();
  return (
    <View style={{ gap: 4 }}>
      {etiqueta && <Text style={{ color: c.texto, fontWeight: '600', fontSize: 14 }}>{etiqueta}</Text>}
      <TextInput
        placeholderTextColor={c.textoSuave}
        style={{ borderWidth: 1, borderColor: c.borde, borderRadius: 10, padding: 11, fontSize: 15, color: c.texto, backgroundColor: c.superficie }}
        {...props}
      />
      {ayuda && <Text style={{ color: c.textoSuave, fontSize: 12.5 }}>{ayuda}</Text>}
    </View>
  );
}

/** Etiqueta de color para un estado. Uso: <Etiqueta estado={ESTADO_PARTE.vencida} /> */
export function Etiqueta({ estado }) {
  const c = useColores();
  if (!estado) return null;
  return (
    <View style={{ backgroundColor: c[`${estado.clase}Fondo`], borderRadius: 99, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Text style={{ color: c[estado.clase], fontWeight: '700', fontSize: 12 }}>{estado.texto}</Text>
    </View>
  );
}

/** Barra de desgaste (RNF-04). Se llena hasta el 100 % aunque el desgaste sea mayor. */
export function BarraDesgaste({ porcentaje, estado }) {
  const c = useColores();
  return (
    <View style={{ height: 8, backgroundColor: c.superficie2, borderRadius: 99, overflow: 'hidden' }}
      accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(porcentaje) }}>
      <View style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%`, height: '100%', backgroundColor: c[`${estado}Barra`], borderRadius: 99 }} />
    </View>
  );
}

/** Cuadro de cifra grande para el panel (ej.: "4 partes vencidas"). */
export function Cifra({ valor, texto }) {
  const c = useColores();
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 12, padding: 12 }}>
      <Text style={{ color: c.texto, fontSize: 20, fontWeight: '700' }}>{valor}</Text>
      <Text style={{ color: c.textoSuave, fontSize: 12.5 }}>{texto}</Text>
    </View>
  );
}

/** Aviso de color: tipo 'error' | 'ok' | 'aviso' */
export function Aviso({ tipo = 'error', children }) {
  const c = useColores();
  if (!children) return null;
  const clase = { error: 'vencida', ok: 'bien', aviso: 'proxima' }[tipo];
  return (
    <View style={{ backgroundColor: c[`${clase}Fondo`], borderRadius: 10, padding: 12 }} accessibilityRole="alert">
      <Text style={{ color: c[clase], fontSize: 14 }}>{children}</Text>
    </View>
  );
}

export function Cargando() {
  const c = useColores();
  return <View style={{ flex: 1, padding: 40, backgroundColor: c.fondo }}><ActivityIndicator color={c.primario} size="large" /></View>;
}

/** Casilla de verificación (React Native no trae una). El texto puede ser cualquier contenido. */
export function Casilla({ marcada, onCambio, children }) {
  const c = useColores();
  return (
    <Pressable onPress={() => onCambio(!marcada)} accessibilityRole="checkbox" accessibilityState={{ checked: marcada }}
      style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 }}>
      <Ionicons name={marcada ? 'checkbox' : 'square-outline'} size={24} color={marcada ? c.primario : c.textoSuave} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Text style={{ color: c.texto, fontSize: 14 }}>{children}</Text> : children}</View>
    </Pressable>
  );
}

/** Fila con elementos uno al lado del otro (y que bajan de línea si no caben). */
export function Fila({ children, estilo }) {
  return <View style={[estilos.fila, estilo]}>{children}</View>;
}

/** Línea divisoria entre elementos de una lista. */
export function Separador() {
  const c = useColores();
  return <View style={{ height: 1, backgroundColor: c.borde, marginVertical: 4 }} />;
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
});
