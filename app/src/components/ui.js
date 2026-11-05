// Componentes pequeños que se reutilizan en todas las pantallas.
// Así cada pantalla se lee fácil: <Pantalla>, <Tarjeta>, <Boton>, <Campo>...
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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

/**
 * Botón. tipo: 'primario' | 'normal' | 'peligro' | 'enlace'
 * icono: nombre de un ícono de Ionicons (opcional), se muestra antes del texto.
 * pequeno: botón más bajito, para acciones dentro de una tarjeta.
 */
export function Boton({ titulo, onPress, tipo = 'normal', icono, pequeno = false, deshabilitado = false, estilo }) {
  const c = useColores();
  const colores = {
    primario: { fondo: c.primario, texto: c.primarioTexto, borde: c.primario },
    normal: { fondo: c.superficie, texto: c.texto, borde: c.borde },
    peligro: { fondo: c.superficie, texto: c.vencida, borde: c.vencida },
    enlace: { fondo: 'transparent', texto: c.primario, borde: 'transparent' },
  }[tipo];
  const vertical = tipo === 'enlace' ? 4 : pequeno ? 7 : 11;
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={({ pressed }) => [
        {
          backgroundColor: colores.fondo, borderColor: colores.borde, borderWidth: 1, borderRadius: 10,
          paddingVertical: vertical, paddingHorizontal: tipo === 'enlace' ? 2 : pequeno ? 12 : 16,
          flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center',
          opacity: deshabilitado ? 0.5 : pressed ? 0.75 : 1,
        },
        estilo,
      ]}
    >
      {icono && <Ionicons name={icono} size={pequeno ? 16 : 18} color={colores.texto} />}
      <Text style={{ color: colores.texto, fontWeight: '600', fontSize: pequeno ? 14 : 15 }}>{titulo}</Text>
    </Pressable>
  );
}

/**
 * Ícono dentro de un círculo de color.
 * tono: 'primario' | 'bien' | 'proxima' | 'vencida' | 'neutro'
 */
export function Icono({ nombre, tono = 'primario', tamano = 40 }) {
  const c = useColores();
  const colores = {
    primario: [c.primarioSuave, c.primario],
    bien: [c.bienFondo, c.bien],
    proxima: [c.proximaFondo, c.proxima],
    vencida: [c.vencidaFondo, c.vencida],
    neutro: [c.superficie2, c.textoSuave],
  }[tono];
  return (
    <View style={{ width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: colores[0], alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={nombre} size={tamano * 0.5} color={colores[1]} />
    </View>
  );
}

/** Ícono de moto o carro dentro de un círculo, con el color del estado del vehículo. */
export function IconoVehiculo({ tipo, tono = 'primario', tamano = 48 }) {
  const c = useColores();
  const colores = { primario: [c.primarioSuave, c.primario], bien: [c.bienFondo, c.bien], proxima: [c.proximaFondo, c.proxima], vencida: [c.vencidaFondo, c.vencida] }[tono];
  return (
    <View style={{ width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: colores[0], alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={tipo === 'Moto' ? 'motorbike' : 'car-side'} size={tamano * 0.55} color={colores[1]} />
    </View>
  );
}

/** Título de una sección con ícono y, a la derecha, una acción opcional (ej.: "+ Agregar"). */
export function TituloSeccion({ titulo, icono, accion }) {
  const c = useColores();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
      {icono && <Ionicons name={icono} size={20} color={c.primario} />}
      <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: c.texto }} accessibilityRole="header">{titulo}</Text>
      {accion}
    </View>
  );
}

/**
 * Fila de una lista que se puede tocar: ícono a la izquierda, textos en el medio
 * y a la derecha lo que se quiera (una etiqueta, un valor) más una flecha ›.
 */
export function ElementoLista({ icono, tono, titulo, detalle, derecha, onPress, children, resaltado = false }) {
  const c = useColores();
  const contenido = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {icono && <Icono nombre={icono} tono={tono} />}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: c.texto, fontSize: 15, fontWeight: '700' }}>{titulo}</Text>
        {detalle ? <Text style={{ color: c.textoSuave, fontSize: 13.5 }}>{detalle}</Text> : null}
        {children}
      </View>
      {derecha}
      {onPress && <Ionicons name="chevron-forward" size={20} color={c.textoSuave} />}
    </View>
  );
  const estilo = { paddingVertical: 10, paddingHorizontal: resaltado ? 10 : 0, borderRadius: 10, backgroundColor: resaltado ? c.primarioSuave : 'transparent' };
  if (!onPress) return <View style={estilo}>{contenido}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [estilo, { opacity: pressed ? 0.7 : 1 }]}>
      {contenido}
    </Pressable>
  );
}

