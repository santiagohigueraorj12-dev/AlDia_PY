// RF-08: registrar un servicio (cambio de una o varias partes) en una sola pantalla.
// RNF-04: 1) elegir partes  2) escribir costos  3) guardar.
// RN-10: si se elige el aceite, el backend puede sugerir agregar el filtro.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { volver } from '../../../utils/navegacion';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import { useErrores } from '../../../api/useErrores';
import { Aviso, Boton, Campo, Cargando, Casilla, Etiqueta, Fila, MensajeCampo, NotaObligatorios, Pantalla, Paso, Separador, Tarjeta, Texto } from '../../../components/ui';
import CampoFecha from '../../../components/CampoFecha';
import { ESTADO_PARTE, aNumero, hoyISO, pesos, porcentaje } from '../../../utils/formato';

export default function RegistrarServicio() {
  // parteId (opcional): viene del botón "Ya lo cambié" del Inicio y deja esa parte marcada
  const { id, parteId } = useLocalSearchParams();
  const { datos: vehiculo } = useDatos(`/vehiculos/${id}`);
  const [fecha, setFecha] = useState(hoyISO());
  const [km, setKm] = useState('');
  const [lugar, setLugar] = useState('');
  // Partes elegidas: { [parteId]: { costo, marca_referencia } }
  const [elegidas, setElegidas] = useState(parteId ? { [parteId]: { costo: '', marca_referencia: '' } } : {});
  const [sugerencias, setSugerencias] = useState([]);
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();
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
    limpiar('cambios');
  }

  function cambiarDato(parteId, campo, valor) {
    setElegidas({ ...elegidas, [parteId]: { ...elegidas[parteId], [campo]: valor } });
  }

  async function guardar() {
    reiniciar();
    setEnviando(true);
    try {
      // Los números se envían tal como se escribieron ("15.400", "$38.000"): el backend los entiende
      await api(`/vehiculos/${id}/servicios`, {
        metodo: 'POST',
        datos: {
          fecha,
          km,
          lugar,
          cambios: ids.map((parteId) => ({
            parte_id: parteId,
            costo: elegidas[parteId].costo,
            marca_referencia: elegidas[parteId].marca_referencia,
          })),
        },
      });
      volver(`/vehiculo/${id}`);
    } catch (e) {
      mostrar(e);
      setEnviando(false);
    }
  }

  if (!vehiculo) return <Cargando />;
  const total = ids.reduce((s, parteId) => s + aNumero(elegidas[parteId].costo), 0);

  return (
    <Pantalla>
      <Aviso>{general}</Aviso>
      <Tarjeta estilo={{ gap: 12 }}>
        <Paso numero={1} titulo="¿Cuándo y dónde?" ayuda={`Servicio de ${vehiculo.placa}`} />
        <NotaObligatorios />
        <CampoFecha etiqueta="Fecha del servicio" obligatorio valor={fecha} maxima={hoyISO()}
          onCambio={(f) => { setFecha(f); limpiar('fecha'); }} error={errores.fecha} />
        <Campo etiqueta="Kilometraje en el servicio" obligatorio value={km} keyboardType="number-pad"
          onChangeText={(t) => { setKm(t); limpiar('km'); }} error={errores.km}
          ayuda={`No puede ser mayor al actual (${vehiculo.km_actual.toLocaleString('es-CO')} km).`} />
        <Campo etiqueta="Lugar o taller" placeholder="Ej.: Taller MotoExpress" value={lugar} onChangeText={setLugar} error={errores.lugar} />
      </Tarjeta>

      <Tarjeta>
        <Paso numero={2} titulo="¿Qué partes cambiaste?" ayuda="Marca las partes y escribe cuánto costó cada una." />
        <MensajeCampo error={errores.cambios} />
        {vehiculo.partes.map((p) => (
          <View key={p.id} style={{ gap: 6 }}>
            <Separador />
            <Casilla marcada={Boolean(elegidas[p.id])} onCambio={() => alternar(p.id)}>
              <Fila estilo={{ justifyContent: 'space-between' }}>
                <Texto estilo={{ flexShrink: 1 }}>{p.nombre}</Texto>
                <Fila>
                  <Texto variante="pequeno">{p.ultimo_cambio_conocido ? porcentaje(p.desgaste.porcentaje) : "Desconocido"}</Texto>
                  <Etiqueta estado={ESTADO_PARTE[p.desgaste.estado]} />
                </Fila>
              </Fila>
            </Casilla>
            {elegidas[p.id] && (
              <Fila estilo={{ flexWrap: 'nowrap', paddingLeft: 34 }}>
                <View style={{ flex: 1 }}>
                  <Campo value={elegidas[p.id].costo} keyboardType="number-pad" placeholder="Costo ($)" accessibilityLabel={`Costo de ${p.nombre}`}
                    onChangeText={(t) => { cambiarDato(p.id, 'costo', t); limpiar(`cambios.${ids.indexOf(p.id)}.costo`); }}
                    error={errores[`cambios.${ids.indexOf(p.id)}.costo`]} />
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
          <Aviso tipo="info" accion={<Boton titulo={`Agregar ${s.nombre.toLowerCase()}`} icono="add" pequeno onPress={() => alternar(s.parteId)} />}>
            {s.mensaje}
          </Aviso>
        </View>
      ))}

      <Tarjeta estilo={{ gap: 12 }}>
        <Paso numero={3} titulo="Revisa y guarda" />
        <Fila estilo={{ justifyContent: 'space-between' }}>
          <Texto variante="suave">{ids.length} parte{ids.length === 1 ? '' : 's'} marcada{ids.length === 1 ? '' : 's'}</Texto>
          <Texto variante="subtitulo">Total: {pesos(total)}</Texto>
        </Fila>
        <Boton
          titulo={enviando ? 'Guardando…' : ids.length ? `Guardar ${ids.length} cambio${ids.length === 1 ? '' : 's'}` : 'Guardar cambios'}
          icono="checkmark-circle" tipo="primario" onPress={guardar} deshabilitado={enviando} />
      </Tarjeta>
    </Pantalla>
  );
}
