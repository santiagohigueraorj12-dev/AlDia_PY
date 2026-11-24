// RF-28: daños del vehículo (un daño, una falla o un golpe que pasó sin aviso). CRUD:
//   /vehiculo/1/novedad                 -> registrar un daño (crear)
//   /vehiculo/1/novedad?parteId=5       -> registrar un daño de esa parte (viene de "Se dañó")
//   /vehiculo/1/novedad?editarId=8      -> editar ese daño
//   /vehiculo/1/novedad?novedadId=8     -> marcar ese daño como arreglado
// En el código se llaman "novedades" (tabla novedades).
// RN-21: mientras un daño esté pendiente, el vehículo "requiere atención".
// Si el daño es de una parte del plan, al arreglarlo se registra el cambio de esa parte.
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { api, archivoParaFormulario, urlArchivo } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import { useErrores } from '../../../api/useErrores';
import {
  Aviso, Boton, Campo, Cargando, Casilla, NotaObligatorios, Pantalla, Paso, Segmentos, Tarjeta, Texto,
} from '../../../components/ui';
import CampoFecha from '../../../components/CampoFecha';
import Selector from '../../../components/Selector';
import { useCelebracion } from '../../../components/Celebracion';
import { volver } from '../../../utils/navegacion';
import { TIPO_NOVEDAD, fecha as formatoFecha, hoyISO, km as formatoKm } from '../../../utils/formato';

const TIPOS = [
  { id: 'dano', titulo: 'Daño o falla', icono: 'warning-outline' },
  { id: 'accidente', titulo: 'Golpe', icono: 'car-sport-outline' },
  { id: 'otro', titulo: 'Otro', icono: 'ellipsis-horizontal-circle-outline' },
];
const OTRA = 'otra';  // valor del selector cuando no es una parte de la lista

export default function Dano() {
  const { id, parteId, novedadId, editarId } = useLocalSearchParams();
  const { datos: vehiculo } = useDatos(`/vehiculos/${id}`);
  const { datos: danos } = useDatos(`/vehiculos/${id}/novedades`);
  const buscado = novedadId || editarId;
  const dano = buscado && danos ? danos.find((n) => n.id === Number(buscado)) : null;

  if (!vehiculo || (buscado && !danos)) return <Cargando />;
  if (buscado && !dano) return <Pantalla><Aviso>No encontramos ese daño.</Aviso></Pantalla>;
  if (novedadId) return <Arreglar vehiculo={vehiculo} dano={dano} />;
  return <Formulario vehiculo={vehiculo} existente={dano} parteInicial={parteId ? Number(parteId) : null} />;
}

/** Campos del arreglo: fecha, km, lugar, costo y marca (marca solo si es una parte). */
function CamposArreglo({ valores, cambiar, errores, prefijo = '', vehiculo, esParte, fechaFija = false }) {
  return (
    <>
      {fechaFija ? (
        <Texto variante="suave">Arreglado el {formatoFecha(valores.fecha)} a los {formatoKm(valores.km)}. Como quedó registrado como cambio de la parte, esa fecha no se edita aquí.</Texto>
      ) : (
        <>
          <CampoFecha etiqueta="¿Cuándo se arregló?" obligatorio valor={valores.fecha} maxima={hoyISO()}
            onCambio={(v) => cambiar('fecha', v)} error={errores[`${prefijo}fecha`]} />
          <Campo etiqueta="Kilometraje cuando se arregló" obligatorio value={valores.km} keyboardType="number-pad"
            onChangeText={(v) => cambiar('km', v)} error={errores[`${prefijo}km`]}
            ayuda={`No puede ser mayor al actual (${vehiculo.km_actual.toLocaleString('es-CO')} km).`} />
        </>
      )}
      <Campo etiqueta="Lugar o taller" placeholder="Ej.: Taller MotoExpress" value={valores.lugar} onChangeText={(v) => cambiar('lugar', v)} error={errores.lugar} />
      <Campo etiqueta="¿Cuánto costó?" placeholder="Ej.: 85.000" value={valores.costo} keyboardType="number-pad"
        onChangeText={(v) => cambiar('costo', v)} error={errores.costo} />
      {esParte && valores.marca_referencia !== undefined && (
        <Campo etiqueta="Marca o referencia del repuesto" placeholder="Ej.: Yuasa" value={valores.marca_referencia}
          onChangeText={(v) => cambiar('marca_referencia', v)} error={errores.marca_referencia} />
      )}
      {esParte && !fechaFija && <Texto variante="pequeno">Como es una parte de la lista, se registra como cambiada y su desgaste vuelve a 0 %.</Texto>}
    </>
  );
}

