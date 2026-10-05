// RF-16: notificaciones dentro de la app.
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../api/cliente';
import { useDatos } from '../../api/useDatos';
import { Aviso, Boton, Cargando, Pantalla, Separador, Tarjeta, Texto } from '../../components/ui';
import { useColores } from '../../tema';
import { fecha } from '../../utils/formato';

const ICONOS = { parte: '🔧', documento: '📄', kilometraje: '📍' };

export default function Notificaciones() {
  const c = useColores();
  const { datos, error, cargar, refrescar, refrescando } = useDatos('/notificaciones');

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

  return (
    <Pantalla onRefrescar={refrescar} refrescando={refrescando}>
      {datos.noLeidas > 0 && <Boton titulo={`Marcar todas como leídas (${datos.noLeidas})`} onPress={leerTodas} />}
      <Tarjeta>
        {datos.notificaciones.length === 0 && <Texto variante="suave">No tienes notificaciones.</Texto>}
        {datos.notificaciones.map((n, i) => (
          <View key={n.id}>
            {i > 0 && <Separador />}
            <Pressable onPress={() => abrir(n)} style={{ flexDirection: 'row', gap: 10, paddingVertical: 6 }}>
              <Texto>{ICONOS[n.tipo]}</Texto>
              <View style={{ flex: 1, gap: 2 }}>
                <Texto variante={n.leida ? 'normal' : 'negrita'}>{n.titulo}</Texto>
                <Texto variante="suave">{n.mensaje}</Texto>
                <Texto variante="pequeno">{fecha(n.creado_en)}</Texto>
              </View>
              {!n.leida && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.vencida, marginTop: 6 }} accessibilityLabel="Sin leer" />}
            </Pressable>
          </View>
        ))}
      </Tarjeta>
    </Pantalla>
  );
}
