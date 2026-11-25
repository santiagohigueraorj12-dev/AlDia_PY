// RF-14: pestaña Inicio. Todo lo importante en un solo lugar.
// Primero responde "¿qué tengo que hacer?" (lista de tareas con su botón),
// después muestra las cifras y los vehículos.
import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDatos } from '../../api/useDatos';
import { useSesion } from '../../context/SesionContext';
import { Aviso, BarraDesgaste, Boton, Cargando, Cifra, Columnas, ElementoLista, Etiqueta, Fila, Icono, Pantalla, Separador, Tarjeta, Texto, TituloSeccion, Vacio } from '../../components/ui';
import { useColores } from '../../tema';
import { armarTareas } from '../../utils/tareas';
import { EscenaCarretera, IlustracionVehiculo } from '../../components/Ilustraciones';
import { ESTADO_VEHICULO, km, pesos } from '../../utils/formato';
import { Degradado } from '../../components/Decoracion';
import AnilloSalud from '../../components/AnilloSalud';
import Placa from '../../components/Placa';
import GraficaGastos from '../../components/GraficaGastos';

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
        <Texto variante="titulo">¡Hola, {nombre}!</Texto>
        <Vacio
          ilustracion={<View style={{ width: '100%', maxWidth: 380 }}><EscenaCarretera /></View>}
          titulo="Empieza registrando tu vehículo"
          texto="Registra tu moto o carro y AlDía te dirá qué partes cambiar, cuándo vencen tus documentos y cuánto gastas."
          boton={<Boton titulo="Registrar mi vehículo" icono="add-circle-outline" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />}
        />
      </Pantalla>
    );
  }

  const tareas = armarTareas(panel, usuario);
  const visibles = verTodas ? tareas : tareas.slice(0, TAREAS_VISIBLES);
  const vencidas = panel.partesUrgentes.filter((p) => p.desgaste.estado === 'vencida').length;
  const proximas = panel.partesUrgentes.filter((p) => p.desgaste.estado === 'proxima').length;
  const docs = panel.documentacion;
  const alertasDocs = docs.faltantes + docs.vencidos;
  const estadoDocs = alertasDocs > 0
    ? { texto: `${alertasDocs} requieren atención`, clase: 'vencida' }
    : docs.porVencer > 0
      ? { texto: `${docs.porVencer} por vencer`, clase: 'proxima' }
      : { texto: 'Al día', clase: 'bien' };
  const dosColumnas = width >= 1000;
  const tresColumnas = width >= 1450;  // pantallas grandes: tres columnas para aprovechar el ancho
  // En dos columnas las cifras van de a dos por fila (la columna es más angosta)
  const anchoCifra = width >= 700 && !dosColumnas ? '22%' : '47%';

  // 1. Lo que debe hacer el usuario, con el botón para hacerlo
  const tarjetaTareas = tareas.length > 0 && (
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
  );

  // Resumen de documentación con acceso al módulo completo
  const tarjetaDocumentos = (
    <Tarjeta>
      <TituloSeccion titulo="Documentación" icono="document-text" />
      <ElementoLista
        icono="shield-checkmark-outline"
        tono={estadoDocs.clase}
        titulo={estadoDocs.texto}
        detalle={`${docs.faltantes} faltantes · ${docs.vencidos} vencidos · ${docs.porVencer} próximos`}
        onPress={() => router.push('/documentos')}
      />
    </Tarjeta>
  );

  // 2. Cifras del mes
  const cifras = (
    <Fila>
      <Cifra valor={vencidas} texto="Partes vencidas" icono="alert-circle" tono={vencidas ? 'vencida' : 'bien'} ancho={anchoCifra} />
      <Cifra valor={proximas} texto="Próximas a cambio" icono="time" tono={proximas ? 'proxima' : 'bien'} ancho={anchoCifra} />
      {/* Las cifras de plata van en azul (el segundo color del logo) */}
      <Cifra valor={pesos(panel.gastoMes.total)} texto="Gastado este mes" icono="wallet" tono="azul" ancho={anchoCifra} />
      <Cifra valor={pesos(panel.estimadoMes)} texto="Gasto estimado del mes" icono="calculator" tono="azul" ancho={anchoCifra} />
    </Fila>
  );

  // 3. Vehículos
  const vehiculos = (
    <View style={{ gap: 14 }}>
      <TituloSeccion titulo="Mis vehículos" icono="car-sport"
        accion={<Boton titulo="Agregar" icono="add" tipo="enlace" onPress={() => router.push('/vehiculo/nuevo')} />} />
      {panel.vehiculos.map((v) => <TarjetaVehiculo key={v.id} vehiculo={v} />)}
    </View>
  );
  const perfil = usuario.perfil.porcentaje < 100 && <CompletarPerfil perfil={usuario.perfil} />;

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando} ancha>
      <Resumen nombre={nombre} pendientes={tareas.length} salud={panel.salud} vehiculos={panel.vehiculos} />
      {tresColumnas ? (
        // Pantalla grande: tareas | cifras y gastos | perfil, documentos y vehículos
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
          <View style={{ flex: 1.15, gap: 14, minWidth: 0 }}>{tarjetaTareas || <SinPendientes />}</View>
          <View style={{ flex: 1, gap: 14, minWidth: 0 }}>{cifras}<GraficaGastos /></View>
          <View style={{ flex: 1, gap: 14, minWidth: 0 }}>{perfil}{tarjetaDocumentos}{vehiculos}</View>
        </View>
      ) : dosColumnas ? (
        // Computador: tareas y gastos a la izquierda; perfil, documentos, cifras y vehículos a la derecha
        <Columnas
          izquierda={<>{tarjetaTareas}<GraficaGastos /></>}
          derecha={<>{perfil}{tarjetaDocumentos}{cifras}{vehiculos}</>}
        />
      ) : (
        // Celular: una sola columna, de lo más urgente a lo menos
        <View style={{ gap: 14 }}>
          {perfil}{tarjetaTareas}{tarjetaDocumentos}{cifras}
          {/* RF-26: gastos de los últimos 12 meses */}
          <GraficaGastos />
          {vehiculos}
        </View>
      )}
    </Pantalla>
  );
}

