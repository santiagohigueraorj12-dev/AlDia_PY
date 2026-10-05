// RF-15: calendario mensual con los cambios de partes estimados y los vencimientos.
// En el celular se muestra como una lista agrupada por día (más fácil de leer que una cuadrícula).
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useDatos } from '../../api/useDatos';
import { Aviso, Boton, Cargando, Etiqueta, Fila, Pantalla, Tarjeta, Texto } from '../../components/ui';
import { useColores } from '../../tema';
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

export default function Calendario() {
  const c = useColores();
  const hoy = hoyISO();
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const { datos: eventos, error, refrescar, refrescando } = useDatos(`/panel/calendario?mes=${mes}`);

  // Agrupa los eventos por fecha: { '2026-10-05': [evento, evento], ... }
  const porDia = {};
  for (const e of eventos || []) (porDia[e.fecha] ||= []).push(e);

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      <Fila estilo={{ justifyContent: 'space-between' }}>
        <Boton titulo="‹" onPress={() => setMes(moverMes(mes, -1))} />
        <Pressable onPress={() => setMes(hoy.slice(0, 7))}>
          <Texto variante="subtitulo">{nombreMes(mes)}</Texto>
        </Pressable>
        <Boton titulo="›" onPress={() => setMes(moverMes(mes, 1))} />
      </Fila>
      <Texto variante="pequeno" estilo={{ textAlign: 'center' }}>🔧 Cambios de partes estimados · 📄 Vencimientos de documentos</Texto>

      <Aviso>{error}</Aviso>
      {!eventos ? <Cargando /> : Object.keys(porDia).length === 0 ? (
        <Tarjeta><Texto variante="suave" estilo={{ textAlign: 'center' }}>No hay eventos este mes.</Texto></Tarjeta>
      ) : (
        Object.entries(porDia).map(([dia, lista]) => (
          <View key={dia} style={{ gap: 6 }}>
            <Texto variante="negrita" estilo={{ color: dia === hoy ? c.primario : c.texto, textTransform: 'capitalize' }}>
              {nombreDia(dia)}{dia === hoy ? ' · Hoy' : ''}
            </Texto>
            {lista.map((e, i) => (
              <Pressable key={i} onPress={() => router.push(`/vehiculo/${e.vehiculoId}`)}>
                <Tarjeta>
                  <Fila estilo={{ justifyContent: 'space-between' }}>
                    <Texto estilo={{ flexShrink: 1 }}>{e.tipo === 'parte' ? '🔧 Cambio de ' : '📄 '}{e.titulo}</Texto>
                    <Etiqueta estado={e.tipo === 'parte' ? ESTADO_PARTE[e.estado] : ESTADO_DOCUMENTO[e.estado]} />
                  </Fila>
                  <Texto variante="pequeno">{e.placa}</Texto>
                </Tarjeta>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </Pantalla>
  );
}
