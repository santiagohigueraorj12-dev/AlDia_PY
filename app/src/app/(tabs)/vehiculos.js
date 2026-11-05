// RF-04: lista de vehículos del usuario, con accesos directos a lo que más se usa.
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDatos } from '../../api/useDatos';
import { urlArchivo } from '../../api/cliente';
import { Aviso, Boton, Cargando, Etiqueta, Fila, IconoVehiculo, Pantalla, Tarjeta, Texto, Vacio } from '../../components/ui';
import { useColores } from '../../tema';
import { ESTADO_VEHICULO, EXPLICACION_VEHICULO, km, pesos } from '../../utils/formato';

export default function Vehiculos() {
  const c = useColores();
  const { datos: vehiculos, error, refrescar, refrescando } = useDatos('/vehiculos');

  if (error) return <Pantalla><Aviso>{error}</Aviso></Pantalla>;
  if (!vehiculos) return <Cargando />;

  if (vehiculos.length === 0) {
    return (
      <Pantalla>
        <Vacio icono="car-sport-outline" titulo="Aún no tienes vehículos"
          texto="Registra tu moto o carro. Solo necesitas la placa, la marca, el modelo y el kilometraje."
          boton={<Boton titulo="Registrar mi vehículo" icono="add-circle-outline" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />} />
      </Pantalla>
    );
  }

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      <Boton titulo="Registrar otro vehículo" icono="add-circle-outline" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />

      {vehiculos.map((v) => {
        const estado = ESTADO_VEHICULO[v.estado];
        return (
          <Tarjeta key={v.id} estilo={{ gap: 12 }}>
            <Pressable onPress={() => router.push(`/vehiculo/${v.id}`)} accessibilityRole="button" accessibilityLabel={`Ver ${v.placa}`}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', opacity: pressed ? 0.75 : 1 })}>
              {v.foto_url
                ? <Image source={{ uri: urlArchivo(v.foto_url) }} style={{ width: 64, height: 64, borderRadius: 12 }} accessibilityLabel={`Foto de ${v.placa}`} />
                : <IconoVehiculo tipo={v.tipo} tono={estado.clase} tamano={64} />}
              <View style={{ flex: 1, gap: 3 }}>
                <Fila estilo={{ justifyContent: 'space-between' }}>
                  <Texto variante="negrita" estilo={{ fontSize: 17 }}>{v.placa}</Texto>
                  <Etiqueta estado={estado} />
                </Fila>
                <Texto>{v.marca} {v.modelo} {v.anio}</Texto>
                <Texto variante="pequeno">
                  {km(v.kmCalculo)}{v.kmEstimado ? ' (aprox.)' : ''} · Mantenimiento: {pesos(v.costos.mantenimiento)}
                </Texto>
                <Texto variante="pequeno" estilo={{ color: c[estado.clase] }}>{EXPLICACION_VEHICULO[v.estado]}</Texto>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textoSuave} />
            </Pressable>
            <Fila>
              <Boton titulo="Registrar cambio" icono="construct-outline" pequeno onPress={() => router.push(`/vehiculo/${v.id}/servicio`)} />
              <Boton titulo="Actualizar km" icono="speedometer-outline" pequeno onPress={() => router.push(`/vehiculo/${v.id}/kilometraje`)} />
            </Fila>
          </Tarjeta>
        );
      })}
    </Pantalla>
  );
}
