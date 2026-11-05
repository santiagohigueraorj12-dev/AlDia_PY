// RF-16: notificaciones dentro de la app.
// Las que no se han leído se ven resaltadas; tocar una la marca como leída y abre el vehículo.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../api/cliente';
import { useDatos } from '../../api/useDatos';
import { Aviso, Boton, Cargando, ElementoLista, Pantalla, Separador, Tarjeta, Texto, TituloSeccion, Vacio } from '../../components/ui';
import { fecha } from '../../utils/formato';

const ICONOS = { parte: 'construct', documento: 'document-text', kilometraje: 'speedometer' };
const POR_PAGINA = 8;  // se muestran de a 8 para que la lista no sea eterna

export default function Notificaciones() {
  const { datos, error, cargar, refrescar, refrescando } = useDatos('/notificaciones');
  const [cuantas, setCuantas] = useState(POR_PAGINA);

  async function abrir(n) {
    if (!n.leida) await api(`/notificaciones/${n.id}/leer`, { metodo: 'POST' });
    if (n.enlace) router.push(n.enlace);  // ej.: /vehiculo/5
    else cargar();
  }

  async function leerTodas() {
    await api('/notificaciones/leer-todas', { metodo: 'POST' });
    cargar();
  }

  if (error) return <Pantalla><Aviso>{error}</Aviso></Pantalla>;
  if (!datos) return <Cargando />;

  if (datos.notificaciones.length === 0) {
    return (
      <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
        <Vacio icono="notifications-outline" titulo="No tienes alertas"
          texto="Aquí te avisaremos cuando una parte esté por cambiarse, un documento esté por vencer o debas actualizar el kilometraje." />
      </Pantalla>
    );
  }

  // Primero las nuevas y después las leídas; solo se muestran las primeras "cuantas"
  const visibles = [...datos.notificaciones.filter((n) => !n.leida), ...datos.notificaciones.filter((n) => n.leida)].slice(0, cuantas);
  const totalNuevas = datos.notificaciones.filter((n) => !n.leida).length;
  const nuevas = visibles.filter((n) => !n.leida);
  const leidas = visibles.filter((n) => n.leida);
  const faltan = datos.notificaciones.length - visibles.length;

  const lista = (items) => items.map((n, i) => (
    <View key={n.id}>
      {i > 0 && <Separador />}
      <ElementoLista
        icono={ICONOS[n.tipo] || 'notifications'}
        tono={n.leida ? 'neutro' : 'primario'}
        titulo={n.titulo}
        detalle={n.mensaje}
        resaltado={!n.leida}
        onPress={() => abrir(n)}
      >
        <Texto variante="pequeno">{fecha(n.creado_en)}</Texto>
      </ElementoLista>
    </View>
  ));

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      <Texto variante="suave">Toca una alerta para ir al vehículo. Al tocarla se marca como leída.</Texto>

      {nuevas.length > 0 && (
        <>
          <TituloSeccion titulo={`Nuevas (${totalNuevas})`} icono="notifications"
            accion={<Boton titulo="Marcar todas como leídas" icono="checkmark-done" tipo="enlace" onPress={leerTodas} />} />
          <Tarjeta estilo={{ gap: 4 }}>{lista(nuevas)}</Tarjeta>
        </>
      )}

      {leidas.length > 0 && (
        <>
          <TituloSeccion titulo="Leídas" icono="mail-open-outline" />
          <Tarjeta estilo={{ gap: 2 }}>{lista(leidas)}</Tarjeta>
        </>
      )}

      {faltan > 0 && (
        <Boton titulo={`Ver ${Math.min(faltan, POR_PAGINA)} más (quedan ${faltan})`} icono="chevron-down" onPress={() => setCuantas(cuantas + POR_PAGINA)} />
      )}
    </Pantalla>
  );
}
