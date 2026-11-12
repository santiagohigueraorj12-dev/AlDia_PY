// Campo para elegir una opción de una lista (tipo de documento, departamento...).
// Se ve como un campo normal; al tocarlo se abre una ventana con las opciones.
// Si la lista es larga (más de 8), la ventana trae un buscador.
//
//   <Selector etiqueta="Departamento" opciones={DEPARTAMENTOS} valor={d} onCambio={setD} />
//   opciones: [{ valor: 'CC', texto: 'Cédula de ciudadanía' }, ...]
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColores } from '../tema';
import { EtiquetaCampo, MensajeCampo, estiloCaja } from './ui';

/** Quita tildes y mayúsculas para buscar: "Bogotá" -> "bogota". */
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Selector({ etiqueta, opciones, valor, onCambio, error, ayuda, obligatorio = false, placeholder = 'Elegir…' }) {
  const c = useColores();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const elegida = opciones.find((o) => o.valor === valor);
  const conBuscador = opciones.length > 8;
  const visibles = busqueda ? opciones.filter((o) => normalizar(o.texto).includes(normalizar(busqueda))) : opciones;

  function elegir(nuevo) {
    onCambio(nuevo);
    setAbierto(false);
    setBusqueda('');
  }

  return (
    <View style={{ gap: 4 }}>
      <EtiquetaCampo texto={etiqueta} obligatorio={obligatorio} />
      <Pressable onPress={() => setAbierto(true)} accessibilityRole="button" accessibilityLabel={etiqueta}
        style={[estiloCaja(c, error), { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <Text style={{ color: elegida ? c.texto : c.textoSuave, fontSize: 15, flex: 1 }}>{elegida ? elegida.texto : placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={c.textoSuave} />
      </Pressable>
      <MensajeCampo ayuda={ayuda} error={error} />

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable onPress={() => setAbierto(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
          {/* Pressable interno vacío: evita que tocar la ventana la cierre */}
          <Pressable onPress={() => {}} style={{ backgroundColor: c.superficie, borderRadius: 16, maxHeight: '80%', width: '100%', maxWidth: 440, alignSelf: 'center', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: c.borde }}>
              <Text style={{ flex: 1, color: c.texto, fontSize: 17, fontWeight: '700' }}>{etiqueta}</Text>
              <Pressable onPress={() => setAbierto(false)} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={10}>
                <Ionicons name="close" size={24} color={c.textoSuave} />
              </Pressable>
            </View>
            {conBuscador && (
              <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar…" placeholderTextColor={c.textoSuave}
                style={[estiloCaja(c), { margin: 12 }]} accessibilityLabel={`Buscar ${etiqueta}`} />
            )}
            <FlatList
              data={visibles}
              keyExtractor={(o) => o.valor}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={{ color: c.textoSuave, padding: 16 }}>No hay resultados.</Text>}
              renderItem={({ item }) => {
                const activa = item.valor === valor;
                return (
                  <Pressable onPress={() => elegir(item.valor)} accessibilityRole="button"
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, backgroundColor: activa ? c.primarioSuave : pressed ? c.superficie2 : 'transparent' })}>
                    <Text style={{ flex: 1, color: activa ? c.primario : c.texto, fontSize: 15, fontWeight: activa ? '700' : '400' }}>{item.texto}</Text>
                    {activa && <Ionicons name="checkmark" size={20} color={c.primario} />}
                  </Pressable>
                );
              }}
            />
            {valor ? (
              <Pressable onPress={() => elegir(null)} style={{ padding: 14, borderTopWidth: 1, borderTopColor: c.borde, alignItems: 'center' }} accessibilityRole="button">
                <Text style={{ color: c.vencida, fontWeight: '600' }}>Quitar selección</Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
