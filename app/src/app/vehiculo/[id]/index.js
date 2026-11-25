// Detalle de un vehículo: estado explicado, acciones rápidas, cifras y
// secciones de partes, historial de servicios y documentos.
// Las acciones (registrar cambio, km, parte, documento) abren otras pantallas.
import { useState } from 'react';
import { Image, Linking, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api, descargarYCompartir, urlArchivo } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import {
  Aviso, BarraDesgaste, Boton, Cargando, Cifra, ElementoLista, Etiqueta, Fila,
  Pantalla, Segmentos, Separador, Tarjeta, Texto, TituloSeccion, Vacio,
  Columnas,
} from '../../../components/ui';
import { useColores } from '../../../tema';
import { IlustracionTaller, IlustracionVehiculo } from '../../../components/Ilustraciones';
import { RellenoPrimario } from '../../../components/Decoracion';
import AnilloSalud from '../../../components/AnilloSalud';
import Placa from '../../../components/Placa';
import { avisar, confirmar } from '../../../utils/dialogos';
import {
  ESTADO_DOCUMENTO, ESTADO_PARTE, ESTADO_VEHICULO, EXPLICACION_VEHICULO, NOMBRE_DOCUMENTO,
  TIPO_NOVEDAD, fecha, km, pesos, porcentaje, queHacerParte,
} from '../../../utils/formato';

const SECCIONES = [
  { id: 'partes', titulo: 'Partes', icono: 'construct-outline' },
  { id: 'servicios', titulo: 'Historial', icono: 'time-outline' },
  { id: 'novedades', titulo: 'Daños', icono: 'warning-outline' },
  { id: 'documentos', titulo: 'Documentos', icono: 'document-text-outline' },
];

