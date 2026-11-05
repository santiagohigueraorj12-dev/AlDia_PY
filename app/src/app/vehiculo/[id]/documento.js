// RF-12 y RF-13: registrar o renovar un documento (SOAT, RTM o impuesto) y ver su historial.
// RN-15: al renovar, la nueva fecha de vencimiento debe ser posterior a la anterior.
import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { volver } from '../../../utils/navegacion';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { api, archivoParaFormulario, urlArchivo } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import { useErrores } from '../../../api/useErrores';
import { Aviso, Boton, Campo, Cargando, Etiqueta, Fila, MensajeCampo, NotaObligatorios, Pantalla, Separador, Tarjeta, Texto } from '../../../components/ui';
import CampoFecha from '../../../components/CampoFecha';
import { confirmar } from '../../../utils/dialogos';
import { ESTADO_DOCUMENTO, NOMBRE_DOCUMENTO, fecha, hoyISO, pesos } from '../../../utils/formato';

export default function Documento() {
  const { id, tipo } = useLocalSearchParams();
  const { datos: vehiculo } = useDatos(`/vehiculos/${id}`);
  const [vence, setVence] = useState('');
  const [valor, setValor] = useState('');
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [archivo, setArchivo] = useState(null);  // { uri, nombre, tipo, web }
  const [historial, setHistorial] = useState([]);
  const { errores, general, mostrar, limpiar, reiniciar, setGeneral } = useErrores();
  const [enviando, setEnviando] = useState(false);

  const doc = vehiculo?.documentos.find((d) => d.tipo === tipo);
  const nombre = NOMBRE_DOCUMENTO[tipo];

  // Si el documento ya existe, se carga su historial de renovaciones
  useEffect(() => {
    if (doc?.id) api(`/documentos/${doc.id}`).then((r) => setHistorial(r.historial)).catch(() => {});
  }, [doc?.id]);

  if (!vehiculo) return <Cargando />;

  async function elegirArchivo() {
    const r = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    if (a.size && a.size > 5 * 1024 * 1024) { setGeneral('El archivo no puede pesar más de 5 MB'); return; }  // RNF-03
    // a.file solo existe en el navegador (es el archivo real elegido en el computador)
    setArchivo({ uri: a.uri, nombre: a.name, tipo: a.mimeType || 'application/pdf', web: a.file });
  }

  async function guardar() {
    reiniciar();
    setEnviando(true);
    const formulario = new FormData();
    if (!doc) formulario.append('tipo', tipo);
    formulario.append('fecha_vencimiento', vence);
    formulario.append('valor', valor || '0');
    formulario.append('fecha_pago', fechaPago);
    if (archivo) formulario.append('archivo', archivoParaFormulario(archivo));
    try {
      if (doc) await api(`/documentos/${doc.id}/renovar`, { metodo: 'POST', formulario });
      else await api(`/vehiculos/${id}/documentos`, { metodo: 'POST', formulario });
      volver(`/vehiculo/${id}`);
    } catch (e) {
      mostrar(e);
      setEnviando(false);
    }
  }

  async function eliminar() {
    if (!(await confirmar('Eliminar documento', `¿Eliminar el registro de ${nombre} y su historial?`, 'Eliminar'))) return;
    await api(`/documentos/${doc.id}`, { metodo: 'DELETE' });
    volver(`/vehiculo/${id}`);
  }

  return (
    <Pantalla>
      <Stack.Screen options={{ title: `${nombre} · ${vehiculo.placa}` }} />

      {doc && (
        <Tarjeta>
          <Fila estilo={{ justifyContent: 'space-between' }}>
            <Texto variante="negrita">Vence el {fecha(doc.fecha_vencimiento)}</Texto>
            <Etiqueta estado={ESTADO_DOCUMENTO[doc.estado]} />
          </Fila>
          {doc.archivo_url && <Boton titulo="Ver archivo adjunto" tipo="enlace" onPress={() => Linking.openURL(urlArchivo(doc.archivo_url))} />}
        </Tarjeta>
      )}

      <Tarjeta estilo={{ gap: 12 }}>
        <Texto variante="subtitulo">{doc ? 'Renovar' : 'Registrar'}</Texto>
        <NotaObligatorios />
        <Aviso>{general}</Aviso>
        <CampoFecha etiqueta={doc ? 'Nueva fecha de vencimiento' : 'Fecha de vencimiento'} obligatorio valor={vence}
          onCambio={(f) => { setVence(f); limpiar('fecha_vencimiento'); }} minima={doc?.fecha_vencimiento}
          error={errores.fecha_vencimiento}
          ayuda={doc ? `Debe ser posterior al ${fecha(doc.fecha_vencimiento)}.` : 'La fecha que aparece en el documento.'} />
        <Campo etiqueta="Valor pagado ($)" placeholder="Ej.: 420.000" value={valor} keyboardType="number-pad"
          onChangeText={(t) => { setValor(t); limpiar('valor'); }} error={errores.valor} />
        <CampoFecha etiqueta="Fecha de pago" valor={fechaPago} maxima={hoyISO()}
          onCambio={(f) => { setFechaPago(f); limpiar('fecha_pago'); }} error={errores.fecha_pago} />
        <View style={{ gap: 4 }}>
          <Boton titulo={archivo ? `📎 ${archivo.nombre}` : 'Adjuntar foto o PDF (opcional)'} onPress={elegirArchivo} />
          <MensajeCampo ayuda="JPG, PNG o PDF de máximo 5 MB." error={errores.archivo} />
        </View>
        <Boton titulo={enviando ? 'Guardando…' : 'Guardar'} tipo="primario" onPress={guardar} deshabilitado={enviando} />
      </Tarjeta>

      {doc && (
        <>
          <Tarjeta>
            <Texto variante="subtitulo">Historial</Texto>
            {historial.map((h, i) => (
              <View key={i}>
                {i > 0 && <Separador />}
                <Fila estilo={{ justifyContent: 'space-between' }}>
                  <Texto>Pagado el {fecha(h.fecha_pago)}</Texto>
                  <Texto variante="negrita">{pesos(h.valor)}</Texto>
                </Fila>
                <Texto variante="pequeno">Vigente hasta {fecha(h.fecha_vencimiento)}</Texto>
              </View>
            ))}
          </Tarjeta>
          <Boton titulo="Eliminar documento" tipo="peligro" onPress={eliminar} />
        </>
      )}
    </Pantalla>
  );
}
