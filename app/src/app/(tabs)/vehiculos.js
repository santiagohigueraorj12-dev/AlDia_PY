// RF-04: lista de vehículos del usuario, con accesos directos a lo que más se usa.
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDatos } from '../../api/useDatos';
import { urlArchivo } from '../../api/cliente';
import { Aviso, Boton, Cargando, Etiqueta, Fila, Pantalla, Tarjeta, Texto, Vacio } from '../../components/ui';
import { useColores } from '../../tema';
import { EscenaCarretera, IlustracionVehiculo } from '../../components/Ilustraciones';
import { ESTADO_VEHICULO, EXPLICACION_VEHICULO, km, pesos } from '../../utils/formato';
import Placa from '../../components/Placa';
import AnilloSalud from '../../components/AnilloSalud';

export default function Vehiculos() {
  const c = useColores();
  // En el computador las tarjetas van de a dos por fila
  const enGrilla = useWindowDimensions().width >= 1000;
  const { datos: vehiculos, error, refrescar, refrescando } = useDatos('/vehiculos');

  if (error) return <Pantalla><Aviso>{error}</Aviso></Pantalla>;
  if (!vehiculos) return <Cargando />;

  if (vehiculos.length === 0) {
    return (
      <Pantalla>
        <Vacio ilustracion={<View style={{ width: '100%', maxWidth: 380 }}><EscenaCarretera /></View>} titulo="Aún no tienes vehículos"
          texto="Registra tu moto o carro. Solo necesitas la placa, la marca, la línea, el modelo y el kilometraje."
          boton={<Boton titulo="Registrar mi vehículo" icono="add-circle-outline" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />} />
      </Pantalla>
    );
  }

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando} ancha>
      <Boton titulo="Registrar otro vehículo" icono="add-circle-outline" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {vehiculos.map((v) => {
        const estado = ESTADO_VEHICULO[v.estado];
        return (
          <Tarjeta key={v.id} estilo={{ gap: 12, borderLeftWidth: 6, borderLeftColor: c[`${estado.clase}Barra`], flexBasis: enGrilla ? '48%' : '100%', flexGrow: 1 }}>
            <Pressable onPress={() => router.push(`/vehiculo/${v.id}`)} accessibilityRole="button" accessibilityLabel={`Ver ${v.placa}`}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, alignItems: 'center', opacity: pressed ? 0.75 : 1 })}>
              {v.foto_url
                ? <Image source={{ uri: urlArchivo(v.foto_url) }} style={{ width: 96, height: 64, borderRadius: 12 }} accessibilityLabel={`Foto de ${v.placa}`} />
                : (
                  <View style={{ width: 96, height: 64, borderRadius: 12, backgroundColor: c[`${estado.clase}Fondo`], alignItems: 'center', justifyContent: 'center' }}>
                    <IlustracionVehiculo tipo={v.tipo} ancho={82} color={c[estado.clase]} />
                  </View>
                )}
              <View style={{ flex: 1, gap: 3 }}>
                <Fila estilo={{ justifyContent: 'space-between' }}>
                  <Placa placa={v.placa} tipo={v.tipo} alto={32} />
                  <Etiqueta estado={estado} />
                </Fila>
                <Texto>{v.marca} {v.linea} ({v.modelo})</Texto>
                <Texto variante="pequeno">
                  {km(v.kmCalculo)}{v.kmEstimado ? ' (aprox.)' : ''} · Mantenimiento: {pesos(v.costos.mantenimiento)}
                </Texto>
                <Texto variante="pequeno" estilo={{ color: c[estado.clase] }}>{EXPLICACION_VEHICULO[v.estado]}</Texto>
              </View>
              {v.salud && <AnilloSalud porcentaje={v.salud.porcentaje} nivel={v.salud.nivel} tamano={52} />}
              <Ionicons name="chevron-forward" size={20} color={c.textoSuave} />
            </Pressable>
            <Fila>
              <Boton titulo="Registrar cambio" icono="construct-outline" pequeno onPress={() => router.push(`/vehiculo/${v.id}/servicio`)} />
              <Boton titulo="Actualizar km" icono="speedometer-outline" pequeno onPress={() => router.push(`/vehiculo/${v.id}/kilometraje`)} />
            </Fila>
          </Tarjeta>
        );
      })}
      </View>
    </Pantalla>
  );
}