/**
 * Selector de secciones (como pestañas pequeñas dentro de una pantalla).
 * opciones: [{ id, titulo, icono }]
 */
export function Segmentos({ opciones, valor, onCambio }) {
  const c = useColores();
  // En pantallas angostas (celular) se quitan los íconos para que quepan los textos
  const conIconos = useWindowDimensions().width >= 440;
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.superficie2, borderRadius: 12, padding: 4, gap: 4 }} accessibilityRole="tablist">
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <Pressable key={o.id} onPress={() => onCambio(o.id)} accessibilityRole="tab" accessibilityState={{ selected: activo }}
            style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 9,
              backgroundColor: activo ? c.superficie : 'transparent', borderWidth: activo ? 1 : 0, borderColor: c.borde }}>
            {conIconos && o.icono && <Ionicons name={o.icono} size={17} color={activo ? c.primario : c.textoSuave} />}
            <Text style={{ color: activo ? c.primario : c.textoSuave, fontWeight: '700', fontSize: 14 }}>{o.titulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Mensaje para cuando una lista está vacía: ícono, explicación y un botón opcional. */
export function Vacio({ icono = 'information-circle-outline', titulo, texto, boton }) {
  return (
    <Tarjeta estilo={{ alignItems: 'center', paddingVertical: 26, gap: 10 }}>
      <Icono nombre={icono} tono="neutro" tamano={56} />
      {titulo && <Texto variante="subtitulo" estilo={{ textAlign: 'center' }}>{titulo}</Texto>}
      {texto && <Texto variante="suave" estilo={{ textAlign: 'center', maxWidth: 420 }}>{texto}</Texto>}
      {boton}
    </Tarjeta>
  );
}

/** Título numerado para los pasos de un formulario: (1) Datos del servicio */
export function Paso({ numero, titulo, ayuda }) {
  const c = useColores();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.primario, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.primarioTexto, fontWeight: '700' }}>{numero}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.texto, fontSize: 17, fontWeight: '700' }}>{titulo}</Text>
        {ayuda && <Text style={{ color: c.textoSuave, fontSize: 13 }}>{ayuda}</Text>}
      </View>
    </View>
  );
}

/** Etiqueta de un campo. Si es obligatorio muestra un asterisco rojo. */
export function EtiquetaCampo({ texto, obligatorio = false }) {
  const c = useColores();
  if (!texto) return null;
  return (
    <Text style={{ color: c.texto, fontWeight: '600', fontSize: 14 }}>
      {texto}{obligatorio && <Text style={{ color: c.vencida }}> *</Text>}
    </Text>
  );
}

/** Nota al inicio de un formulario: "Los campos con * son obligatorios." */
export function NotaObligatorios() {
  const c = useColores();
  return (
    <Text style={{ color: c.textoSuave, fontSize: 12.5 }}>
      Los campos con <Text style={{ color: c.vencida, fontWeight: '700' }}>*</Text> son obligatorios.
    </Text>
  );
}

/** Texto de ayuda gris, o el error en rojo si lo hay (el error tiene prioridad). */
export function MensajeCampo({ ayuda, error }) {
  const c = useColores();
  if (error) return <Text style={{ color: c.vencida, fontSize: 13 }} accessibilityRole="alert">⚠ {error}</Text>;
  if (ayuda) return <Text style={{ color: c.textoSuave, fontSize: 12.5 }}>{ayuda}</Text>;
  return null;
}

/** Estilo de la caja de un campo; el borde se pone rojo si hay error. */
export function estiloCaja(c, error) {
  return {
    borderWidth: error ? 1.5 : 1, borderColor: error ? c.vencida : c.borde, borderRadius: 10,
    padding: 11, fontSize: 15, color: c.texto, backgroundColor: c.superficie,
  };
}