/** Registrar (existente = null) o editar (existente = el daño) un daño. */
function Formulario({ vehiculo, existente, parteInicial }) {
  const editando = Boolean(existente);
  const yaArreglado = existente?.estado === 'arreglada';
  const [tipo, setTipo] = useState(existente?.tipo ?? 'dano');
  const [parte, setParte] = useState(editando ? (existente.parte_id ?? OTRA) : (parteInicial ?? null));
  const [titulo, setTitulo] = useState(existente && !existente.parte_id ? existente.titulo : '');
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? '');
  const [fecha, setFecha] = useState(existente?.fecha ?? hoyISO());
  const [km, setKm] = useState(String(existente?.km ?? vehiculo.km_actual));
  const [foto, setFoto] = useState(null);
  const [arreglada, setArreglada] = useState(false);
  const [arreglo, setArreglo] = useState(yaArreglado
    ? { fecha: existente.arreglada_en, km: String(existente.arreglada_km), lugar: existente.lugar ?? '', costo: existente.costo ? String(Math.round(existente.costo)) : '' }
    : { fecha: hoyISO(), km: String(vehiculo.km_actual), lugar: '', costo: '', marca_referencia: '' });
  const [enviando, setEnviando] = useState(false);
  const { errores, general, mostrar, limpiar, reiniciar, marcar } = useErrores();
  const celebrar = useCelebracion();

  const opcionesParte = [
    ...vehiculo.partes.map((p) => ({ valor: p.id, texto: p.nombre })),
    { valor: OTRA, texto: 'Otra cosa (no está en la lista)' },
  ];
  const esParte = parte !== null && parte !== OTRA;
  const nombreParte = existente?.parte || existente?.titulo;

  async function elegirFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (r.canceled) return;
    const a = r.assets[0];
    if (a.fileSize && a.fileSize > 5 * 1024 * 1024) { marcar('foto', 'La foto no puede pesar más de 5 MB'); return; }
    setFoto({ uri: a.uri, nombre: a.fileName || 'foto.jpg', tipo: a.mimeType || 'image/jpeg', web: a.file });
  }

  async function guardar() {
    reiniciar();
    if (parte === null) { marcar('parte_id', 'Elige qué se dañó'); return; }
    if (parte === OTRA && !titulo.trim()) { marcar('titulo', 'Escribe qué se dañó'); return; }
    setEnviando(true);
    // FormData porque puede llevar una foto
    const formulario = new FormData();
    const campos = editando
      ? {
        tipo, titulo: parte === OTRA ? titulo : '', descripcion, fecha, km,
        ...(yaArreglado ? { arreglo_fecha: arreglo.fecha, arreglo_km: arreglo.km, lugar: arreglo.lugar, costo: arreglo.costo } : {}),
      }
      : {
        tipo, parte_id: esParte ? parte : '', titulo: parte === OTRA ? titulo : '', descripcion, fecha, km, arreglada: String(arreglada),
        ...(arreglada ? {
          arreglo_fecha: arreglo.fecha, arreglo_km: arreglo.km, lugar: arreglo.lugar, costo: arreglo.costo, marca_referencia: arreglo.marca_referencia,
        } : {}),
      };
    Object.entries(campos).forEach(([k, v]) => formulario.append(k, String(v ?? '')));
    if (foto) formulario.append('foto', archivoParaFormulario(foto));
    try {
      if (editando) await api(`/novedades/${existente.id}`, { metodo: 'PUT', formulario });
      else await api(`/vehiculos/${vehiculo.id}/novedades`, { metodo: 'POST', formulario });
      celebrar(editando ? 'Daño actualizado' : arreglada ? '¡Arreglo registrado!' : 'Daño registrado');
      volver(`/vehiculo/${vehiculo.id}`);
    } catch (e) {
      mostrar(e);
      setEnviando(false);
    }
  }

  const fotoActual = foto?.uri || urlArchivo(existente?.foto_url);

  return (
    <Pantalla>
      <Stack.Screen options={{ title: editando ? 'Editar daño' : 'Registrar daño' }} />
      <Aviso>{general}</Aviso>
      <Tarjeta estilo={{ gap: 12 }}>
        <Paso numero={1} titulo="¿Qué pasó?" ayuda={`${vehiculo.placa}: un daño, una falla o un golpe que pasó sin aviso.`} />
        <NotaObligatorios />
        <Segmentos opciones={TIPOS} valor={tipo} onCambio={setTipo} />
        {editando && existente.parte_id ? (
          <Texto><Texto variante="negrita">Parte: </Texto>{nombreParte} (si te equivocaste de parte, elimina el daño y regístralo de nuevo)</Texto>
        ) : (
          <Selector etiqueta="¿Qué se dañó?" obligatorio opciones={editando ? [opcionesParte[opcionesParte.length - 1]] : opcionesParte} valor={parte}
            onCambio={(v) => { setParte(v); limpiar('parte_id'); }} error={errores.parte_id} placeholder="Elegir…" />
        )}
        {parte === OTRA && (
          <Campo etiqueta="Escribe qué se dañó" obligatorio placeholder="Ej.: Espejo derecho" value={titulo}
            onChangeText={(v) => { setTitulo(v); limpiar('titulo'); }} error={errores.titulo} />
        )}
        <Campo etiqueta="Descripción (opcional)" placeholder="Ej.: No prendió en la mañana" value={descripcion} multiline
          onChangeText={setDescripcion} error={errores.descripcion} />
        <CampoFecha etiqueta="¿Cuándo pasó?" obligatorio valor={fecha} maxima={hoyISO()}
          onCambio={(v) => { setFecha(v); limpiar('fecha'); }} error={errores.fecha} />
        <Campo etiqueta="Kilometraje" obligatorio value={km} keyboardType="number-pad"
          onChangeText={(v) => { setKm(v); limpiar('km'); }} error={errores.km} />
        {fotoActual && <Image source={{ uri: fotoActual }} style={{ width: '100%', height: 160, borderRadius: 8 }} />}
        <Boton titulo={fotoActual ? 'Cambiar foto' : 'Agregar una foto (opcional)'} icono="camera-outline" onPress={elegirFoto} />
        {errores.foto && <Aviso>{errores.foto}</Aviso>}
      </Tarjeta>

      <Tarjeta estilo={{ gap: 12 }}>
        {editando ? (
          yaArreglado ? (
            <>
              <Paso numero={2} titulo="El arreglo" />
              <CamposArreglo valores={arreglo} cambiar={(k, v) => { setArreglo({ ...arreglo, [k]: v }); limpiar(`arreglo_${k}`); limpiar(k); }}
                errores={errores} prefijo="arreglo_" vehiculo={vehiculo} esParte={Boolean(existente.parte_id)} fechaFija={Boolean(existente.servicio_id)} />
            </>
          ) : (
            <Aviso tipo="aviso">Este daño sigue pendiente. Cuando lo arregles, usa "Ya se arregló".</Aviso>
          )
        ) : (
          <>
            <Paso numero={2} titulo="¿Ya se arregló?" ayuda="Si todavía no, AlDía te lo recuerda en el Inicio hasta que lo arregles." />
            <Casilla marcada={arreglada} onCambio={setArreglada}>Sí, ya se arregló</Casilla>
            {arreglada && (
              <CamposArreglo valores={arreglo} cambiar={(k, v) => { setArreglo({ ...arreglo, [k]: v }); limpiar(`arreglo_${k}`); limpiar(k); }}
                errores={errores} prefijo="arreglo_" vehiculo={vehiculo} esParte={esParte} />
            )}
            {!arreglada && <Aviso tipo="aviso">Mientras no lo marques como arreglado, el vehículo aparecerá como "Requiere atención".</Aviso>}
          </>
        )}
        <Boton titulo={enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar daño'} icono="checkmark-circle" tipo="primario" onPress={guardar} deshabilitado={enviando} />
      </Tarjeta>
    </Pantalla>
  );
}

