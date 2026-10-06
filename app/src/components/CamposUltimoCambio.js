// RN-16: campos para indicar cuándo fue el último cambio de una parte.
// "No lo sé" -> el desgaste se cuenta desde la matrícula.
// "Lo sé"    -> se piden el kilometraje y la fecha de ese cambio.
//
// valor = { sabe: boolean, km: string, fecha: 'AAAA-MM-DD' }
import { View } from 'react-native';
import { Boton, Campo, Fila } from './ui';
import CampoFecha from './CampoFecha';
import { hoyISO } from '../utils/formato';

export default function CamposUltimoCambio({ valor, onCambio, kmActual, fechaMatricula }) {
  const cambiar = (campo) => (nuevo) => onCambio({ ...valor, [campo]: nuevo });

  return (
    <View style={{ gap: 8 }}>
      <Fila>
        <Boton titulo="No lo sé" tipo={valor.sabe ? 'normal' : 'primario'} onPress={() => onCambio({ ...valor, sabe: false })} />
        <Boton titulo="Sí, lo sé" tipo={valor.sabe ? 'primario' : 'normal'} onPress={() => onCambio({ ...valor, sabe: true })} />
      </Fila>
      {valor.sabe && (
        <Fila estilo={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="A los (km)" value={valor.km} onChangeText={cambiar('km')} keyboardType="number-pad"
              ayuda={`Máximo ${Number(kmActual).toLocaleString('es-CO')}`} />
          </View>
          <View style={{ flex: 1 }}>
            <CampoFecha etiqueta="El día" valor={valor.fecha} onCambio={cambiar('fecha')} minima={fechaMatricula} maxima={hoyISO()} />
          </View>
        </Fila>
      )}
    </View>
  );
}
