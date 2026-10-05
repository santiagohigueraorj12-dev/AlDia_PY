// RF-04: formulario para registrar o editar un vehículo.
// Si recibe "vehiculo" está editando; si no, está registrando uno nuevo.
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, archivoParaFormulario, urlArchivo } from '../api/cliente';
import { Aviso, Boton, Campo, Fila, Pantalla, Tarjeta, Texto } from './ui';
import CampoFecha from './CampoFecha';

export default function FormularioVehiculo({ vehiculo, onGuardado }) {
  const editando = Boolean(vehiculo);
  const [tipos, setTipos] = useState([]);
  const [datos, setDatos] = useState({
    tipo_vehiculo_id: vehiculo?.tipo_vehiculo_id ?? null,
    marca: vehiculo?.marca ?? '',
    modelo: vehiculo?.modelo ?? '',
    anio: vehiculo ? String(vehiculo.anio) : '',
    placa: vehiculo?.placa ?? '',
    fecha_matricula: vehiculo?.fecha_matricula ?? '',
    km_inicial: '',
  });
  const [foto, setFoto] = useState(null);  // { uri, nombre, tipo }
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!editando) api('/tipos-vehiculo').then(setTipos).catch((e) => setError(e.message));
  }, [editando]);

  const cambiar = (campo) => (valor) => setDatos({ ...datos, [campo]: valor });

  async function elegirFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6 });
    if (r.canceled) return;
    const a = r.assets[0];
    if (a.fileSize && a.fileSize > 5 * 1024 * 1024) { setError('La foto no puede pesar más de 5 MB'); return; }
    setFoto({ uri: a.uri, nombre: a.fileName || 'foto.jpg', tipo: a.mimeType || 'image/jpeg' });
  }

  async function guardar() {
    setError('');
    setEnviando(true);
    // Se envía como FormData porque puede llevar la foto
    const formulario = new FormData();
    const campos = editando ? ['marca', 'modelo', 'anio', 'placa', 'fecha_matricula'] : Object.keys(datos);
    campos.forEach((campo) => formulario.append(campo, String(datos[campo] ?? '')));
    if (foto) formulario.append('foto', archivoParaFormulario(foto));

    try {
      const guardado = editando
        ? await api(`/vehiculos/${vehiculo.id}`, { metodo: 'PUT', formulario })
        : await api('/vehiculos', { metodo: 'POST', formulario });
      onGuardado(guardado);
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  const fotoActual = foto?.uri || urlArchivo(vehiculo?.foto_url);

  return (
    <Pantalla>
      <Tarjeta estilo={{ gap: 14 }}>
        <Aviso>{error}</Aviso>
        {!editando && (
          <View style={{ gap: 6 }}>
            <Texto variante="negrita">Tipo de vehículo</Texto>
            <Fila>
              {tipos.map((t) => (
                <Boton key={t.id} titulo={t.nombre === 'Moto' ? '🏍️ Moto' : '🚗 Carro'}
                  tipo={datos.tipo_vehiculo_id === t.id ? 'primario' : 'normal'}
                  onPress={() => setDatos({ ...datos, tipo_vehiculo_id: t.id })} />
              ))}
            </Fila>
          </View>
        )}
        <Campo etiqueta="Marca" value={datos.marca} onChangeText={cambiar('marca')} />
        <Campo etiqueta="Modelo" value={datos.modelo} onChangeText={cambiar('modelo')} />
        <Fila estilo={{ flexWrap: 'nowrap' }}>
          <View style={{ flex: 1 }}><Campo etiqueta="Año" value={datos.anio} onChangeText={cambiar('anio')} keyboardType="number-pad" maxLength={4} /></View>
          <View style={{ flex: 1 }}><Campo etiqueta="Placa" value={datos.placa} onChangeText={(t) => cambiar('placa')(t.toUpperCase())} autoCapitalize="characters" placeholder="ABC123" maxLength={7} /></View>
        </Fila>
        <CampoFecha etiqueta="Fecha de matrícula" valor={datos.fecha_matricula} onCambio={cambiar('fecha_matricula')} />
        {!editando && (
          <Campo etiqueta="Kilometraje actual" value={datos.km_inicial} onChangeText={cambiar('km_inicial')} keyboardType="number-pad" />
        )}

        <View style={{ gap: 6 }}>
          <Texto variante="negrita">Foto (opcional)</Texto>
          {fotoActual && <Image source={{ uri: fotoActual }} style={{ width: '100%', height: 160, borderRadius: 8 }} />}
          <Boton titulo={fotoActual ? 'Cambiar foto' : 'Elegir foto'} onPress={elegirFoto} />
        </View>

        {!editando && (
          <Texto variante="pequeno">Al registrarlo se cargará el plan de partes recomendado para su tipo. Luego puedes ajustarlo según el manual de tu vehículo.</Texto>
        )}
        <Boton titulo={enviando ? 'Guardando…' : 'Guardar'} tipo="primario" onPress={guardar} deshabilitado={enviando} />
      </Tarjeta>
    </Pantalla>
  );
}