/** Columna de tareas cuando no hay nada pendiente (pantallas grandes). */
function SinPendientes() {
  return (
    <Tarjeta>
      <TituloSeccion titulo="Lo que debes hacer" icono="checkbox-outline" />
      <Vacio icono="checkmark-done-outline" titulo="Todo al día" texto="No tienes partes, documentos ni daños pendientes. Te avisaremos cuando algo lo necesite." />
    </Tarjeta>
  );
}

/**
 * Saludo con una frase que resume todo y, a la derecha, el anillo de salud (RN-19):
 * qué tan al día están los vehículos, de 0 a 100 %.
 */
function Resumen({ nombre, pendientes, salud, vehiculos }) {
  const c = useColores();
  const alDia = pendientes === 0;
  // El porcentaje ya lo muestra el anillo: aquí se dice, en palabras, cómo está cada vehículo
  const cuenta = (estado) => vehiculos.filter((v) => v.estado === estado).length;
  const partes = [
    [cuenta('al_dia'), 'al día'],
    [cuenta('requiere_atencion'), cuenta('requiere_atencion') === 1 ? 'requiere atención' : 'requieren atención'],
    [cuenta('no_apto'), cuenta('no_apto') === 1 ? 'no apto para circular' : 'no aptos para circular'],
  ].filter(([n]) => n > 0).map(([n, texto]) => `${n} ${texto}`);
  return (
    <Degradado circulos estilo={{ borderRadius: 14, borderWidth: c.esOscuro ? 0 : 1, borderColor: c.borde, boxShadow: `0 10px 24px ${c.sombra}` }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: c.sobreDegradado, fontSize: 24, fontWeight: '800' }}>¡Hola, {nombre}!</Text>
        <Text style={{ color: c.sobreDegradado, fontSize: 15.5, fontWeight: '700' }}>
          {vehiculos.length === 1 ? 'Tu vehículo' : `Tus ${vehiculos.length} vehículos`}: {partes.join(' · ')}
        </Text>
        <Text style={{ color: c.sobreDegradadoSuave, fontSize: 14.5 }}>
          {alDia
            ? '¡Buen trabajo! No tienes nada pendiente.'
            : `Tienes ${pendientes} ${pendientes === 1 ? 'cosa pendiente' : 'cosas pendientes'}. Empieza por la primera de la lista.`}
        </Text>
      </View>
      {salud && <AnilloSalud porcentaje={salud.porcentaje} nivel={salud.nivel} tamano={104} claro={c.esOscuro} />}
    </View>
    {/* Franja de carretera al pie del saludo */}
    <View style={{ height: 10, backgroundColor: c.esOscuro ? 'rgba(0,0,0,0.35)' : c.superficie2, justifyContent: 'center' }}>
      <View style={{ height: 2, marginHorizontal: 12, borderStyle: 'dashed', borderTopWidth: 2, borderColor: c.esOscuro ? 'rgba(255,255,255,0.7)' : c.acento }} />
    </View>
    </Degradado>
  );
}

