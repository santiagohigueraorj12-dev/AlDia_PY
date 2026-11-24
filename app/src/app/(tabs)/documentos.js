// Resumen de SOAT, RTM e impuesto organizado por vehículo.
import { router } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { useDatos } from '../../api/useDatos';
import { Aviso, Boton, Cargando, ElementoLista, Etiqueta, Pantalla, Separador, Tarjeta, Texto, Vacio } from '../../components/ui';
import { ESTADO_DOCUMENTO, fecha } from '../../utils/formato';
import { armarDocumentacion } from '../../utils/documentacion';

const ESTADO_FALTANTE = { texto: 'Faltante', clase: 'vencida' };

export default function Documentos() {
  const ancho = useWindowDimensions().width;
  const { datos: vehiculos, error, refrescar, refrescando } = useDatos('/vehiculos');

  if (error) return <Pantalla><Aviso>{error}</Aviso></Pantalla>;
  if (!vehiculos) return <Cargando />;

  if (vehiculos.length === 0) {
    return (
      <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
        <Vacio icono="document-text-outline" titulo="Aún no tienes vehículos"
          texto="Registra un vehículo para llevar aquí el estado de su SOAT, revisión técnico-mecánica e impuesto."
          boton={<Boton titulo="Registrar vehículo" icono="add-circle-outline" tipo="primario" onPress={() => router.push('/vehiculo/nuevo')} />} />
      </Pantalla>
    );
  }

  const fichas = armarDocumentacion(vehiculos);
  // En el computador las fichas van en rejilla: 2 por fila (3 en pantallas grandes)
  const porFila = ancho >= 1450 ? 3 : ancho >= 1000 ? 2 : 1;
  const anchoFicha = porFila === 1 ? '100%' : porFila === 2 ? '48%' : '31%';
  const vencidos = fichas.reduce((total, v) => total + v.vencidos, 0);
  const faltantes = fichas.reduce((total, v) => total + v.faltantes, 0);
  const porVencer = fichas.reduce((total, v) => total + v.porVencer, 0);

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando} ancha>
      <Texto variante="suave">Documentos organizados por vehículo. Toca uno para registrarlo o actualizar su vencimiento.</Texto>

      {(vencidos > 0 || faltantes > 0) && (
        <Aviso>
          {[
            vencidos > 0 ? `${vencidos} vencido${vencidos === 1 ? '' : 's'}` : null,
            faltantes > 0 ? `${faltantes} faltante${faltantes === 1 ? '' : 's'}` : null,
          ].filter(Boolean).join(' y ')}. Revisa estos documentos lo antes posible.
        </Aviso>
      )}
      {porVencer > 0 && (
        <Aviso tipo="aviso">
          {porVencer} documento{porVencer === 1 ? '' : 's'} próximo{porVencer === 1 ? '' : 's'} a vencer. Puedes renovarlo antes de la fecha límite.
        </Aviso>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      {fichas.map((vehiculo) => (
        <Tarjeta key={vehiculo.id} estilo={{ gap: 8, flexBasis: anchoFicha, flexGrow: 1 }}>
          <ElementoLista
            icono={vehiculo.tipo === 'Moto' ? 'bicycle' : 'car-sport'}
            tono={vehiculo.estadoDocumentacion.clase}
            titulo={vehiculo.placa}
            detalle={`${vehiculo.tipo} · ${vehiculo.marca} ${vehiculo.linea} (${vehiculo.modelo})`}
            derecha={<Etiqueta estado={vehiculo.estadoDocumentacion} />}
          />
          <Separador />
          {vehiculo.exentoImpuesto && !vehiculo.documentos.some((d) => d.tipo === 'impuesto') && (
            <Texto variante="pequeno">Impuesto vehicular: no lo paga (moto de {vehiculo.cilindraje} cc, exenta por la Ley 488 de 1998).</Texto>
          )}
          {vehiculo.documentos.map((doc, indice) => {
            const estado = doc.estado === 'faltante' ? ESTADO_FALTANTE : ESTADO_DOCUMENTO[doc.estado];
            const detalle = doc.estado === 'faltante'
              ? 'No está registrado · Toca para agregarlo'
              : `${doc.estado === 'vencido' ? 'Venció' : 'Vence'} el ${fecha(doc.fecha_vencimiento)} · Toca para ver o renovar`;
            return (
              <View key={doc.tipo}>
                {indice > 0 && <Separador />}
                <ElementoLista
                  icono="document-text-outline"
                  tono={estado.clase}
                  titulo={doc.nombre}
                  detalle={detalle}
                  derecha={<Etiqueta estado={estado} />}
                  onPress={() => router.push(`/vehiculo/${vehiculo.id}/documento?tipo=${doc.tipo}`)}
                />
              </View>
            );
          })}
        </Tarjeta>
      ))}
      </View>
    </Pantalla>
  );
}
