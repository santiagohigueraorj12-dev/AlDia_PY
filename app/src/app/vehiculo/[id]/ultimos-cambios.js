// RN-16: "¿Cuándo cambiaste cada parte?"
// Aparece justo después de registrar un vehículo, y también se abre desde una
// parte para corregir su último cambio.
//   ?nuevo=1      -> viene del registro: al terminar va al detalle del vehículo
//   ?parteId=5    -> solo muestra esa parte
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../api/cliente';
import { useErrores } from '../../../api/useErrores';
import { Aviso, Boton, Cargando, Pantalla, Separador, Tarjeta, Texto } from '../../../components/ui';
import CamposUltimoCambio from '../../../components/CamposUltimoCambio';
import { volver } from '../../../utils/navegacion';
import { fecha } from '../../../utils/formato';

export default function UltimosCambios() {
  const { id, nuevo, parteId } = useLocalSearchParams();
  const [vehiculo, setVehiculo] = useState(null);
  const [respuestas, setRespuestas] = useState({});  // { [parteId]: { sabe, km, fecha } }
  const [error, setError] = useState('');  // error al cargar
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api(`/vehiculos/${id}`).then((v) => {
      setVehiculo(v);
      // Se parte de lo que ya está guardado: si el último cambio es conocido, se muestran sus datos
      const iniciales = {};
      for (const p of v.partes) {
        iniciales[p.id] = p.ultimo_cambio_conocido
          ? { sabe: true, km: String(p.ultimo_cambio_km), fecha: p.ultimo_cambio_fecha }
          : { sabe: false, km: '', fecha: '' };
      }
      setRespuestas(iniciales);
    }).catch((e) => setError(e.message));
  }, [id]);

  // Al terminar: si viene del registro, al detalle del vehículo; si no, atrás
  const terminar = () => (nuevo ? router.replace(`/vehiculo/${id}`) : volver(`/vehiculo/${id}`));

  if (!vehiculo) return error ? <Pantalla><Aviso>{error}</Aviso></Pantalla> : <Cargando />;

  // Solo se pueden indicar partes que aún no tienen cambios registrados en la app
  const partes = vehiculo.partes
    .filter((p) => p.cambios_registrados === 0)
    .filter((p) => !parteId || p.id === Number(parteId));

  async function guardar() {
    reiniciar();
    setEnviando(true);
    try {
      await api(`/vehiculos/${id}/ultimos-cambios`, {
        metodo: 'PUT',
        datos: {
          partes: partes.map((p) => {
            const r = respuestas[p.id];
            return r.sabe
              ? { parte_id: p.id, km: r.km, fecha: r.fecha || undefined }
              : { parte_id: p.id, desconocido: true };
          }),
        },
      });
      terminar();
    } catch (e) {
      mostrar(e);
      setEnviando(false);
    }
  }


  return (
    <Pantalla>
      <Tarjeta>
        <Texto variante="subtitulo">¿Cuándo cambiaste {parteId ? 'esta parte' : 'cada parte'}?</Texto>
        <Texto variante="suave">
          Si sabes en qué kilometraje y fecha se cambió por última vez, indícalo para que el desgaste sea real.
          Si no lo sabes, se cuenta desde la matrícula ({fecha(vehiculo.fecha_matricula)}): en un vehículo
          usado saldrá para revisar, que es lo más seguro.
        </Texto>
      </Tarjeta>

      <Aviso>{error}</Aviso>

      <Tarjeta>
        {partes.length === 0 && <Texto variante="suave">Todas las partes ya tienen cambios registrados en la app.</Texto>}
        {partes.map((p, i) => (
          <View key={p.id} style={{ gap: 8 }}>
            {i > 0 && <Separador />}
            <Texto variante="negrita">{p.nombre}</Texto>
            <CamposUltimoCambio
              valor={respuestas[p.id]}
              onCambio={(r) => { setRespuestas({ ...respuestas, [p.id]: r }); limpiar(`partes.${i}.km`); limpiar(`partes.${i}.fecha`); }}
              kmActual={vehiculo.km_actual}
              fechaMatricula={vehiculo.fecha_matricula}
              errores={{ km: errores[`partes.${i}.km`], fecha: errores[`partes.${i}.fecha`] }}
            />
          </View>
        ))}
      </Tarjeta>

      <Aviso>{general}</Aviso>
      <Boton titulo={enviando ? 'Guardando…' : 'Guardar'} tipo="primario" onPress={guardar} deshabilitado={enviando || partes.length === 0} />
      {nuevo && <Boton titulo="Ahora no (lo haré después)" tipo="enlace" onPress={terminar} />}
    </Pantalla>
  );
}
