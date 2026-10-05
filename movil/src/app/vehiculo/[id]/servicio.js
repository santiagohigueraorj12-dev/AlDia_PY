// RF-08: registrar un servicio (cambio de una o varias partes) en una sola pantalla.
// RNF-04: 1) elegir partes  2) escribir costos  3) guardar.
// RN-10: si se elige el aceite, el backend puede sugerir agregar el filtro.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import { Aviso, Boton, Campo, Cargando, Casilla, Etiqueta, Fila, Pantalla, Separador, Tarjeta, Texto } from '../../../components/ui';
import CampoFecha from '../../../components/CampoFecha';
import { ESTADO_PARTE, hoyISO, pesos, porcentaje } from '../../../utils/formato';

export default function RegistrarServicio() {
  const { id } = useLocalSearchParams();
  const { datos: vehiculo } = useDatos(`/vehiculos/${id}`);
  const [fecha, setFecha] = useState(hoyISO());
  const [km, setKm] = useState('');
  const [lugar, setLugar] = useState('');
  // Partes elegidas: { [parteId]: { costo, marca_referencia } }
  const [elegidas, setElegidas] = useState({});
  const [sugerencias, setSugerencias] = useState([]);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const ids = Object.keys(elegidas).map(Number);

  // El km del servicio empieza en el km actual del vehículo
  useEffect(() => {
    if (vehiculo && km === '') setKm(String(vehiculo.km_actual));
  }, [vehiculo]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Cada vez que cambian las partes elegidas se piden sugerencias al backend (RN-10)
  useEffect(() => {
    if (ids.length === 0) { setSugerencias([]); return; }
    api(`/vehiculos/${id}/servicios/sugerencias`, { metodo: 'POST', datos: { parteIds: ids } })
      .then(setSugerencias)
      .catch(() => setSugerencias([]));
  }, [ids.join(','), id]);  // eslint-disable-line react-hooks/exhaustive-deps

  function alternar(parteId) {
    const copia = { ...elegidas };
    if (copia[parteId]) delete copia[parteId];
    else copia[parteId] = { costo: '', marca_referencia: '' };
    setElegidas(copia);
  }

  function cambiarDato(parteId, campo, valor) {
    setElegidas({ ...elegidas, [parteId]: { ...elegidas[parteId], [campo]: valor } });
  }

  async function guardar() {
    setError('');
    setEnviando(true);
    try {
      await api(`/vehiculos/${id}/servicios`, {
        metodo: 'POST',
        datos: {
          fecha,
          km: Number(km),
          lugar,
          cambios: ids.map((parteId) => ({
            parte_id: parteId,
            costo: Number(elegidas[parteId].costo || 0),
            marca_referencia: elegidas[parteId].marca_referencia,
          })),
        },
      });
      router.back();
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  if (!vehiculo) return <Cargando />;
  const total = ids.reduce((s, parteId) => s + Number(elegidas[parteId].costo || 0), 0);

  return (
    <Pantalla>
      <Aviso>{error}</Aviso>
      <Tarjeta estilo={{ gap: 12 }}>
        <Texto variante="subtitulo">{vehiculo.placa} · Datos del servicio</Texto>
        <CampoFecha etiqueta="Fecha" valor={fecha} onCambio={setFecha} maxima={hoyISO()} />
        <Campo etiqueta="Kilometraje" value={km} onChangeText={setKm} keyboardType="number-pad"
          ayuda={`No puede ser mayor al actual (${vehiculo.km_actual.toLocaleString('es-CO')} km)`} />
        <Campo etiqueta="Lugar / taller (opcional)" value={lugar} onChangeText={setLugar} />
      </Tarjeta>

      <Tarjeta>
        <Texto variante="subtitulo">¿Qué partes cambiaste?</Texto>
        {vehiculo.partes.map((p) => (
          <View key={p.id} style={{ gap: 6 }}>
            <Separador />
            <Casilla marcada={Boolean(elegidas[p.id])} onCambio={() => alternar(p.id)}>
              <Fila estilo={{ justifyContent: 'space-between' }}>
                <Texto estilo={{ flexShrink: 1 }}>{p.nombre}</Texto>
                <Fila>
                  <Texto variante="pequeno">{porcentaje(p.desgaste.porcentaje)}</Texto>
                  <Etiqueta estado={ESTADO_PARTE[p.desgaste.estado]} />
                </Fila>
              </Fila>
            </Casilla>
            {elegidas[p.id] && (
              <Fila estilo={{ flexWrap: 'nowrap', paddingLeft: 34 }}>
                <View style={{ flex: 1 }}>
                  <Campo value={elegidas[p.id].costo} onChangeText={(t) => cambiarDato(p.id, 'costo', t)} keyboardType="number-pad" placeholder="Costo ($)" accessibilityLabel={`Costo de ${p.nombre}`} />
                </View>
                <View style={{ flex: 1 }}>
                  <Campo value={elegidas[p.id].marca_referencia} onChangeText={(t) => cambiarDato(p.id, 'marca_referencia', t)} placeholder="Marca" accessibilityLabel={`Marca de ${p.nombre}`} />
                </View>
              </Fila>
            )}
          </View>
        ))}
      </Tarjeta>

      {sugerencias.map((s) => (
        <View key={s.parteId} style={{ gap: 6 }}>
          <Aviso tipo="aviso">💡 {s.mensaje}</Aviso>
          <Boton titulo={`Agregar ${s.nombre.toLowerCase()}`} onPress={() => alternar(s.parteId)} />
        </View>
      ))}

      <Texto variante="subtitulo">Total del servicio: {pesos(total)}</Texto>
      <Boton
        titulo={enviando ? 'Guardando…' : `Guardar ${ids.length || ''} cambio${ids.length === 1 ? '' : 's'}`}
        tipo="primario" onPress={guardar} deshabilitado={enviando || ids.length === 0 || !km} />
    </Pantalla>
  );
}