/**
 * Campo de texto con su etiqueta. Recibe las mismas props que TextInput, más:
 *   obligatorio -> muestra * en la etiqueta
 *   error       -> borde rojo y mensaje debajo
 *   ayuda       -> texto gris debajo (cuando no hay error)
 */
export function Campo({ etiqueta, ayuda, error, obligatorio = false, ...props }) {
  const c = useColores();
  return (
    <View style={{ gap: 4 }}>
      <EtiquetaCampo texto={etiqueta} obligatorio={obligatorio} />
      <TextInput placeholderTextColor={c.textoSuave} style={estiloCaja(c, error)} {...props} />
      <MensajeCampo ayuda={ayuda} error={error} />
    </View>
  );
}

/** Campo de contraseña con botón para ver u ocultar lo escrito. */
export function CampoPassword({ etiqueta, ayuda, error, obligatorio = false, ...props }) {
  const c = useColores();
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: 4 }}>
      <EtiquetaCampo texto={etiqueta} obligatorio={obligatorio} />
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          placeholderTextColor={c.textoSuave}
          style={[estiloCaja(c, error), { paddingRight: 46 }]}
          secureTextEntry={!visible}
          autoCapitalize="none"
          {...props}
        />
        <Pressable
          onPress={() => setVisible(!visible)}
          style={{ position: 'absolute', right: 10, padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={c.textoSuave} />
        </Pressable>
      </View>
      <MensajeCampo ayuda={ayuda} error={error} />
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

/**
 * Cuadro de cifra grande (ej.: "4 partes vencidas").
 * icono y tono son opcionales: el tono pinta el ícono (rojo, amarillo, verde...).
 * ancho: '47%' (dos por fila) o '22%' (cuatro por fila en el computador).
 */
export function Cifra({ valor, texto, icono, tono = 'primario', ancho = '47%' }) {
  const c = useColores();
  return (
    <View style={{ flexBasis: ancho, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 12, padding: 12 }}>
      {icono && <Icono nombre={icono} tono={tono} tamano={36} />}
      <View style={{ flexShrink: 1 }}>
        <Text style={{ color: c.texto, fontSize: 20, fontWeight: '700' }}>{valor}</Text>
        <Text style={{ color: c.textoSuave, fontSize: 12.5 }}>{texto}</Text>
      </View>
    </View>
  );
}

/** Aviso de color: tipo 'error' | 'ok' | 'aviso' | 'info'. Puede llevar un botón debajo (accion). */
export function Aviso({ tipo = 'error', children, accion }) {
  const c = useColores();
  if (!children) return null;
  const clase = { error: 'vencida', ok: 'bien', aviso: 'proxima', info: 'primario' }[tipo];
  const fondo = tipo === 'info' ? c.primarioSuave : c[`${clase}Fondo`];
  const icono = { error: 'alert-circle', ok: 'checkmark-circle', aviso: 'warning', info: 'information-circle' }[tipo];
  return (
    <View style={{ backgroundColor: fondo, borderRadius: 10, padding: 12, gap: 10 }} accessibilityRole="alert">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Ionicons name={icono} size={20} color={c[clase]} />
        <Text style={{ color: c[clase], fontSize: 14, flex: 1 }}>{children}</Text>
      </View>
      {accion && <View style={{ alignSelf: 'flex-start', marginLeft: 28 }}>{accion}</View>}
    </View>
  );
}

export function Cargando() {
  const c = useColores();
  return <View style={{ flex: 1, padding: 40, backgroundColor: c.fondo }}><ActivityIndicator color={c.primario} size="large" /></View>;
}

/** Casilla de verificación (React Native no trae una). El texto puede ser cualquier contenido. */
export function Casilla({ marcada, onCambio, error, children }) {
  const c = useColores();
  return (
    <View style={{ gap: 2 }}>
      <Pressable onPress={() => onCambio(!marcada)} accessibilityRole="checkbox" accessibilityState={{ checked: marcada }}
        style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 }}>
        <Ionicons name={marcada ? 'checkbox' : 'square-outline'} size={24} color={marcada ? c.primario : error ? c.vencida : c.textoSuave} />
        <View style={{ flex: 1 }}>{typeof children === 'string' ? <Text style={{ color: c.texto, fontSize: 14 }}>{children}</Text> : children}</View>
      </Pressable>
      <MensajeCampo error={error} />
    </View>
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
