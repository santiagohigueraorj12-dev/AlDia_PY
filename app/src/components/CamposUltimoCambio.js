// RN-16: campos para indicar cuándo fue el último cambio de una parte.
// "No lo sé"              -> se cuenta desde la matrícula y se pide revisarla.
// "Nunca se ha cambiado"  -> también desde la matrícula, pero es un dato seguro:
//                            el desgaste es real y no se pide revisarla.
// "Sí, lo sé"             -> se piden el kilometraje y la fecha de ese cambio.
//
// valor = { sabe: boolean, nunca: boolean, km: string, fecha: 'AAAA-MM-DD' }
import { View } from 'react-native';
import { Campo, Fila, Segmentos } from './ui';
import CampoFecha from './CampoFecha';
import { hoyISO } from '../utils/formato';

export default function CamposUltimoCambio({ valor, onCambio, kmActual, fechaMatricula, errores = {} }) {
  const cambiar = (campo) => (nuevo) => onCambio({ ...valor, [campo]: nuevo });

  return (
    <View style={{ gap: 8 }}>
      {/* Tres opciones en una sola fila (selector segmentado) */}
      <Segmentos
        opciones={[
          { id: 'no', titulo: 'No lo sé' },
          { id: 'nunca', titulo: 'Nunca se cambió' },
          { id: 'si', titulo: 'Sí, lo sé' },
        ]}
        valor={valor.sabe ? 'si' : valor.nunca ? 'nunca' : 'no'}
        onCambio={(op) => onCambio({ ...valor, sabe: op === 'si', nunca: op === 'nunca' })}
      />
      {valor.sabe && (
        <Fila estilo={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="A los (km)" obligatorio placeholder="Ej.: 28.500" value={valor.km} onChangeText={cambiar('km')} keyboardType="number-pad"
              ayuda={`Máximo ${Number(kmActual).toLocaleString('es-CO')}`} error={errores.km} />
          </View>
          <View style={{ flex: 1 }}>
            <CampoFecha etiqueta="El día" obligatorio valor={valor.fecha} onCambio={cambiar('fecha')} minima={fechaMatricula} maxima={hoyISO()}
              error={errores.fecha} />
          </View>
        </Fila>
      )}
    </View>
  );
}