function Arreglar({ vehiculo, dano }) {
  const [valores, setValores] = useState({ fecha: hoyISO(), km: String(vehiculo.km_actual), lugar: '', costo: '', marca_referencia: '' });
  const [enviando, setEnviando] = useState(false);
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();
  const celebrar = useCelebracion();
  const esParte = Boolean(dano.parte_id && vehiculo.partes.some((p) => p.id === dano.parte_id));

  useEffect(() => { reiniciar(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function guardar() {
    reiniciar();
    setEnviando(true);
    try {
      await api(`/novedades/${dano.id}/arreglar`, { metodo: 'POST', datos: valores });
      celebrar('¡Arreglo registrado!');
      volver(`/vehiculo/${vehiculo.id}`);
    } catch (e) {
      mostrar(e);
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Stack.Screen options={{ title: 'Marcar como arreglado' }} />
      <Aviso>{general}</Aviso>
      <Tarjeta estilo={{ gap: 6 }}>
        <Texto variante="subtitulo">{dano.titulo}</Texto>
        <Texto variante="suave">{TIPO_NOVEDAD[dano.tipo]} · {formatoFecha(dano.fecha)} · {formatoKm(dano.km)} · {vehiculo.placa}</Texto>
        {dano.descripcion && <Texto>{dano.descripcion}</Texto>}
      </Tarjeta>
      <Tarjeta estilo={{ gap: 12 }}>
        <NotaObligatorios />
        <View style={{ gap: 12 }}>
          <CamposArreglo valores={valores} cambiar={(k, v) => { setValores({ ...valores, [k]: v }); limpiar(k); }}
            errores={errores} vehiculo={vehiculo} esParte={esParte} />
        </View>
        <Boton titulo={enviando ? 'Guardando…' : 'Guardar arreglo'} icono="checkmark-circle" tipo="primario" onPress={guardar} deshabilitado={enviando} />
      </Tarjeta>
    </Pantalla>
  );
}
