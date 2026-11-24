// RF-28: panel de daños de todos los vehículos (CRUD).
//   Crear: "Registrar un daño" (eligiendo el vehículo)   Consultar: esta lista, con filtro
//   Editar: botón "Editar" y "Ya se arregló"             Eliminar: botón "Eliminar"
// Un daño pendiente pone su vehículo en "Requiere atención" (RN-21).
import { useState } from 'react';
import { Image, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { api, urlArchivo } from '../../api/cliente';
import { useDatos } from '../../api/useDatos';
import {
  Aviso, Boton, Cargando, Cifra, Etiqueta, Fila, Pantalla, Segmentos, Tarjeta, Texto, TituloSeccion, Vacio,
} from '../../components/ui';
import Selector from '../../components/Selector';
import Placa from '../../components/Placa';
import { confirmar } from '../../utils/dialogos';
import { TIPO_NOVEDAD, fecha, km, pesos } from '../../utils/formato';

const FILTROS = [
  { id: 'pendiente', titulo: 'Pendientes', icono: 'alert-circle-outline' },
  { id: 'arreglada', titulo: 'Arreglados', icono: 'checkmark-circle-outline' },
  { id: 'todos', titulo: 'Todos', icono: 'list-outline' },
];

export default function Danos() {
  const { datos: danos, error, cargar, refrescar, refrescando } = useDatos('/novedades');
  const { datos: vehiculos } = useDatos('/vehiculos');
  const [filtro, setFiltro] = useState('pendiente');
  const [vehiculo, setVehiculo] = useState(null);
  const ancho = useWindowDimensions().width;
  const anchoCifra = ancho < 640 || ancho >= 1000 ? '100%' : '31%';  // una debajo de otra en el celular y al lado del formulario en el computador
  const porFila = ancho >= 1450 ? 3 : ancho >= 1000 ? 2 : 1;  // daños en rejilla en el computador
  const anchoDano = porFila === 1 ? '100%' : porFila === 2 ? '48%' : '31%';

  if (error) return <Pantalla><Aviso>{error}</Aviso></Pantalla>;
  if (!danos || !vehiculos) return <Cargando />;

  const pendientes = danos.filter((d) => d.estado === 'pendiente');
  const arreglados = danos.filter((d) => d.estado === 'arreglada');
  const gastado = arreglados.reduce((s, d) => s + Number(d.costo || 0), 0);
  const lista = filtro === 'todos' ? danos : danos.filter((d) => d.estado === filtro);
  // Con un solo vehículo no hace falta elegirlo
  const elegido = vehiculos.length === 1 ? vehiculos[0].id : vehiculo;

  async function eliminar(d) {
    if (!(await confirmar('Eliminar daño', `¿Eliminar "${d.titulo}" de ${d.placa}?`, 'Eliminar'))) return;
    await api(`/novedades/${d.id}`, { metodo: 'DELETE' });
    cargar();
  }

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando} ancha>
      {/* Computador: registrar a la izquierda y las cifras a la derecha; celular: una debajo de otra */}
      <View style={{ flexDirection: ancho >= 1000 ? 'row' : 'column', gap: 16, alignItems: 'stretch' }}>
        <View style={{ flex: ancho >= 1000 ? 1.6 : undefined }}>

          {/* Crear */}
      <Tarjeta estilo={{ gap: 10 }}>
        <TituloSeccion titulo="Registrar un daño" icono="add-circle-outline" />
        <Texto variante="suave">Un pinchazo, un bombillo fundido, la batería que no prende o un golpe: anótalo para no olvidar arreglarlo.</Texto>
        {vehiculos.length === 0 ? (
          <Aviso tipo="info" accion={<Boton titulo="Registrar vehículo" icono="add" pequeno onPress={() => router.push('/vehiculo/nuevo')} />}>
            Primero registra un vehículo.
          </Aviso>
        ) : (
          <>
            {vehiculos.length > 1 && (
              <Selector etiqueta="¿De qué vehículo?" opciones={vehiculos.map((v) => ({ valor: v.id, texto: `${v.placa} · ${v.marca} ${v.linea}` }))}
                valor={vehiculo} onCambio={setVehiculo} placeholder="Elegir el vehículo…" />
            )}
            <Boton titulo="Registrar daño" icono="warning" tipo="primario" deshabilitado={!elegido}
              onPress={() => router.push(`/vehiculo/${elegido}/novedad`)} />
          </>
        )}
      </Tarjeta>

        </View>
        <View style={{ flex: ancho >= 1000 ? 1 : undefined, gap: 12 }}>
      <Fila estilo={{ height: ancho >= 1000 ? '100%' : undefined }}>
        <Cifra icono="alert-circle-outline" valor={String(pendientes.length)} texto="Pendientes por arreglar" ancho={anchoCifra} tono="vencida" />
        <Cifra icono="checkmark-circle-outline" valor={String(arreglados.length)} texto="Arreglados" ancho={anchoCifra} tono="bien" />
        <Cifra icono="wallet-outline" valor={pesos(gastado)} texto="Gastado en arreglos" ancho={anchoCifra} />
      </Fila>
        </View>
      </View>

      {/* Consultar, editar y eliminar */}
      <Segmentos opciones={FILTROS} valor={filtro} onCambio={setFiltro} />
      {lista.length === 0 && (
        <Vacio icono="shield-checkmark-outline"
          titulo={filtro === 'pendiente' ? 'Nada pendiente' : 'Sin daños registrados'}
          texto={filtro === 'pendiente' ? 'No tienes daños sin arreglar. ¡Bien!' : 'Cuando registres un daño aparecerá aquí.'} />
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      {lista.map((d) => {
        const pendiente = d.estado === 'pendiente';
        return (
          <Tarjeta key={d.id} estilo={{ gap: 8, flexBasis: anchoDano, flexGrow: porFila === 1 ? 1 : 0 }}>
            <Fila estilo={{ justifyContent: 'space-between' }}>
              <Fila estilo={{ gap: 10, flexShrink: 1 }}>
                <Placa placa={d.placa} tipo={d.tipo_vehiculo} alto={30} />
                <Texto variante="negrita" estilo={{ flexShrink: 1 }}>{d.titulo}</Texto>
              </Fila>
              <Etiqueta estado={pendiente ? { texto: 'Pendiente', clase: 'vencida' } : { texto: 'Arreglado', clase: 'bien' }} />
            </Fila>
            <Texto variante="pequeno">{TIPO_NOVEDAD[d.tipo]} · {fecha(d.fecha)} · {km(d.km)}</Texto>
            {d.descripcion && <Texto>{d.descripcion}</Texto>}
            {d.foto_url && <Image source={{ uri: urlArchivo(d.foto_url) }} style={{ width: '100%', height: 180, borderRadius: 8 }} resizeMode="cover" accessibilityLabel={`Foto de ${d.titulo}`} />}
            {!pendiente && (
              <Texto variante="suave">Arreglado el {fecha(d.arreglada_en)}{d.lugar ? ` en ${d.lugar}` : ''} · {pesos(d.costo)}</Texto>
            )}
            <Fila estilo={{ gap: 8 }}>
              {pendiente && <Boton titulo="Ya se arregló" icono="checkmark" pequeno tipo="primario" onPress={() => router.push(`/vehiculo/${d.vehiculo_id}/novedad?novedadId=${d.id}`)} />}
              <Boton titulo="Editar" icono="create-outline" pequeno onPress={() => router.push(`/vehiculo/${d.vehiculo_id}/novedad?editarId=${d.id}`)} />
              <Boton titulo="Eliminar" icono="trash-outline" pequeno tipo="peligro" onPress={() => eliminar(d)} />
            </Fila>
          </Tarjeta>
        );
      })}
      </View>
    </Pantalla>
  );
}
