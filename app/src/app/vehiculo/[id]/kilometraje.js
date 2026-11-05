// RF-05 + RN-03: actualizar el kilometraje y ver su historial.
// Si el backend responde que el salto es sospechoso (más de 1.500 km en menos
// de un día), se pide confirmación y se reenvía con confirmado = true.
import { useState } from 'react';
import { View } from 'react-native';
import { volver } from '../../../utils/navegacion';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import { useErrores } from '../../../api/useErrores';
import { Aviso, Boton, Campo, Cargando, Cifra, Fila, Pantalla, Separador, Tarjeta, Texto, TituloSeccion } from '../../../components/ui';
import { fecha, km as formatoKm } from '../../../utils/formato';

export default function Kilometraje() {
  const { id } = useLocalSearchParams();
  const { datos: lecturas } = useDatos(`/vehiculos/${id}/kilometraje`);
  const [km, setKm] = useState('');
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();
  const [pregunta, setPregunta] = useState('');  // mensaje de confirmación
  const [enviando, setEnviando] = useState(false);

  async function guardar(confirmado = false) {
    reiniciar();
    setEnviando(true);
    try {
      // Se envía tal como se escribió ("15.400"): el backend lo entiende
      await api(`/vehiculos/${id}/kilometraje`, { metodo: 'POST', datos: { km, confirmado } });
      volver(`/vehiculo/${id}`);
    } catch (e) {
      if (e.datos.requiereConfirmacion) setPregunta(e.message);
      else mostrar(e);
      setEnviando(false);
    }
  }

  if (!lecturas) return <Cargando />;
  const ultimo = lecturas[0];

  return (
    <Pantalla>
      <Tarjeta estilo={{ gap: 12 }}>
        <Fila>
          <Cifra icono="speedometer-outline" valor={formatoKm(ultimo.km)} texto={`Último registrado (${fecha(ultimo.fecha)})`} />
        </Fila>
        <Aviso tipo="info">Escribe el número que marca el tablero (odómetro) de tu vehículo hoy.</Aviso>
        <Aviso>{general}</Aviso>
        {pregunta ? (
          <>
            <Aviso tipo="aviso">{pregunta}</Aviso>
            <Fila>
              <Boton titulo="Sí, es correcto" icono="checkmark" tipo="primario" onPress={() => guardar(true)} />
              <Boton titulo="No, corregir" icono="create-outline" onPress={() => { setPregunta(''); setEnviando(false); }} />
            </Fila>
          </>
        ) : (
          <>
            <Campo etiqueta="Kilometraje actual del odómetro" obligatorio placeholder="Ej.: 15.800" value={km}
              onChangeText={(t) => { setKm(t); limpiar('km'); }} keyboardType="number-pad" autoFocus error={errores.km} />
            <Boton titulo={enviando ? 'Guardando…' : 'Guardar kilometraje'} icono="checkmark-circle" tipo="primario" onPress={() => guardar()} deshabilitado={enviando} />
          </>
        )}
      </Tarjeta>

      <Tarjeta>
        <TituloSeccion titulo="Historial" icono="time-outline" />
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