export default function DetalleVehiculo() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const c = useColores();
  const { datos: vehiculo, error, refrescar, refrescando } = useDatos(`/vehiculos/${id}`);
  const [seccion, setSeccion] = useState('partes');

  if (error) return <Pantalla><Aviso>{error}</Aviso></Pantalla>;
  if (!vehiculo) return <Cargando />;

  async function hojaDeVida() {
    try {
      await descargarYCompartir(`/vehiculos/${id}/hoja-de-vida`, `hoja-de-vida-${vehiculo.placa}.pdf`);
    } catch (e) {
      avisar('No se pudo generar el PDF', e.message);
    }
  }

  async function eliminar() {
    if (!(await confirmar('Eliminar vehículo', `¿Eliminar ${vehiculo.placa} con todo su historial? No se puede deshacer.`, 'Eliminar'))) return;
    await api(`/vehiculos/${id}`, { metodo: 'DELETE' });
    router.replace('/vehiculos');  // el vehículo ya no existe: se va a la lista
  }

  const estado = ESTADO_VEHICULO[vehiculo.estado];
  const sinUltimoCambio = vehiculo.partes.filter((p) => !p.ultimo_cambio_conocido && p.cambios_registrados === 0).length;
  const dosColumnas = width >= 1000;
  // En dos columnas las cifras van de a dos por fila (la columna es más angosta)
  const anchoCifra = width >= 700 && !dosColumnas ? '22%' : '47%';

  const resumen = (
    <>
      {/* Encabezado: qué vehículo es y cómo está, en una frase */}
      <Tarjeta estilo={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <View style={{ width: 130, height: 86, borderRadius: 14, backgroundColor: c[`${estado.clase}Fondo`], alignItems: 'center', justifyContent: 'center' }}>
          <IlustracionVehiculo tipo={vehiculo.tipo} ancho={112} color={c[estado.clase]} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Fila estilo={{ justifyContent: 'space-between' }}>
            <Placa placa={vehiculo.placa} tipo={vehiculo.tipo} alto={42} />
            <Etiqueta estado={estado} />
          </Fila>
          <Texto variante="suave">{vehiculo.marca} {vehiculo.linea} ({vehiculo.modelo}) · {km(vehiculo.kmCalculo)}{vehiculo.kmEstimado ? ' (aprox.)' : ''}</Texto>
          <Texto estilo={{ fontSize: 14 }}>{EXPLICACION_VEHICULO[vehiculo.estado]}</Texto>
        </View>
        {/* RN-19: qué tan al día está este vehículo */}
        {vehiculo.salud && <AnilloSalud porcentaje={vehiculo.salud.porcentaje} nivel={vehiculo.salud.nivel} tamano={width < 500 ? 70 : 92} />}
      </Tarjeta>

      {/* Acciones principales: las que más se usan */}
      <Fila estilo={{ gap: 10 }}>
        <Accion icono="construct" titulo="Registrar cambio" texto="Cambiaste una parte" principal onPress={() => router.push(`/vehiculo/${id}/servicio`)} />
        <Accion icono="speedometer" titulo="Actualizar km" texto="Lo que marca el tablero" onPress={() => router.push(`/vehiculo/${id}/kilometraje`)} />
        <Accion icono="warning" titulo="Registrar daño" texto="Algo se dañó o falló" onPress={() => router.push(`/vehiculo/${id}/novedad`)} />
        <Accion icono="download" titulo="Hoja de vida" texto="Descargar en PDF" onPress={hojaDeVida} />
      </Fila>

      {/* RN-21: daños o golpes sin arreglar */}
      {vehiculo.novedadesPendientes.map((n) => (
        <Aviso key={n.id} tipo="error"
          accion={<Boton titulo="Ya se arregló" icono="checkmark" pequeno onPress={() => router.push(`/vehiculo/${id}/novedad?novedadId=${n.id}`)} />}>
          Pendiente por arreglar: {n.titulo} (desde el {fecha(n.fecha)}).
        </Aviso>
      ))}

      {vehiculo.kmEstimado && (
        <Aviso tipo="aviso" accion={<Boton titulo="Actualizar km" icono="speedometer" pequeno onPress={() => router.push(`/vehiculo/${id}/kilometraje`)} />}>
          Llevas {vehiculo.diasSinActualizarKm} días sin actualizar el kilometraje. Por tu uso diario, calculamos que va en unos {km(vehiculo.kmCalculo)}.
        </Aviso>
      )}

      {/* RN-05: motos registradas antes de pedir el tipo de moto */}
      {vehiculo.tipo === 'Moto' && !vehiculo.subtipo && (
        <Aviso tipo="info" accion={<Boton titulo="Indicar tipo de moto" icono="create-outline" pequeno onPress={() => router.push(`/vehiculo/${id}/editar`)} />}>
          Cuéntanos si tu moto es de cambios (con cadena) o automática (scooter) para ajustar sus partes.
        </Aviso>
      )}

      {/* RN-16: partes cuyo último cambio no se conoce (y que aún se pueden indicar) */}
      {sinUltimoCambio > 0 && (
        <Aviso tipo="info" accion={<Boton titulo="Indicar cuándo las cambié" icono="calendar" pequeno onPress={() => router.push(`/vehiculo/${id}/ultimos-cambios`)} />}>
          {sinUltimoCambio === 1 ? 'Hay 1 parte' : `Hay ${sinUltimoCambio} partes`} sin fecha de último cambio, así que se cuentan desde la matrícula.
          Indícalas para que los cálculos sean reales.
        </Aviso>
      )}

      <Fila>
        <Cifra icono="speedometer-outline" valor={km(vehiculo.km_actual)} texto="Último km registrado" ancho={anchoCifra} />
        <Cifra icono="trending-up" valor={vehiculo.promedioDiarioKm === null ? '—' : km(vehiculo.promedioDiarioKm)} texto="Recorre por día" tono="azul" ancho={anchoCifra} />
        <Cifra icono="wallet-outline" valor={pesos(vehiculo.costos.mantenimiento)} texto={`Gastado en ${vehiculo.costos.cambios} cambio${vehiculo.costos.cambios === 1 ? '' : 's'}`} ancho={anchoCifra} />
        <Cifra icono="cash-outline" valor={vehiculo.costos.porKm === null ? '—' : pesos(vehiculo.costos.porKm)} texto="Cuesta cada km" tono="azul" ancho={anchoCifra} />
      </Fila>

    </>
  );
  const contenido = (
    <>
      <Segmentos opciones={SECCIONES} valor={seccion} onCambio={setSeccion} />

      {seccion === 'partes' && <Partes vehiculo={vehiculo} />}
      {seccion === 'servicios' && <Servicios vehiculoId={id} />}
      {seccion === 'novedades' && <Novedades vehiculoId={id} />}
      {seccion === 'documentos' && <Documentos vehiculo={vehiculo} />}

      {/* Opciones menos usadas, al final para no confundir */}
      <TituloSeccion titulo="Opciones del vehículo" icono="settings-outline" />
      <Tarjeta estilo={{ gap: 2 }}>
        <ElementoLista icono="create-outline" tono="azul" titulo="Editar datos" detalle="Marca, línea, modelo, placa, foto…" onPress={() => router.push(`/vehiculo/${id}/editar`)} />
        <Separador />
        <ElementoLista icono="add-circle-outline" tono="azul" titulo="Agregar una parte" detalle="Si tu vehículo tiene una parte que no está en la lista" onPress={() => router.push(`/vehiculo/${id}/parte`)} />
        {vehiculo.partes.some((p) => p.cambios_registrados === 0) && (
          <>
            <Separador />
            <ElementoLista icono="calendar-outline" tono="azul" titulo="Indicar el último cambio de las partes" detalle="Cuándo las cambiaste antes de usar AlDía" onPress={() => router.push(`/vehiculo/${id}/ultimos-cambios`)} />
          </>
        )}
        <Separador />
        <ElementoLista icono="swap-horizontal-outline" tono="azul" titulo="Transferir a otro dueño" detalle="Si lo vendes: pasa con todo su historial a la cuenta del comprador" onPress={() => router.push(`/vehiculo/${id}/transferir`)} />
        <Separador />
        <ElementoLista icono="trash-outline" tono="vencida" titulo="Eliminar vehículo" detalle="Borra el vehículo y todo su historial" onPress={eliminar} />
      </Tarjeta>
    </>
  );

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando} ancha>
      <Stack.Screen options={{ title: vehiculo.placa }} />
      {/* Computador: resumen del vehículo a la izquierda y sus partes, historial y documentos a la derecha */}
      {dosColumnas
        ? <Columnas izquierda={resumen} derecha={contenido} proporcion={1} />
        : <View style={{ gap: 14 }}>{resumen}{contenido}</View>}
    </Pantalla>
  );
}

