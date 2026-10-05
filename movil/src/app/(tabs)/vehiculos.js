// RF-04: lista de vehículos del usuario.
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useDatos } from '../../api/useDatos';
import { urlArchivo } from '../../api/cliente';
import { Aviso, Boton, Cargando, Etiqueta, Fila, Pantalla, Tarjeta, Texto } from '../../components/ui';
import { useColores } from '../../tema';
import { ESTADO_VEHICULO, km, pesos } from '../../utils/formato';

export default function Vehiculos() {
  const c = useColores();
  const { datos: vehiculos, error, refrescar, refrescando } = useDatos('/vehiculos');

  if (error) return <Pantalla><Aviso>{error}</Aviso></Pantalla>;
  if (!vehiculos) return <Cargando />;

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      <Boton titulo="+ Registrar vehículo" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />

      {vehiculos.length === 0 && (
        <Tarjeta><Texto variante="suave" estilo={{ textAlign: 'center' }}>Aún no tienes vehículos registrados.</Texto></Tarjeta>
      )}

      {vehiculos.map((v) => (
        <Pressable key={v.id} onPress={() => router.push(`/vehiculo/${v.id}`)}>
          <Tarjeta>
            {v.foto_url ? (
              <Image source={{ uri: urlArchivo(v.foto_url) }} style={{ width: '100%', height: 150, borderRadius: 8 }} accessibilityLabel={`Foto de ${v.placa}`} />
            ) : (
              <View style={{ height: 90, borderRadius: 8, backgroundColor: c.superficie2, alignItems: 'center', justifyContent: 'center' }}>
                <Texto estilo={{ fontSize: 40 }}>{v.tipo === 'Moto' ? '🏍️' : '🚗'}</Texto>
              </View>
            )}
            <Fila estilo={{ justifyContent: 'space-between' }}>
              <Texto variante="negrita">{v.placa}</Texto>
              <Etiqueta estado={ESTADO_VEHICULO[v.estado]} />
            </Fila>
            <Texto>{v.marca} {v.modelo} {v.anio}</Texto>
            <Texto variante="pequeno">
              {km(v.kmCalculo)}{v.kmEstimado ? ' (estimado)' : ''} · Mantenimiento: {pesos(v.costos.mantenimiento)}
            </Texto>
          </Tarjeta>
        </Pressable>
      ))}
    </Pantalla>
  );
}
