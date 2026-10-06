// RF-05 + RN-03: actualizar el kilometraje y ver su historial.
// Si el backend responde que el salto es sospechoso (más de 1.500 km en menos
// de un día), se pide confirmación y se reenvía con confirmado = true.
import { useState } from 'react';
import { View } from 'react-native';
import { volver } from '../../../utils/navegacion';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import { Aviso, Boton, Campo, Cargando, Fila, Pantalla, Separador, Tarjeta, Texto } from '../../../components/ui';
import { fecha, km as formatoKm } from '../../../utils/formato';

export default function Kilometraje() {
  const { id } = useLocalSearchParams();
  const { datos: lecturas } = useDatos(`/vehiculos/${id}/kilometraje`);
  const [km, setKm] = useState('');
  const [error, setError] = useState('');
  const [pregunta, setPregunta] = useState('');  // mensaje de confirmación
  const [enviando, setEnviando] = useState(false);

  async function guardar(confirmado = false) {
    setError('');
    setEnviando(true);
    try {
      await api(`/vehiculos/${id}/kilometraje`, { metodo: 'POST', datos: { km: Number(km), confirmado } });
      volver(`/vehiculo/${id}`);
    } catch (e) {
      if (e.datos.requiereConfirmacion) setPregunta(e.message);
      else setError(e.message);
      setEnviando(false);
    }
  }

  if (!lecturas) return <Cargando />;
  const ultimo = lecturas[0];

  return (
    <Pantalla>
      <Tarjeta estilo={{ gap: 12 }}>
        <Texto variante="suave">Último registrado: <Texto variante="negrita">{formatoKm(ultimo.km)}</Texto> ({fecha(ultimo.fecha)})</Texto>
        <Aviso>{error}</Aviso>
        {pregunta ? (
          <>
            <Aviso tipo="aviso">{pregunta}</Aviso>
            <Fila>
              <Boton titulo="Sí, es correcto" tipo="primario" onPress={() => guardar(true)} />
              <Boton titulo="No, corregir" onPress={() => { setPregunta(''); setEnviando(false); }} />
            </Fila>
          </>
        ) : (
          <>
            <Campo etiqueta="Kilometraje actual del odómetro" value={km} onChangeText={setKm} keyboardType="number-pad" autoFocus />
            <Boton titulo="Guardar" tipo="primario" onPress={() => guardar()} deshabilitado={!km || enviando} />
          </>
        )}
      </Tarjeta>

      <Tarjeta>
        <Texto variante="subtitulo">Historial</Texto>
        {lecturas.map((l, i) => {
          const anterior = lecturas[i + 1];
          return (
            <View key={l.id}>
              {i > 0 && <Separador />}
              <Fila estilo={{ justifyContent: 'space-between' }}>
                <Texto>{fecha(l.fecha)}</Texto>
                <Texto variante="negrita">{formatoKm(l.km)}</Texto>
              </Fila>
              <Texto variante="pequeno">{anterior ? `+${formatoKm(l.km - anterior.km)} desde la anterior` : 'Registro inicial'}</Texto>
            </View>
          );
        })}
      </Tarjeta>
    </Pantalla>
  );
}
