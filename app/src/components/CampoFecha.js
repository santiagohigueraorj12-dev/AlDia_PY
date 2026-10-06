// Campo para elegir una fecha.
//  - En el celular abre el calendario nativo (Android o iOS).
//  - En el computador usa el selector de fecha del navegador.
// Recibe y devuelve la fecha como texto 'AAAA-MM-DD' (igual que la API).
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useColores } from '../tema';
import { fecha as formatoFecha } from '../utils/formato';

/** 'AAAA-MM-DD' -> Date (hora local) */
function aDate(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Date -> 'AAAA-MM-DD' */
function aTexto(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function CampoFecha({ etiqueta, valor, onCambio, minima, maxima }) {
  const c = useColores();
  const [mostrarIos, setMostrarIos] = useState(false);
  const actual = valor ? aDate(valor) : new Date();
  const limites = {
    minimumDate: minima ? aDate(minima) : undefined,
    maximumDate: maxima ? aDate(maxima) : undefined,
  };

  function abrir() {
    if (Platform.OS === 'android') {
      // En Android el calendario se abre como un diálogo
      DateTimePickerAndroid.open({
        value: actual,
        mode: 'date',
        ...limites,
        onChange: (evento, fechaElegida) => {
          if (evento.type === 'set' && fechaElegida) onCambio(aTexto(fechaElegida));
        },
      });
    } else {
      setMostrarIos(!mostrarIos);
    }
  }

  const estiloCaja = { borderWidth: 1, borderColor: c.borde, borderRadius: 10, padding: 11, backgroundColor: c.superficie };

  if (Platform.OS === 'web') {
    // En el navegador se dibuja un <input type="date"> normal de HTML
    return (
      <View style={{ gap: 4 }}>
        {etiqueta && <Text style={{ color: c.texto, fontWeight: '600', fontSize: 14 }}>{etiqueta}</Text>}
        <input
          type="date"
          value={valor || ''}
          min={minima}
          max={maxima}
          onChange={(e) => onCambio(e.target.value)}
          aria-label={etiqueta}
          style={{
            border: `1px solid ${c.borde}`, borderRadius: 10, padding: 10, fontSize: 15,
            fontFamily: 'inherit', color: c.texto, backgroundColor: c.superficie, colorScheme: c.esOscuro ? 'dark' : 'light',
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 4 }}>
      {etiqueta && <Text style={{ color: c.texto, fontWeight: '600', fontSize: 14 }}>{etiqueta}</Text>}
      <Pressable onPress={abrir} style={estiloCaja} accessibilityRole="button">
        <Text style={{ color: valor ? c.texto : c.textoSuave, fontSize: 15 }}>{valor ? formatoFecha(valor) : 'Elegir fecha'}</Text>
      </Pressable>
      {mostrarIos && (
        <DateTimePicker
          value={actual}
          mode="date"
          display="inline"
          {...limites}
          onChange={(evento, fechaElegida) => {
            if (fechaElegida) onCambio(aTexto(fechaElegida));
            setMostrarIos(false);
          }}
        />
      )}
    </View>
  );
}
