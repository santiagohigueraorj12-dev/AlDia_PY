// RF-04: formulario para registrar o editar un vehículo.
// Si recibe "vehiculo" está editando; si no, está registrando uno nuevo.
// Los errores que devuelve el backend se muestran debajo de cada campo.
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, archivoParaFormulario, urlArchivo } from '../api/cliente';
import { useErrores } from '../api/useErrores';
import { Aviso, Boton, Campo, EtiquetaCampo, Fila, MensajeCampo, NotaObligatorios, Pantalla, Tarjeta, Texto } from './ui';
import CampoFecha from './CampoFecha';
import { hoyISO } from '../utils/formato';

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
  const [foto, setFoto] = useState(null);  // { uri, nombre, tipo, web }
  const { errores, general, mostrar, limpiar, reiniciar, setGeneral } = useErrores();
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!editando) api('/tipos-vehiculo').then(setTipos).catch((e) => setGeneral(e.message));
  }, [editando]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar un campo se guarda el valor y se borra su error
  const cambiar = (campo) => (valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    limpiar(campo);
  };

  async function elegirFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6 });
    if (r.canceled) return;
    const a = r.assets[0];
    if (a.fileSize && a.fileSize > 5 * 1024 * 1024) { setGeneral('La foto no puede pesar más de 5 MB'); return; }
    // a.file solo existe en el navegador (es el archivo real elegido en el computador)
    setFoto({ uri: a.uri, nombre: a.fileName || 'foto.jpg', tipo: a.mimeType || 'image/jpeg', web: a.file });
  }

  async function guardar() {
    reiniciar();
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
      mostrar(e);
      setEnviando(false);
    }
  }

  const fotoActual = foto?.uri || urlArchivo(vehiculo?.foto_url);

  return (
    <Pantalla>
      <Tarjeta estilo={{ gap: 14 }}>
        <NotaObligatorios />
        <Aviso>{general}</Aviso>

        {!editando && (
          <View style={{ gap: 6 }}>
            <EtiquetaCampo texto="Tipo de vehículo" obligatorio />
            <Fila>
              {tipos.map((t) => (
                <Boton key={t.id} titulo={t.nombre === 'Moto' ? '🏍️ Moto' : '🚗 Carro'}
                  tipo={datos.tipo_vehiculo_id === t.id ? 'primario' : 'normal'}
                  onPress={() => cambiar('tipo_vehiculo_id')(t.id)} />
              ))}
            </Fila>
            <MensajeCampo error={errores.tipo_vehiculo_id} />
          </View>
        )}

        <Campo etiqueta="Marca" obligatorio placeholder="Ej.: Yamaha" value={datos.marca}
          onChangeText={cambiar('marca')} error={errores.marca} />
        <Campo etiqueta="Modelo" obligatorio placeholder="Ej.: NMAX 155" value={datos.modelo}
          onChangeText={cambiar('modelo')} error={errores.modelo} />
        <Fila estilo={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Año" obligatorio placeholder="Ej.: 2024" value={datos.anio} onChangeText={cambiar('anio')}
              keyboardType="number-pad" maxLength={4} error={errores.anio} />
          </View>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Placa" obligatorio placeholder="Ej.: ABC12D" value={datos.placa}
              onChangeText={(t) => cambiar('placa')(t.toUpperCase())} autoCapitalize="characters" maxLength={8}
              error={errores.placa} />
          </View>
        </Fila>
        <CampoFecha etiqueta="Fecha de matrícula" obligatorio valor={datos.fecha_matricula} maxima={hoyISO()}
          onCambio={cambiar('fecha_matricula')} error={errores.fecha_matricula}
          ayuda="Aparece en la licencia de tránsito (tarjeta de propiedad)." />
        {!editando && (
          <Campo etiqueta="Kilometraje actual" obligatorio placeholder="Ej.: 15.400" value={datos.km_inicial}
            onChangeText={cambiar('km_inicial')} keyboardType="number-pad" error={errores.km_inicial}
            ayuda="El número que marca hoy el odómetro." />
        )}

        <View style={{ gap: 6 }}>
          <EtiquetaCampo texto="Foto (opcional)" />
          {fotoActual && <Image source={{ uri: fotoActual }} style={{ width: '100%', height: 160, borderRadius: 8 }} />}
          <Boton titulo={fotoActual ? 'Cambiar foto' : 'Elegir foto'} icono="camera-outline" onPress={elegirFoto} />
          <MensajeCampo ayuda="JPG o PNG de máximo 5 MB." error={errores.foto} />
        </View>

        {!editando && (
          <Texto variante="pequeno">Al registrarlo se cargará el plan de partes recomendado para su tipo y luego te preguntaremos cuándo cambiaste cada parte por última vez.</Texto>
        )}
        <Boton titulo={enviando ? 'Guardando…' : 'Guardar'} icono="checkmark-circle" tipo="primario" onPress={guardar} deshabilitado={enviando} />
      </Tarjeta>
    </Pantalla>
  );
}
