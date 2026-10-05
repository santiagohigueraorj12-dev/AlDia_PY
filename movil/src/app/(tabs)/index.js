// RF-14: pestaña Inicio. Todo lo importante en un solo lugar.
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useDatos } from '../../api/useDatos';
import { useSesion } from '../../context/SesionContext';
import { Aviso, BarraDesgaste, Boton, Cargando, Cifra, Etiqueta, Fila, Pantalla, Separador, Tarjeta, Texto } from '../../components/ui';
import { ESTADO_DOCUMENTO, ESTADO_PARTE, ESTADO_VEHICULO, fecha, km, pesos, porcentaje } from '../../utils/formato';

export default function Inicio() {
  const { usuario } = useSesion();
  const { datos: panel, error, refrescar, refrescando } = useDatos('/panel');

  if (error) return <Pantalla><Aviso>{error}</Aviso><Boton titulo="Reintentar" onPress={refrescar} /></Pantalla>;
  if (!panel) return <Cargando />;

  const nombre = usuario.nombre.split(' ')[0];

  if (panel.vehiculos.length === 0) {
    return (
      <Pantalla>
        <Tarjeta estilo={{ alignItems: 'center', paddingVertical: 30 }}>
          <Texto variante="titulo">¡Hola, {nombre}!</Texto>
          <Texto variante="suave" estilo={{ textAlign: 'center' }}>Registra tu primera moto o carro para empezar a controlar su mantenimiento.</Texto>
          <Boton titulo="Registrar vehículo" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />
        </Tarjeta>
      </Pantalla>
    );
  }

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      <View>
        <Texto variante="titulo">¡Hola, {nombre}!</Texto>
        <Texto variante="suave">Así va el mantenimiento de tus vehículos.</Texto>
      </View>

      <Fila>
        <Cifra valor={panel.partesUrgentes.filter((p) => p.desgaste.estado === 'vencida').length} texto="Partes vencidas" />
        <Cifra valor={panel.partesUrgentes.filter((p) => p.desgaste.estado === 'proxima').length} texto="Próximas a cambio" />
        <Cifra valor={pesos(panel.gastoMes.total)} texto="Gastado este mes" />
        <Cifra valor={pesos(panel.estimadoMes)} texto="Estimado del mes" />
      </Fila>

      <Texto variante="subtitulo">Mis vehículos</Texto>
      {panel.vehiculos.map((v) => (
        <Pressable key={v.id} onPress={() => router.push(`/vehiculo/${v.id}`)}>
          <Tarjeta>
            <Fila estilo={{ justifyContent: 'space-between' }}>
              <Texto variante="negrita">{v.placa}</Texto>
              <Etiqueta estado={ESTADO_VEHICULO[v.estado]} />
            </Fila>
            <Texto variante="suave">{v.marca} {v.modelo} · {km(v.kmCalculo)}{v.kmEstimado ? ' (estimado)' : ''}</Texto>
            <Texto variante="pequeno">🟢 {v.resumenPartes.bien} bien · 🟡 {v.resumenPartes.proximas} próximas · 🔴 {v.resumenPartes.vencidas} vencidas</Texto>
          </Tarjeta>
        </Pressable>
      ))}

      <Tarjeta>
        <Texto variante="subtitulo">Partes que requieren cambio</Texto>
        {panel.partesUrgentes.length === 0 && <Texto variante="suave">Todas las partes están bien. 👍</Texto>}
        {panel.partesUrgentes.map((p, i) => (
          <Pressable key={p.id} onPress={() => router.push(`/vehiculo/${p.vehiculoId}`)} style={{ gap: 6 }}>
            {i > 0 && <Separador />}
            <Fila estilo={{ justifyContent: 'space-between' }}>
              <Texto variante="negrita" estilo={{ flexShrink: 1 }}>{p.nombre} · {p.placa}</Texto>
              <Etiqueta estado={ESTADO_PARTE[p.desgaste.estado]} />
            </Fila>
            <BarraDesgaste porcentaje={p.desgaste.porcentaje} estado={p.desgaste.estado} />
            <Texto variante="pequeno">
              {porcentaje(p.desgaste.porcentaje)} de desgaste{p.costoEstimado !== null ? ` · Último costo: ${pesos(p.costoEstimado)}` : ''}
            </Texto>
          </Pressable>
        ))}
      </Tarjeta>

      <Tarjeta>
        <Texto variante="subtitulo">Documentos por vencer</Texto>
        {panel.documentosPorVencer.length === 0 && <Texto variante="suave">No hay documentos vencidos ni por vencer en los próximos 30 días.</Texto>}
        {panel.documentosPorVencer.map((d, i) => (
          <Pressable key={d.id} onPress={() => router.push(`/vehiculo/${d.vehiculoId}`)} style={{ gap: 4 }}>
            {i > 0 && <Separador />}
            <Fila estilo={{ justifyContent: 'space-between' }}>
              <Texto variante="negrita" estilo={{ flexShrink: 1 }}>{d.nombre} · {d.placa}</Texto>
              <Etiqueta estado={ESTADO_DOCUMENTO[d.estado]} />
            </Fila>
            <Texto variante="pequeno">Vence el {fecha(d.fecha_vencimiento)}</Texto>
          </Pressable>
        ))}
      </Tarjeta>
    </Pantalla>
  );
}
