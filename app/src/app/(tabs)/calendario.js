// RF-15: calendario mensual con los cambios de partes estimados y los vencimientos.
// Se muestra como una lista agrupada por día (más fácil de leer que una cuadrícula).
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDatos } from '../../api/useDatos';
import { Aviso, Boton, Cargando, ElementoLista, Etiqueta, Fila, Pantalla, Separador, Tarjeta, Texto, Vacio } from '../../components/ui';
import { useColores } from '../../tema';
import { Degradado } from '../../components/Decoracion';
import { ESTADO_DOCUMENTO, ESTADO_PARTE, hoyISO, nombreMes } from '../../utils/formato';

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Suma meses a 'AAAA-MM'. */
function moverMes(anioMes, n) {
  const [a, m] = anioMes.split('-').map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** '2026-10-05' -> 'lunes 5' */
function nombreDia(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return `${DIAS_SEMANA[new Date(a, m - 1, d).getDay()]} ${d}`;
}

/** Flecha para cambiar de mes. */
function Flecha({ icono, etiqueta, onPress }) {
  const c = useColores();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={etiqueta}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: c.superficie, borderWidth: 1, borderColor: c.borde, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <Ionicons name={icono} size={22} color={c.primario} />
    </Pressable>
  );
}

export default function Calendario() {
  const c = useColores();
  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7);
  const [mes, setMes] = useState(mesActual);
  const { datos: eventos, error, refrescar, refrescando } = useDatos(`/panel/calendario?mes=${mes}`);

  // Agrupa los eventos por fecha: { '2026-10-05': [evento, evento], ... }
  const porDia = {};
  for (const e of eventos || []) (porDia[e.fecha] ||= []).push(e);
  const cambios = (eventos || []).filter((e) => e.tipo === 'parte').length;
  const revisiones = (eventos || []).filter((e) => e.tipo === 'revision').length;
  const vencimientos = (eventos || []).length - cambios - revisiones;

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      {/* Mes en una franja de color, con flechas para cambiarlo */}
      <Degradado circulos estilo={{ borderRadius: 20, boxShadow: `0 8px 20px ${c.sombra}` }}>
      <Fila estilo={{ justifyContent: 'space-between', flexWrap: 'nowrap', padding: 14 }}>
        <Flecha icono="chevron-back" etiqueta="Mes anterior" onPress={() => setMes(moverMes(mes, -1))} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Ionicons name="calendar" size={22} color={c.primario} />
          <Texto variante="subtitulo" estilo={{ color: c.sobreDegradado, fontSize: 19 }}>{nombreMes(mes)}</Texto>
          {mes !== mesActual
            ? <Boton titulo="Volver a este mes" pequeno onPress={() => setMes(mesActual)} estilo={{ marginTop: 4 }} />
            : <Texto variante="pequeno" estilo={{ color: c.sobreDegradadoSuave }}>Este mes</Texto>}
        </View>
        <Flecha icono="chevron-forward" etiqueta="Mes siguiente" onPress={() => setMes(moverMes(mes, 1))} />
      </Fila>
      </Degradado>

      {eventos && eventos.length > 0 && (
        <Aviso tipo="info">
          Este mes: {cambios} cambio{cambios === 1 ? '' : 's'} de partes{revisiones > 0 ? `, ${revisiones} revisi${revisiones === 1 ? 'ón' : 'ones'}` : ''} y {vencimientos} vencimiento{vencimientos === 1 ? '' : 's'} de documentos.
          Toca uno para ir al vehículo.
        </Aviso>
      )}

      <Aviso>{error}</Aviso>
      {!eventos ? <Cargando /> : Object.keys(porDia).length === 0 ? (
        <Vacio icono="calendar-outline" titulo="Nada para este mes"
          texto="No hay cambios de partes ni documentos que venzan en este mes. Usa las flechas para ver otros meses." />
      ) : (
        Object.entries(porDia).map(([dia, lista]) => (
          <View key={dia} style={{ gap: 6 }}>
            <Fila estilo={{ gap: 6 }}>
              <Ionicons name={dia === hoy ? 'today' : 'calendar-clear-outline'} size={17} color={dia === hoy ? c.primario : c.textoSuave} />
              <Texto variante="negrita" estilo={{ color: dia === hoy ? c.primario : c.texto, textTransform: 'capitalize' }}>
                {nombreDia(dia)}{dia === hoy ? ' · Hoy' : ''}
              </Texto>
            </Fila>
            <Tarjeta estilo={{ gap: 2, paddingVertical: 6 }}>
              {lista.map((e, i) => {
                const esParte = e.tipo === 'parte' || e.tipo === 'revision';
                const estado = esParte ? ESTADO_PARTE[e.estado] : ESTADO_DOCUMENTO[e.estado];
                // RN-20: revisión elegida por el usuario (no es un cambio)
                const revision = e.tipo === 'revision';
                return (
                  <View key={i}>
                    {i > 0 && <Separador />}
                    <ElementoLista
                      icono={revision ? 'search' : esParte ? 'construct' : 'document-text'}
                      tono={revision && e.estado === 'bien' ? 'azul' : estado.clase}
                      titulo={revision ? e.titulo : esParte ? `Cambio de ${e.titulo.toLowerCase()}` : e.titulo}
                      detalle={revision ? `${e.placa} · revisión que elegiste` : e.placa}
                      onPress={() => router.push(revision ? `/vehiculo/${e.vehiculoId}/parte?parteId=${e.parteId}` : `/vehiculo/${e.vehiculoId}`)}
                    >
                      <Etiqueta estado={revision && e.estado === 'bien' ? { texto: 'Revisión', clase: 'azul' } : estado} />
                    </ElementoLista>
                  </View>
                );
              })}
            </Tarjeta>
          </View>
        ))
      )}
    </Pantalla>
  );
}
