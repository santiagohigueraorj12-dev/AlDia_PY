// RF-26: gráfica de gastos de los últimos 12 meses (pestaña Inicio).
//  - Barras por mes: naranja = cambios de partes, gris pizarra = documentos (SOAT, técnico-mecánica, impuesto).
//  - Al tocar un mes se ve su detalle.
//  - Abajo, en qué se va la plata: categorías de la que más gastó a la que menos.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useDatos } from '../api/useDatos';
import { useColores } from '../tema';
import { pesos } from '../utils/formato';
import { useProgreso } from './Animaciones';
import { Tarjeta, Texto, TituloSeccion } from './ui';

const ALTO = 130;

export default function GraficaGastos() {
  const c = useColores();
  const { datos } = useDatos('/panel/gastos');
  const [elegido, setElegido] = useState(null);
  const crecer = useProgreso(datos ? 1 : 0, 700);  // las barras crecen desde abajo

  if (!datos) return null;
  const { meses, porCategoria, total, mesMayor } = datos;
  const maximo = Math.max(...meses.map((m) => m.total), 1);
  const mes = elegido ? meses.find((m) => m.mes === elegido) : null;

  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <TituloSeccion titulo="Gastos del último año" icono="bar-chart" />
      <View>
        <Text style={{ color: c.texto, fontSize: 26, fontWeight: '800' }}>{pesos(total)}</Text>
        <Texto variante="suave">
          {total === 0
            ? 'Cuando registres cambios o pagues documentos, aquí verás en qué se va tu plata.'
            : `Tu mes más costoso fue ${nombreMes(mesMayor.mes)} con ${pesos(mesMayor.total)}.`}
        </Texto>
      </View>

      {total > 0 && (
        <>
          {/* Barras */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: ALTO + 22, gap: 4 }} accessibilityLabel="Gráfica de gastos por mes">
            {meses.map((m) => {
              const activo = m.mes === elegido;
              const altoPartes = (m.partes / maximo) * ALTO * crecer;
              const altoDocs = (m.documentos / maximo) * ALTO * crecer;
              return (
                <Pressable key={m.mes} onPress={() => setElegido(activo ? null : m.mes)} style={{ flex: 1, alignItems: 'center', gap: 4 }}
                  accessibilityRole="button" accessibilityLabel={`${nombreMes(m.mes)}: ${pesos(m.total)}`}>
                  <View style={{ width: '100%', maxWidth: 26, height: ALTO, justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden',
                    backgroundColor: activo ? c.primarioSuave : 'transparent' }}>
                    {m.documentos > 0 && <View style={{ height: altoDocs, backgroundColor: c.secundario }} />}
                    {m.partes > 0 && <View style={{ height: altoPartes, backgroundColor: c.primario }} />}
                  </View>
                  <Text style={{ fontSize: 10.5, color: activo ? c.primario : c.textoSuave, fontWeight: activo ? '800' : '500' }}>{m.etiqueta}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Leyenda o detalle del mes tocado */}
          {mes ? (
            <View style={{ backgroundColor: c.primarioSuave, borderRadius: 10, padding: 10 }}>
              <Text style={{ color: c.texto, fontWeight: '700' }}>{nombreMes(mes.mes)}: {pesos(mes.total)}</Text>
              <Texto variante="pequeno">Cambios de partes {pesos(mes.partes)} · Documentos {pesos(mes.documentos)}</Texto>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
              <Leyenda color={c.primario} texto="Cambios de partes" />
              <Leyenda color={c.secundario} texto="Documentos" />
              <Texto variante="pequeno">Toca un mes para ver el detalle.</Texto>
            </View>
          )}

          {/* En qué se va la plata */}
          <View style={{ gap: 8, marginTop: 4 }}>
            <Texto variante="negrita">¿En qué se va la plata?</Texto>
            {porCategoria.map((cat) => (
              <View key={cat.nombre} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Texto estilo={{ fontSize: 14 }}>{cat.nombre}</Texto>
                  <Texto estilo={{ fontSize: 14, fontWeight: '700' }}>{pesos(cat.total)} · {Math.round((cat.total / total) * 100)} %</Texto>
                </View>
                <View style={{ height: 8, backgroundColor: c.superficie2, borderRadius: 99, overflow: 'hidden' }}>
                  <View style={{ width: `${(cat.total / porCategoria[0].total) * 100 * crecer}%`, height: '100%', borderRadius: 99, backgroundColor: c.primario }} />
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </Tarjeta>
  );
}

function Leyenda({ color, texto }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Texto variante="pequeno">{texto}</Texto>
    </View>
  );
}

const NOMBRES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** '2026-11' -> 'noviembre de 2026' */
function nombreMes(clave) {
  return `${NOMBRES[Number(clave.slice(5, 7)) - 1]} de ${clave.slice(0, 4)}`;
}
