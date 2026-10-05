// Detalle de un vehículo: estado, costos y secciones de partes, servicios y documentos.
// Las acciones (registrar cambio, km, parte, documento) abren otras pantallas.
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { api, descargarYCompartir } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import { Aviso, BarraDesgaste, Boton, Cargando, Cifra, Etiqueta, Fila, Pantalla, Separador, Tarjeta, Texto } from '../../../components/ui';
import { avisar, confirmar } from '../../../utils/dialogos';
import { ESTADO_DOCUMENTO, ESTADO_PARTE, ESTADO_VEHICULO, NOMBRE_DOCUMENTO, fecha, km, pesos, porcentaje } from '../../../utils/formato';

const SECCIONES = [
  { id: 'partes', titulo: 'Partes' },
  { id: 'servicios', titulo: 'Servicios' },
  { id: 'documentos', titulo: 'Documentos' },
];

export default function DetalleVehiculo() {
  const { id } = useLocalSearchParams();
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
    router.back();
  }

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      <Stack.Screen options={{ title: vehiculo.placa }} />

      <View style={{ gap: 6 }}>
        <Etiqueta estado={ESTADO_VEHICULO[vehiculo.estado]} />
        <Texto variante="suave">{vehiculo.tipo} · {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}</Texto>
        <Texto variante="pequeno">Matrícula {fecha(vehiculo.fecha_matricula)}</Texto>
      </View>

      <Boton titulo="🔧 Registrar cambio" tipo="primario" onPress={() => router.push(`/vehiculo/${id}/servicio`)} />
      <Fila>
        <Boton titulo="Kilometraje" onPress={() => router.push(`/vehiculo/${id}/kilometraje`)} />
        <Boton titulo="📄 Hoja de vida" onPress={hojaDeVida} />
        <Boton titulo="Editar" onPress={() => router.push(`/vehiculo/${id}/editar`)} />
      </Fila>

      {vehiculo.kmEstimado && (
        <Aviso tipo="aviso">
          Llevas {vehiculo.diasSinActualizarKm} días sin actualizar el kilometraje. Según tu uso diario lo estimamos en {km(vehiculo.kmCalculo)}. Toca “Kilometraje” para actualizarlo.
        </Aviso>
      )}

      <Fila>
        <Cifra valor={km(vehiculo.km_actual)} texto="Kilometraje registrado" />
        <Cifra valor={vehiculo.promedioDiarioKm === null ? '—' : km(vehiculo.promedioDiarioKm)} texto="Promedio por día" />
        <Cifra valor={pesos(vehiculo.costos.mantenimiento)} texto={`Mantenimiento (${vehiculo.costos.cambios} cambios)`} />
        <Cifra valor={vehiculo.costos.porKm === null ? '—' : pesos(vehiculo.costos.porKm)} texto="Costo por kilómetro" />
      </Fila>

      <Fila>
        {SECCIONES.map((s) => (
          <Boton key={s.id} titulo={s.titulo} tipo={seccion === s.id ? 'primario' : 'normal'} onPress={() => setSeccion(s.id)} />
        ))}
      </Fila>

      {seccion === 'partes' && <Partes vehiculo={vehiculo} />}
      {seccion === 'servicios' && <Servicios vehiculoId={id} />}
      {seccion === 'documentos' && <Documentos vehiculo={vehiculo} />}

      <Boton titulo="Eliminar vehículo" tipo="peligro" onPress={eliminar} estilo={{ marginTop: 20 }} />
    </Pantalla>
  );
}

/** Texto corto que explica cuánto falta para el cambio. */
function cuantoFalta(d) {
  if (d.estado === 'vencida') return 'Cambio vencido';
  return `Faltan ${d.kmRestantes !== null ? `${km(d.kmRestantes)} o ` : ''}${d.diasRestantes} días`;
}

/** RF-06: partes ordenadas de la más a la menos urgente. Tocar una abre su detalle (RF-07). */
function Partes({ vehiculo }) {
  return (
    <Tarjeta>
      <Texto variante="pequeno">Cada parte se cambia por km o por tiempo, lo que llegue primero. Toca una parte para ver su historial o ajustarla.</Texto>
      {vehiculo.partes.map((p) => (
        <Pressable key={p.id} onPress={() => router.push(`/vehiculo/${vehiculo.id}/parte?parteId=${p.id}`)} style={{ gap: 6 }}>
          <Separador />
          <Fila estilo={{ justifyContent: 'space-between' }}>
            <Texto variante="negrita" estilo={{ flexShrink: 1 }}>{p.nombre}</Texto>
            <Etiqueta estado={ESTADO_PARTE[p.desgaste.estado]} />
          </Fila>
          <BarraDesgaste porcentaje={p.desgaste.porcentaje} estado={p.desgaste.estado} />
          <Texto variante="pequeno">
            {porcentaje(p.desgaste.porcentaje)} (por {p.desgaste.motivo === 'km' ? 'kilómetros' : 'tiempo'}) · {cuantoFalta(p.desgaste)}
          </Texto>
        </Pressable>
      ))}
      <Separador />
      <Boton titulo="+ Agregar parte" tipo="enlace" onPress={() => router.push(`/vehiculo/${vehiculo.id}/parte`)} />
    </Tarjeta>
  );
}

/** RF-09: historial de servicios. */
function Servicios({ vehiculoId }) {
  const { datos: servicios } = useDatos(`/vehiculos/${vehiculoId}/servicios`);
  if (!servicios) return <Cargando />;
  if (servicios.length === 0) {
    return <Tarjeta><Texto variante="suave">Aún no hay servicios registrados. Usa “Registrar cambio” cuando cambies una parte.</Texto></Tarjeta>;
  }
  return servicios.map((s) => (
    <Tarjeta key={s.id}>
      <Fila estilo={{ justifyContent: 'space-between' }}>
        <Texto variante="negrita">{fecha(s.fecha)} · {km(s.km)}</Texto>
        <Texto variante="negrita">{pesos(s.total)}</Texto>
      </Fila>
      {s.lugar && <Texto variante="suave">{s.lugar}</Texto>}
      {s.cambios.map((c) => (
        <Fila key={c.parte_id} estilo={{ justifyContent: 'space-between' }}>
          <Texto estilo={{ flexShrink: 1 }}>• {c.parte}{c.marca_referencia ? ` (${c.marca_referencia})` : ''}</Texto>
          <Texto variante="suave">{pesos(c.costo)}</Texto>
        </Fila>
      ))}
    </Tarjeta>
  ));
}

/** RF-12: SOAT, revisión técnico-mecánica e impuesto. */
function Documentos({ vehiculo }) {
  return ['soat', 'rtm', 'impuesto'].map((tipo) => {
    const doc = vehiculo.documentos.find((d) => d.tipo === tipo);
    return (
      <Pressable key={tipo} onPress={() => router.push(`/vehiculo/${vehiculo.id}/documento?tipo=${tipo}`)}>
        <Tarjeta>
          <Fila estilo={{ justifyContent: 'space-between' }}>
            <Texto variante="negrita">{NOMBRE_DOCUMENTO[tipo]}</Texto>
            {doc ? <Etiqueta estado={ESTADO_DOCUMENTO[doc.estado]} /> : <Texto variante="suave">Sin registrar</Texto>}
          </Fila>
          {doc
            ? <Texto variante="suave">Vence el {fecha(doc.fecha_vencimiento)} · Toca para renovar</Texto>
            : <Texto variante="suave">Toca para registrarlo</Texto>}
        </Tarjeta>
      </Pressable>
    );
  });
}