/** Invita a llenar los datos que faltan del perfil (RF-03). */
function CompletarPerfil({ perfil }) {
  const celular = useWindowDimensions().width < 480;  // en el celular el botón va debajo, a todo el ancho
  return (
    <Tarjeta estilo={{ flexDirection: 'row', flexWrap: celular ? 'wrap' : 'nowrap', alignItems: 'center', gap: 12 }}>
      <Icono nombre="person-circle-outline" tono="primario" tamano={44} />
      <View style={{ flex: 1, gap: 6, minWidth: 180 }}>
        <Texto variante="negrita">Completa tu perfil ({perfil.porcentaje} %)</Texto>
        <BarraDesgaste porcentaje={perfil.porcentaje} estado="proxima" />
        <Texto variante="pequeno">Te falta: {perfil.faltan.join(', ').toLowerCase()}.</Texto>
      </View>
      <Boton titulo="Completar" icono="create-outline" pequeno onPress={() => router.push('/perfil')} estilo={celular ? { flexBasis: '100%' } : undefined} />
    </Tarjeta>
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
      <Tarjeta estilo={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 6, borderLeftColor: c[`${estado.clase}Barra`] }}>
        <View style={{ width: 76, height: 52, borderRadius: 10, backgroundColor: c[`${estado.clase}Fondo`], alignItems: 'center', justifyContent: 'center' }}>
          <IlustracionVehiculo tipo={v.tipo} ancho={64} color={c[estado.clase]} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Fila estilo={{ justifyContent: 'space-between' }}>
            <Placa placa={v.placa} tipo={v.tipo} alto={30} />
            <Etiqueta estado={estado} />
          </Fila>
          <Texto variante="suave">{v.marca} {v.linea} ({v.modelo}) · {km(v.kmCalculo)}{v.kmEstimado ? ' (aprox.)' : ''}</Texto>
          <Fila estilo={{ gap: 12 }}>
            {puntos.map(([clase, n, texto]) => (
              <View key={clase} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c[`${clase}Barra`] }} />
                <Texto variante="pequeno">{n} {texto}</Texto>
              </View>
            ))}
          </Fila>
        </View>
        {v.salud && <AnilloSalud porcentaje={v.salud.porcentaje} nivel={v.salud.nivel} tamano={50} />}
        <Ionicons name="chevron-forward" size={20} color={c.textoSuave} />
      </Tarjeta>
    </Pressable>
  );
}