/** Botón grande con ícono y una explicación corta debajo. */
function Accion({ icono, titulo, texto, onPress, principal = false }) {
  const c = useColores();
  const degradado = principal && c.rellenoDegradado;
  const fondo = principal ? (degradado ? 'transparent' : c.primario) : c.superficie;
  const sobre = degradado ? c.sobrePrimario : c.primarioTexto;  // texto sobre el azul
  const color = principal ? sobre : c.texto;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={titulo}
      style={({ pressed }) => ({
        flexBasis: '22%', flexGrow: 1, minWidth: 140, alignSelf: 'stretch', backgroundColor: fondo, borderColor: degradado ? 'transparent' : principal ? c.primario : c.borde, borderWidth: 1, overflow: 'hidden',
        borderRadius: 12, padding: 12, gap: 6, opacity: pressed ? 0.75 : 1,
      })}>
      {degradado && <RellenoPrimario />}
      <Ionicons name={icono} size={24} color={principal ? sobre : c.primario} />
      <Text style={{ color, fontWeight: '700', fontSize: 15 }}>{titulo}</Text>
      <Text style={{ color: principal ? sobre : c.textoSuave, fontSize: 12.5, opacity: principal ? 0.9 : 1 }}>{texto}</Text>
    </Pressable>
  );
}

