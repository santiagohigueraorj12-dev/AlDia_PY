// RF-07 + RN-05: agregar una parte o ajustar sus intervalos (nunca en cero),
// y RF-09: ver el historial de cambios de esa parte.
// Sin "parteId" en la ruta -> parte nueva.  Con "parteId" -> editar esa parte.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { volver } from '../../../utils/navegacion';
import { Stack, useLocalSearchParams } from 'expo-router';
import { api } from '../../../api/cliente';
import { Aviso, BarraDesgaste, Boton, Campo, Cargando, Casilla, Fila, Pantalla, Separador, Tarjeta, Texto } from '../../../components/ui';
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
  const [error, setError] = useState('');

  // Si se está editando, se cargan la parte (con su desgaste) y su historial
  useEffect(() => {
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
  }, [id, parteId, nueva]);

  async function guardar() {
    setError('');
    const datos = { nombre, intervalo_km: soloTiempo ? null : Number(intervaloKm), intervalo_meses: Number(meses) };
    try {
      if (nueva) await api(`/vehiculos/${id}/partes`, { metodo: 'POST', datos });
      else await api(`/partes/${parteId}`, { metodo: 'PUT', datos });
      volver(`/vehiculo/${id}`);
    } catch (e) {
      setError(e.message);
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
          <Texto>{porcentaje(parte.desgaste.porcentaje)} de desgaste (por {parte.desgaste.motivo === 'km' ? 'kilómetros' : 'tiempo'})</Texto>
          <Texto variante="pequeno">Último cambio: {fecha(parte.ultimo_cambio_fecha)}, {km(parte.ultimo_cambio_km)}</Texto>
        </Tarjeta>
      )}

      <Tarjeta estilo={{ gap: 12 }}>
        <Texto variante="subtitulo">{nueva ? 'Datos de la parte' : 'Ajustar intervalos'}</Texto>
        <Aviso>{error}</Aviso>
        <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} />
        <Casilla marcada={soloTiempo} onCambio={setSoloTiempo}>Se controla solo por tiempo (no por kilómetros)</Casilla>
        <Fila estilo={{ flexWrap: 'nowrap' }}>
          {!soloTiempo && (
            <View style={{ flex: 1 }}><Campo etiqueta="Cada (km)" value={intervaloKm} onChangeText={setIntervaloKm} keyboardType="number-pad" /></View>
          )}
          <View style={{ flex: 1 }}><Campo etiqueta="Cada (meses)" value={meses} onChangeText={setMeses} keyboardType="number-pad" /></View>
        </Fila>
        {nueva && <Texto variante="pequeno">La parte nueva empieza en 0 % de desgaste (como si se hubiera cambiado hoy).</Texto>}
        <Boton titulo="Guardar" tipo="primario" onPress={guardar} deshabilitado={!nombre || !meses || (!soloTiempo && !intervaloKm)} />
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
          <Boton titulo="Quitar parte del plan" tipo="peligro" onPress={quitar} />
        </>
      )}
    </Pantalla>
  );
}
