// RF-14: pestaña Inicio. Todo lo importante en un solo lugar.
// Primero responde "¿qué tengo que hacer?" (lista de tareas con su botón),
// después muestra las cifras y los vehículos.
import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDatos } from '../../api/useDatos';
import { useSesion } from '../../context/SesionContext';
import { Aviso, Boton, Cargando, Cifra, ElementoLista, Etiqueta, Fila, IconoVehiculo, Pantalla, Separador, Tarjeta, Texto, TituloSeccion, Vacio } from '../../components/ui';
import { useColores } from '../../tema';
import { armarTareas } from '../../utils/tareas';
import { ESTADO_VEHICULO, km, pesos } from '../../utils/formato';

const TAREAS_VISIBLES = 4;

export default function Inicio() {
  const { usuario } = useSesion();
  const { width } = useWindowDimensions();
  const { datos: panel, error, refrescar, refrescando } = useDatos('/panel');
  const [verTodas, setVerTodas] = useState(false);

  if (error) return <Pantalla><Aviso>{error}</Aviso><Boton titulo="Reintentar" icono="refresh" onPress={refrescar} /></Pantalla>;
  if (!panel) return <Cargando />;

  const nombre = usuario.nombre.split(' ')[0];

  // Usuario nuevo: solo se le muestra el primer paso
  if (panel.vehiculos.length === 0) {
    return (
      <Pantalla>
        <Texto variante="titulo">¡Hola, {nombre}! 👋</Texto>
        <Vacio
          icono="car-sport-outline"
          titulo="Empieza registrando tu vehículo"
          texto="Registra tu moto o carro y AlDía te dirá qué partes cambiar, cuándo vencen tus documentos y cuánto gastas."
          boton={<Boton titulo="Registrar mi vehículo" icono="add-circle-outline" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />}
        />
      </Pantalla>
    );
  }

  const tareas = armarTareas(panel);
  const visibles = verTodas ? tareas : tareas.slice(0, TAREAS_VISIBLES);
  const vencidas = panel.partesUrgentes.filter((p) => p.desgaste.estado === 'vencida').length;
  const proximas = panel.partesUrgentes.filter((p) => p.desgaste.estado === 'proxima').length;
  const anchoCifra = width >= 700 ? '22%' : '47%';

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      <Resumen nombre={nombre} pendientes={tareas.length} />

      {/* 1. Lo que debe hacer el usuario, con el botón para hacerlo */}
      {tareas.length > 0 && (
        <Tarjeta estilo={{ gap: 4 }}>
          <TituloSeccion titulo="Lo que debes hacer" icono="checkbox-outline"
            accion={<Texto variante="pequeno">{tareas.length} pendiente{tareas.length === 1 ? '' : 's'}</Texto>} />
          <Texto variante="pequeno">Ordenado de lo más urgente a lo menos urgente.</Texto>
          {visibles.map((t, i) => (
            <View key={t.clave}>
              {i > 0 && <Separador />}
              <ElementoLista icono={t.icono} tono={t.tono} titulo={t.titulo} detalle={t.detalle}>
                <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                  <Boton titulo={t.boton} icono={t.iconoBoton} pequeno tipo={t.tono === 'vencida' ? 'primario' : 'normal'} onPress={() => router.push(t.ruta)} />
                </View>
              </ElementoLista>
            </View>
          ))}
          {tareas.length > TAREAS_VISIBLES && (
            <Boton titulo={verTodas ? 'Ver menos' : `Ver las ${tareas.length} tareas`} tipo="enlace"
              icono={verTodas ? 'chevron-up' : 'chevron-down'} onPress={() => setVerTodas(!verTodas)} estilo={{ marginTop: 6 }} />
          )}
        </Tarjeta>
      )}

      {/* 2. Cifras del mes */}
      <Fila>
        <Cifra valor={vencidas} texto="Partes vencidas" icono="alert-circle" tono={vencidas ? 'vencida' : 'bien'} ancho={anchoCifra} />
        <Cifra valor={proximas} texto="Próximas a cambio" icono="time" tono={proximas ? 'proxima' : 'bien'} ancho={anchoCifra} />
        <Cifra valor={pesos(panel.gastoMes.total)} texto="Gastado este mes" icono="wallet" ancho={anchoCifra} />
        <Cifra valor={pesos(panel.estimadoMes)} texto="Gasto estimado del mes" icono="calculator" ancho={anchoCifra} />
      </Fila>

      {/* 3. Vehículos */}
      <TituloSeccion titulo="Mis vehículos" icono="car-sport"
        accion={<Boton titulo="Agregar" icono="add" tipo="enlace" onPress={() => router.push('/vehiculo/nuevo')} />} />
      {panel.vehiculos.map((v) => <TarjetaVehiculo key={v.id} vehiculo={v} />)}
    </Pantalla>
  );
}

/** Saludo con una frase que resume todo: "Tienes 5 cosas pendientes" o "Todo está al día". */
function Resumen({ nombre, pendientes }) {
  const c = useColores();
  const alDia = pendientes === 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.primario, borderRadius: 14, padding: 18 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.primarioTexto, fontSize: 22, fontWeight: '700' }}>¡Hola, {nombre}!</Text>
        <Text style={{ color: c.primarioTexto, fontSize: 15, opacity: 0.92 }}>
          {alDia
            ? 'Todos tus vehículos están al día. ¡Buen trabajo!'
            : `Tienes ${pendientes} ${pendientes === 1 ? 'cosa pendiente' : 'cosas pendientes'}. Empieza por la primera de la lista.`}
        </Text>
      </View>
      <Ionicons name={alDia ? 'shield-checkmark' : 'construct'} size={44} color={c.primarioTexto} style={{ opacity: 0.85 }} />
    </View>
  );
}

/** Tarjeta de un vehículo: ícono, placa, modelo, km y cuántas partes hay en cada estado. */
function TarjetaVehiculo({ vehiculo: v }) {
  const c = useColores();
  const estado = ESTADO_VEHICULO[v.estado];
  const puntos = [['bien', v.resumenPartes.bien, 'bien'], ['proxima', v.resumenPartes.proximas, 'próximas'], ['vencida', v.resumenPartes.vencidas, 'vencidas']];
  return (
    <Pressable onPress={() => router.push(`/vehiculo/${v.id}`)} accessibilityRole="button" accessibilityLabel={`Ver ${v.placa}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <Tarjeta estilo={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconoVehiculo tipo={v.tipo} tono={estado.clase} />
        <View style={{ flex: 1, gap: 4 }}>
          <Fila estilo={{ justifyContent: 'space-between' }}>
            <Texto variante="negrita" estilo={{ fontSize: 16 }}>{v.placa}</Texto>
            <Etiqueta estado={estado} />
          </Fila>
          <Texto variante="suave">{v.marca} {v.modelo} · {km(v.kmCalculo)}{v.kmEstimado ? ' (aprox.)' : ''}</Texto>
          <Fila estilo={{ gap: 12 }}>
            {puntos.map(([clase, n, texto]) => (
              <View key={clase} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c[`${clase}Barra`] }} />
                <Texto variante="pequeno">{n} {texto}</Texto>
              </View>
            ))}
          </Fila>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.textoSuave} />
      </Tarjeta>
    </Pressable>
  );
}
