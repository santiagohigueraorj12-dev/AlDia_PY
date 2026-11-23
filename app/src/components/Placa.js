// Placa colombiana dibujada: fondo amarillo, borde negro y letras negras.
//  - Carro: una línea "ABC 123".
//  - Moto: dos líneas, "ABC" arriba y "12D" abajo, en una placa más cuadrada.
// Abajo dice "COLOMBIA", como las placas reales.
import { Text, View } from 'react-native';

const AMARILLO = '#ffd31a';
const NEGRO = '#111111';

/** ¿Es una placa de moto? Por el tipo de vehículo o por el formato ABC12D. */
function esMoto(placa, tipo) {
  if (tipo) return String(tipo).toLowerCase() === 'moto';
  return /^[A-Z]{3}\d{2}[A-Z]$/.test(placa);
}

/**
 * @param placa  ej.: 'ABC123' o 'ABC12D'
 * @param tipo   'Moto' | 'Carro' (opcional)
 * @param alto   alto de la placa en px
 */
export default function Placa({ placa, tipo, alto: altoPedido = 34 }) {
  const texto = String(placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const moto = esMoto(texto, tipo);
  // La de moto tiene dos líneas: se hace más alta para que las letras se lean igual de grandes
  const alto = moto ? altoPedido * 1.3 : altoPedido;
  const borde = Math.max(1.5, alto * 0.05);
  const pie = (
    <Text style={{ color: NEGRO, fontSize: Math.max(6, alto * (moto ? 0.12 : 0.17)), fontWeight: '700', letterSpacing: 1, lineHeight: Math.max(7, alto * (moto ? 0.14 : 0.2)) }}>
      COLOMBIA
    </Text>
  );

  return (
    <View
      accessibilityLabel={`Placa ${texto}`}
      style={{
        backgroundColor: AMARILLO, borderColor: NEGRO, borderWidth: borde, borderRadius: alto * 0.14,
        height: alto, minWidth: moto ? alto * 1.35 : alto * 2.6, paddingHorizontal: alto * 0.14,
        alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      }}
    >
      {moto ? (
        <>
          <Text style={{ color: NEGRO, fontWeight: '900', fontSize: alto * 0.33, lineHeight: alto * 0.35, letterSpacing: 1 }}>{texto.slice(0, 3)}</Text>
          <Text style={{ color: NEGRO, fontWeight: '900', fontSize: alto * 0.33, lineHeight: alto * 0.35, letterSpacing: 1 }}>{texto.slice(3)}</Text>
        </>
      ) : (
        <Text style={{ color: NEGRO, fontWeight: '900', fontSize: alto * 0.5, lineHeight: alto * 0.56, letterSpacing: 1.5 }}>
          {texto.slice(0, 3)} {texto.slice(3)}
        </Text>
      )}
      {pie}
    </View>
  );
}
