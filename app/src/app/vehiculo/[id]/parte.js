// RF-07 + RN-05: agregar una parte o ajustar sus intervalos (nunca en cero),
// RF-09: ver el historial de cambios de esa parte,
// RF-27: "Revisé y está bien" (elegir el mes de la próxima revisión) y
// RF-28: "Se dañó" (registrar un daño de esta parte).
// Sin "parteId" en la ruta -> parte nueva.  Con "parteId" -> editar esa parte.
import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';
import { volver } from '../../../utils/navegacion';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { api, urlArchivo } from '../../../api/cliente';
import { useErrores } from '../../../api/useErrores';
import { Aviso, BarraDesgaste, Boton, Campo, Cargando, Casilla, Fila, NotaObligatorios, Pantalla, Separador, Tarjeta, Texto } from '../../../components/ui';
import Selector from '../../../components/Selector';
import { useCelebracion } from '../../../components/Celebracion';
import { confirmar } from '../../../utils/dialogos';
import { fecha, km, mesAnio, pesos, porcentaje, proximosMeses } from '../../../utils/formato';

export default function Parte() {
  const { id, parteId } = useLocalSearchParams();
  const nueva = !parteId;
  const [cargada, setCargada] = useState(nueva);
  const [parte, setParte] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [revisiones, setRevisiones] = useState([]);
  const [mesRevision, setMesRevision] = useState(null);  // RF-27: 'AAAA-MM'
  const [nota, setNota] = useState('');
  const [revisando, setRevisando] = useState(false);
  const celebrar = useCelebracion();
  const [nombre, setNombre] = useState('');
  const [soloTiempo, setSoloTiempo] = useState(false);
  const [intervaloKm, setIntervaloKm] = useState('');
  const [meses, setMeses] = useState('');
  const [error, setError] = useState('');  // error al cargar la parte
  const { errores, general, mostrar, limpiar, reiniciar, marcar } = useErrores();

  // Si se está editando, se cargan la parte (con su desgaste) y su historial.
  // useFocusEffect: se recarga al volver de "Corregir último cambio".
  useFocusEffect(useCallback(() => {
    if (nueva) return;
    Promise.all([api(`/vehiculos/${id}`), api(`/partes/${parteId}/historial`)])
      .then(([vehiculo, h]) => {
        const p = vehiculo.partes.find((x) => x.id === Number(parteId));
        setParte(p);
        setHistorial(h.historial);
        setRevisiones(h.revisiones || []);
        setNombre(p.nombre);
        setSoloTiempo(p.intervalo_km === null);
        setIntervaloKm(p.intervalo_km === null ? '' : String(p.intervalo_km));
        setMeses(String(p.intervalo_meses));
        setCargada(true);
      })
      .catch((e) => setError(e.message));
  }, [id, parteId, nueva]));

  async function guardar() {
    reiniciar();
    // Si no es "solo por tiempo", el intervalo en km es obligatorio
    if (!soloTiempo && !intervaloKm.trim()) {
      marcar('intervalo_km', 'Escribe cada cuántos km se cambia, o marca "solo por tiempo"');
      return;
    }
    const datos = { nombre, intervalo_km: soloTiempo ? null : intervaloKm, intervalo_meses: meses };
    try {
      if (nueva) await api(`/vehiculos/${id}/partes`, { metodo: 'POST', datos });
      else await api(`/partes/${parteId}`, { metodo: 'PUT', datos });
      volver(`/vehiculo/${id}`);
    } catch (e) {
      mostrar(e);
    }
  }

  // RF-27: la parte está en buen estado; se elige el mes de la próxima revisión
  async function revisar() {
    reiniciar();
    if (!mesRevision) { marcar('mes', 'Elige el mes de la próxima revisión'); return; }
    setRevisando(true);
    try {
      await api(`/partes/${parteId}/revision`, { metodo: 'POST', datos: { mes: mesRevision, nota } });
      celebrar('¡Revisión guardada!');
      volver(`/vehiculo/${id}`);
    } catch (e) {
      mostrar(e);
      setRevisando(false);
    }
  }

  async function quitar() {
    if (!(await confirmar('Quitar parte', `¿Quitar "${parte.nombre}" del plan? Su historial se conserva.`, 'Quitar'))) return;
    await api(`/partes/${parteId}`, { metodo: 'DELETE' });
    volver(`/vehiculo/${id}`);
  }

  if (!cargada) return error ? <Pantalla><Aviso>{error}</Aviso></Pantalla> : <Cargando />;

  return (
    <Pantalla>
      <Stack.Screen options={{ title: nueva ? 'Agregar parte' : parte.nombre }} />

      {parte && (
        <Tarjeta>
          <BarraDesgaste porcentaje={parte.desgaste.porcentaje} estado={parte.desgaste.estado} />
          {parte.desgaste.revision ? (
            <Texto>La revisaste el {fecha(parte.desgaste.revision.fecha)} y estaba bien. Próxima revisión: {mesAnio(parte.desgaste.revision.revisarEn)}.</Texto>
          ) : parte.ultimo_cambio_conocido ? (
            <Texto>{porcentaje(parte.desgaste.porcentaje)} de desgaste (por {parte.desgaste.motivo === 'km' ? 'kilómetros' : 'tiempo'})</Texto>
          ) : null}
          {parte.ultimo_cambio_conocido
            ? <Texto variante="pequeno">Último cambio: {fecha(parte.ultimo_cambio_fecha)}, {km(parte.ultimo_cambio_km)}</Texto>
            : <Aviso tipo="aviso">No sabemos cuándo se cambió por última vez, así que se cuenta desde la matrícula. Revísala o indica su último cambio.</Aviso>}
          {/* RN-16: solo mientras la parte no tenga cambios registrados en la app */}
          {parte.cambios_registrados === 0 && (
            <Boton titulo="Corregir último cambio" icono="calendar-outline" onPress={() => router.push(`/vehiculo/${id}/ultimos-cambios?parteId=${parteId}`)} />
          )}
        </Tarjeta>
      )}

      {/* RF-27 y RF-28: qué pasó con la parte (además de "La cambié") */}
      {parte && (
        <Tarjeta estilo={{ gap: 12 }}>
          <Texto variante="subtitulo">¿Qué pasó con esta parte?</Texto>
          <Boton titulo="La cambié" icono="construct" tipo="primario" onPress={() => router.push(`/vehiculo/${id}/servicio?parteId=${parteId}`)} />
          <Separador />
          <Texto variante="negrita">La revisé y está bien</Texto>
          <Texto variante="suave">
            Si no está gastada (por ejemplo, la batería), márcala en buen estado y elige cuándo quieres revisarla otra vez.
            No cuenta como cambio y te aparecerá en el calendario.
          </Texto>
          <Selector etiqueta="Volver a revisarla en" opciones={proximosMeses()} valor={mesRevision}
            onCambio={(v) => { setMesRevision(v); limpiar('mes'); }} error={errores.mes} placeholder="Elegir el mes…" />
          <Campo etiqueta="Nota (opcional)" placeholder="Ej.: carga bien, bornes limpios" value={nota} onChangeText={setNota} error={errores.nota} />
          <Boton titulo={revisando ? 'Guardando…' : 'Revisé y está bien'} icono="checkmark-done" onPress={revisar} deshabilitado={revisando} />
          <Separador />
          <Texto variante="negrita">Se dañó</Texto>
          <Texto variante="suave">Si falló o se dañó sin aviso, regístralo como un daño para no olvidar arreglarlo.</Texto>
          <Boton titulo="Registrar que se dañó" icono="warning-outline" tipo="peligro" onPress={() => router.push(`/vehiculo/${id}/novedad?parteId=${parteId}`)} />
        </Tarjeta>
      )}

      <Tarjeta estilo={{ gap: 12 }}>
        <Texto variante="subtitulo">{nueva ? 'Datos de la parte' : 'Ajustar intervalos'}</Texto>
        <NotaObligatorios />
        <Aviso>{general}</Aviso>
        <Campo etiqueta="Nombre" obligatorio placeholder="Ej.: Guaya del clutch" value={nombre}
          onChangeText={(t) => { setNombre(t); limpiar('nombre'); }} error={errores.nombre} />
        <Casilla marcada={soloTiempo} onCambio={(v) => { setSoloTiempo(v); limpiar('intervalo_km'); }}>Se controla solo por tiempo (no por kilómetros)</Casilla>
        <Fila estilo={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          {!soloTiempo && (
            <View style={{ flex: 1 }}>
              <Campo etiqueta="Cada (km)" obligatorio placeholder="Ej.: 5.000" value={intervaloKm} keyboardType="number-pad"
                onChangeText={(t) => { setIntervaloKm(t); limpiar('intervalo_km'); }} error={errores.intervalo_km} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Cada (meses)" obligatorio placeholder="Ej.: 6" value={meses} keyboardType="number-pad"
              onChangeText={(t) => { setMeses(t); limpiar('intervalo_meses'); }} error={errores.intervalo_meses} />
          </View>
        </Fila>
        {nueva && <Texto variante="pequeno">La parte nueva empieza en 0 % de desgaste (como si se hubiera cambiado hoy).</Texto>}
        <Boton titulo="Guardar" icono="checkmark-circle" tipo="primario" onPress={guardar} />
      </Tarjeta>

      {!nueva && (
        <>
          <Tarjeta>
            <Texto variante="subtitulo">Historial de cambios</Texto>
            {historial.length === 0 && <Texto variante="suave">Todavía no hay cambios registrados de esta parte.</Texto>}
            {historial.map((h, i) => (
              <View key={i}>
                {i > 0 && <Separador />}
                <Fila estilo={{ justifyContent: 'space-between' }}>
                  <Texto variante="negrita">{fecha(h.fecha)} · {km(h.km)}</Texto>
                  <Texto>{pesos(h.costo)}</Texto>
                </Fila>
                <Texto variante="pequeno">{[h.marca_referencia, h.lugar].filter(Boolean).join(' · ') || 'Sin detalles'}</Texto>
                {h.archivo_url && <Boton titulo="Ver factura" icono="receipt-outline" tipo="enlace" pequeno onPress={() => Linking.openURL(urlArchivo(h.archivo_url))} estilo={{ alignSelf: 'flex-start' }} />}
              </View>
            ))}
          </Tarjeta>
          {revisiones.length > 0 && (
            <Tarjeta>
              <Texto variante="subtitulo">Revisiones</Texto>
              {revisiones.map((r, i) => (
                <View key={r.id}>
                  {i > 0 && <Separador />}
                  <Texto variante="negrita">{fecha(r.fecha)} · {km(r.km)} · en buen estado</Texto>
                  <Texto variante="pequeno">Próxima revisión: {mesAnio(r.revisar_en)}{r.nota ? ` · ${r.nota}` : ''}</Texto>
                </View>
              ))}
            </Tarjeta>
          )}
          <Boton titulo="Quitar parte del plan" icono="trash-outline" tipo="peligro" onPress={quitar} />
        </>
      )}
    </Pantalla>
  );
}