/** Una parte: nombre, estado, barra y qué hacer con ella. Tocarla abre su detalle (RF-07). */
function FilaParte({ parte: p, vehiculoId }) {
  const conocido = Boolean(p.ultimo_cambio_conocido) || p.cambios_registrados > 0;
  return (
    <Pressable onPress={() => router.push(`/vehiculo/${vehiculoId}/parte?parteId=${p.id}`)} accessibilityRole="button"
      style={({ pressed }) => ({ gap: 6, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
      <Fila estilo={{ justifyContent: 'space-between' }}>
        <Texto variante="negrita" estilo={{ flexShrink: 1 }}>{p.nombre}</Texto>
        <Fila estilo={{ gap: 6 }}>
          {/* Si no se sabe cuándo se cambió, el porcentaje no es real: se muestra "Sin dato" */}
          <Texto variante="pequeno">{conocido ? porcentaje(p.desgaste.porcentaje) : 'Sin dato'}</Texto>
          <Etiqueta estado={ESTADO_PARTE[p.desgaste.estado]} />
        </Fila>
      </Fila>
      <BarraDesgaste porcentaje={p.desgaste.porcentaje} estado={p.desgaste.estado} />
      <Texto variante="pequeno">{queHacerParte(p.desgaste, conocido)}</Texto>
    </Pressable>
  );
}

/** RF-06: partes ordenadas por urgencia y separadas en "necesitan atención" y "en buen estado". */
function Partes({ vehiculo }) {
  const atender = vehiculo.partes.filter((p) => p.desgaste.estado !== 'bien');
  const bien = vehiculo.partes.filter((p) => p.desgaste.estado === 'bien');
  return (
    <View style={{ gap: 12 }}>
      <Aviso tipo="info">
        La barra muestra cuánto se ha gastado cada parte. Se cambia por kilómetros o por tiempo, lo que llegue primero.
        Toca una parte para ver su historial o cambiar cada cuánto se cambia.
      </Aviso>
      {atender.length > 0 && (
        <Tarjeta estilo={{ gap: 0 }}>
          <TituloSeccion titulo={`Necesitan atención (${atender.length})`} icono="alert-circle-outline" />
          {atender.map((p, i) => <View key={p.id}>{i > 0 && <Separador />}<FilaParte parte={p} vehiculoId={vehiculo.id} /></View>)}
          <Boton titulo="Registrar que ya las cambié" icono="construct" tipo="primario" onPress={() => router.push(`/vehiculo/${vehiculo.id}/servicio`)} estilo={{ marginTop: 8 }} />
        </Tarjeta>
      )}
      <Tarjeta estilo={{ gap: 0 }}>
        <TituloSeccion titulo={`En buen estado (${bien.length})`} icono="checkmark-circle-outline" />
        {bien.length === 0 && <Texto variante="suave" estilo={{ paddingVertical: 8 }}>Ninguna parte está en buen estado por ahora.</Texto>}
        {bien.map((p, i) => <View key={p.id}>{i > 0 && <Separador />}<FilaParte parte={p} vehiculoId={vehiculo.id} /></View>)}
      </Tarjeta>
    </View>
  );
}

/** RF-09: historial de servicios. */
function Servicios({ vehiculoId }) {
  const c = useColores();
  const { datos: servicios } = useDatos(`/vehiculos/${vehiculoId}/servicios`);
  if (!servicios) return <Cargando />;
  if (servicios.length === 0) {
    return (
      <Vacio ilustracion={<IlustracionTaller />} titulo="Aún no hay cambios registrados"
        texto="Cada vez que cambies una parte, regístralo aquí. Así AlDía sabe cuándo te toca el próximo cambio."
        boton={<Boton titulo="Registrar un cambio" icono="construct" tipo="primario" onPress={() => router.push(`/vehiculo/${vehiculoId}/servicio`)} />} />
    );
  }
  return servicios.map((s) => (
    <Tarjeta key={s.id}>
      <Fila estilo={{ justifyContent: 'space-between' }}>
        <Fila estilo={{ gap: 6 }}>
          <Ionicons name="calendar-outline" size={16} color={c.textoSuave} />
          <Texto variante="negrita">{fecha(s.fecha)} · {km(s.km)}</Texto>
        </Fila>
        <Texto variante="negrita">{pesos(s.total)}</Texto>
      </Fila>
      {s.lugar && <Texto variante="suave">{s.lugar}</Texto>}
      {/* RF-30: factura del taller */}
      {s.archivo_url && <Boton titulo="Ver factura" icono="receipt-outline" tipo="enlace" pequeno onPress={() => Linking.openURL(urlArchivo(s.archivo_url))} estilo={{ alignSelf: 'flex-start' }} />}
      {s.cambios.map((cambio) => (
        <Fila key={cambio.parte_id} estilo={{ justifyContent: 'space-between' }}>
          <Texto estilo={{ flexShrink: 1 }}>• {cambio.parte}{cambio.marca_referencia ? ` (${cambio.marca_referencia})` : ''}</Texto>
          <Texto variante="suave">{pesos(cambio.costo)}</Texto>
        </Fila>
      ))}
    </Tarjeta>
  ));
}

/** RF-28: daños del vehículo (daños, fallas y golpes), pendientes primero. En el código: novedades. */
function Novedades({ vehiculoId }) {
  const { datos: novedades, cargar } = useDatos(`/vehiculos/${vehiculoId}/novedades`);
  if (!novedades) return <Cargando />;

  async function eliminar(n) {
    if (!(await confirmar('Eliminar daño', `¿Eliminar "${n.titulo}" del historial?`, 'Eliminar'))) return;
    await api(`/novedades/${n.id}`, { metodo: 'DELETE' });
    cargar();
  }

  return (
    <View style={{ gap: 12 }}>
      <Boton titulo="Registrar un daño" icono="add-circle-outline" tipo="primario" onPress={() => router.push(`/vehiculo/${vehiculoId}/novedad`)} />
      {novedades.length === 0 && (
        <Vacio icono="shield-checkmark-outline" titulo="Sin daños"
          texto="Si algo se daña, falla o tienes un golpe, regístralo aquí para no olvidar arreglarlo y que quede en la hoja de vida." />
      )}
      {novedades.map((n) => {
        const pendiente = n.estado === 'pendiente';
        return (
          <Tarjeta key={n.id} estilo={{ gap: 6 }}>
            <Fila estilo={{ justifyContent: 'space-between' }}>
              <Texto variante="negrita" estilo={{ flexShrink: 1 }}>{n.titulo}</Texto>
              <Etiqueta estado={pendiente ? { texto: 'Pendiente', clase: 'vencida' } : { texto: 'Arreglado', clase: 'bien' }} />
            </Fila>
            <Texto variante="pequeno">{TIPO_NOVEDAD[n.tipo]} · {fecha(n.fecha)} · {km(n.km)}</Texto>
            {pendiente && Boolean(n.impide_circular) && <Etiqueta estado={{ texto: 'No deja usar el vehículo', clase: 'vencida' }} />}
            {n.descripcion && <Texto>{n.descripcion}</Texto>}
            {n.foto_url && <Image source={{ uri: urlArchivo(n.foto_url) }} style={{ width: '100%', height: 180, borderRadius: 8 }} resizeMode="cover" accessibilityLabel={`Foto de ${n.titulo}`} />}
            {!pendiente && (
              <Texto variante="suave">Arreglado el {fecha(n.arreglada_en)}{n.lugar ? ` en ${n.lugar}` : ''} · {pesos(n.costo)}</Texto>
            )}
            <Fila estilo={{ gap: 8 }}>
              {pendiente && <Boton titulo="Ya se arregló" icono="checkmark" pequeno tipo="primario" onPress={() => router.push(`/vehiculo/${vehiculoId}/novedad?novedadId=${n.id}`)} />}
              <Boton titulo="Editar" icono="create-outline" pequeno onPress={() => router.push(`/vehiculo/${vehiculoId}/novedad?editarId=${n.id}`)} />
              <Boton titulo="Eliminar" icono="trash-outline" pequeno tipo="peligro" onPress={() => eliminar(n)} />
            </Fila>
          </Tarjeta>
        );
      })}
    </View>
  );
}

/** RF-12: SOAT, revisión técnico-mecánica e impuesto. */
function Documentos({ vehiculo }) {
  return (
    <Tarjeta estilo={{ gap: 2 }}>
      {['soat', 'rtm', 'impuesto'].map((tipo, i) => {
        const doc = vehiculo.documentos.find((d) => d.tipo === tipo);
        // RN-22: moto de hasta 125 cc sin impuesto registrado
        if (tipo === 'impuesto' && !doc && vehiculo.exentoImpuesto) {
          return (
            <View key={tipo}>
              {i > 0 && <Separador />}
              <ElementoLista icono="checkmark-circle-outline" tono="bien" titulo={NOMBRE_DOCUMENTO[tipo]}
                detalle={`No lo paga: las motos de hasta 125 cc están exentas (Ley 488 de 1998). Cilindraje: ${vehiculo.cilindraje} cc`}
                derecha={<Etiqueta estado={{ texto: 'Exenta', clase: 'bien' }} />} />
            </View>
          );
        }
        const estado = doc ? ESTADO_DOCUMENTO[doc.estado] : null;
        return (
          <View key={tipo}>
            {i > 0 && <Separador />}
            <ElementoLista
              icono={doc ? 'document-text' : 'document-outline'}
              tono={estado ? estado.clase : 'neutro'}
              titulo={NOMBRE_DOCUMENTO[tipo]}
              detalle={doc ? `Vence el ${fecha(doc.fecha_vencimiento)} · Toca para renovarlo o ver su historial` : 'No lo has registrado · Toca para agregarlo'}
              derecha={estado ? <Etiqueta estado={estado} /> : <Etiqueta estado={{ texto: 'Sin registrar', clase: 'proxima' }} />}
              onPress={() => router.push(`/vehiculo/${vehiculo.id}/documento?tipo=${tipo}`)}
            />
          </View>
        );
      })}
    </Tarjeta>
  );
}
