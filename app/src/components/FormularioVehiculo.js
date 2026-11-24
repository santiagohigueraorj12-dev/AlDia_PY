// RF-04: formulario para registrar o editar un vehículo.
// Si recibe "vehiculo" está editando; si no, está registrando uno nuevo.
// Los errores que devuelve el backend se muestran debajo de cada campo.
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, archivoParaFormulario, urlArchivo } from '../api/cliente';
import { useErrores } from '../api/useErrores';
import { Aviso, Boton, Campo, EtiquetaCampo, Fila, MensajeCampo, NotaObligatorios, Pantalla, Segmentos, Tarjeta, Texto } from './ui';
import CampoFecha from './CampoFecha';
import { hoyISO } from '../utils/formato';

export default function FormularioVehiculo({ vehiculo, onGuardado }) {
  const editando = Boolean(vehiculo);
  const [tipos, setTipos] = useState([]);
  const [datos, setDatos] = useState({
    tipo_vehiculo_id: vehiculo?.tipo_vehiculo_id ?? null,
    marca: vehiculo?.marca ?? '',
    linea: vehiculo?.linea ?? '',
    modelo: vehiculo ? String(vehiculo.modelo) : '',
    placa: vehiculo?.placa ?? '',
    fecha_matricula: vehiculo?.fecha_matricula ?? '',
    km_inicial: '',
    subtipo: vehiculo?.subtipo ?? null,             // RN-05: moto de cambios o automática
    cilindraje: vehiculo?.cilindraje ? String(vehiculo.cilindraje) : '',  // RN-22
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
    const campos = editando ? ['marca', 'linea', 'modelo', 'placa', 'fecha_matricula', 'subtipo', 'cilindraje'] : Object.keys(datos);
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

  const tipoNombre = editando ? vehiculo.tipo : tipos.find((x) => x.id === datos.tipo_vehiculo_id)?.nombre;
  const esMoto = tipoNombre === 'Moto';
  const esCarro = tipoNombre === 'Carro';
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

        {esMoto && (
          <View style={{ gap: 6 }}>
            <EtiquetaCampo texto="¿Qué tipo de moto es?" obligatorio />
            <Segmentos valor={datos.subtipo} onCambio={cambiar('subtipo')} opciones={[
              { id: 'cambios', titulo: 'De cambios (cadena)', icono: 'cog-outline' },
              { id: 'automatica', titulo: 'Automática (scooter)', icono: 'flash-outline' },
            ]} />
            <MensajeCampo error={errores.subtipo}
              ayuda={editando && vehiculo?.subtipo && datos.subtipo !== vehiculo.subtipo
                ? 'Al guardar se ajusta el plan: se quitan las partes del otro tipo de moto y se agregan las de este.'
                : 'Las de cambios tienen cadena (kit de arrastre); las automáticas tienen correa CVT. Así cargamos las partes correctas.'} />
          </View>
        )}

        <Campo etiqueta="Marca" obligatorio placeholder="Ej.: Yamaha" value={datos.marca}
          onChangeText={cambiar('marca')} error={errores.marca} />
        <Campo etiqueta="Línea" obligatorio placeholder="Ej.: NMAX 155" value={datos.linea}
          onChangeText={cambiar('linea')} error={errores.linea} />
        <Fila estilo={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Modelo" obligatorio placeholder="Ej.: 2024" value={datos.modelo} onChangeText={cambiar('modelo')}
              keyboardType="number-pad" maxLength={4} error={errores.modelo} />
          </View>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Placa" obligatorio placeholder={esMoto ? 'Ej.: ABC12D' : esCarro ? 'Ej.: ABC123' : 'Ej.: ABC12D'} value={datos.placa}
              onChangeText={(t) => cambiar('placa')(t.toUpperCase())} autoCapitalize="characters" maxLength={8}
              error={errores.placa} />
          </View>
        </Fila>
        <Campo etiqueta="Cilindraje en cc (opcional)" placeholder={esMoto ? 'Ej.: 125' : 'Ej.: 1.600'} value={datos.cilindraje}
          onChangeText={cambiar('cilindraje')} keyboardType="number-pad" error={errores.cilindraje}
          ayuda={esMoto ? 'Aparece en la licencia de tránsito. Las motos de hasta 125 cc no pagan impuesto vehicular.' : 'Aparece en la licencia de tránsito.'} />
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
