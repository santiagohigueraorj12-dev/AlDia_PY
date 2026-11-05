// RF-07 + RN-05: agregar una parte o ajustar sus intervalos (nunca en cero),
// y RF-09: ver el historial de cambios de esa parte.
// Sin "parteId" en la ruta -> parte nueva.  Con "parteId" -> editar esa parte.
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { volver } from '../../../utils/navegacion';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { api } from '../../../api/cliente';
import { useErrores } from '../../../api/useErrores';
import { Aviso, BarraDesgaste, Boton, Campo, Cargando, Casilla, Fila, NotaObligatorios, Pantalla, Separador, Tarjeta, Texto } from '../../../components/ui';
import { confirmar } from '../../../utils/dialogos';
import { fecha, km, pesos, porcentaje } from '../../../utils/formato';

export default function Parte() {
  const { id, parteId } = useLocalSearchParams();
  const nueva = !parteId;
  const [cargada, setCargada] = useState(nueva);
  const [parte, setParte] = useState(null);
  const [historial, setHistorial] = useState([]);
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
          {parte.ultimo_cambio_conocido && (
            <Texto>{porcentaje(parte.desgaste.porcentaje)} de desgaste (por {parte.desgaste.motivo === 'km' ? 'kilómetros' : 'tiempo'})</Texto>
          )}
          {parte.ultimo_cambio_conocido
            ? <Texto variante="pequeno">Último cambio: {fecha(parte.ultimo_cambio_fecha)}, {km(parte.ultimo_cambio_km)}</Texto>
            : <Aviso tipo="aviso">No sabemos cuándo se cambió por última vez, así que se cuenta desde la matrícula. Revísala o indica su último cambio.</Aviso>}
          {/* RN-16: solo mientras la parte no tenga cambios registrados en la app */}
          {parte.cambios_registrados === 0 && (
            <Boton titulo="Corregir último cambio" icono="calendar-outline" onPress={() => router.push(`/vehiculo/${id}/ultimos-cambios?parteId=${parteId}`)} />
          )}
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
              </View>
            ))}
          </Tarjeta>
          <Boton titulo="Quitar parte del plan" icono="trash-outline" tipo="peligro" onPress={quitar} />
        </>
      )}
    </Pantalla>
  );
}
