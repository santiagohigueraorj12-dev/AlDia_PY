// Estructura común de "Iniciar sesión", "Crear cuenta" y "Recuperar contraseña":
// la barra superior pública y una tarjeta con el título y el formulario.
// En el computador, a la izquierda va una ilustración con lo que hace AlDía.
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColores } from '../tema';
import EncabezadoPublico from './EncabezadoPublico';
import { EscenaCarretera } from './Ilustraciones';
import Escena3D from './Escena3D';
import { Burbujas, FondoDecorado } from './Decoracion';

const BENEFICIOS = ['Te avisa cuándo cambiar cada parte', 'Te recuerda el SOAT y la técnico-mecánica', 'Sabes cuánto gastas en tu vehículo'];

/**
 * @param titulo     título grande de la tarjeta
 * @param subtitulo  texto corto debajo del título
 * @param ocultar    botón de la barra superior que no se muestra ('login' | 'registro')
 * @param pie        contenido debajo de la tarjeta (ej.: "¿No tienes cuenta? Crea una")
 */
export default function PantallaAutenticacion({ titulo, subtitulo, ocultar, pie, children }) {
  const c = useColores();
  const ancha = useWindowDimensions().width >= 900;

  const formulario = (
    <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 16 }}>
      {!ancha && <View style={{ width: '70%', maxWidth: 300, alignSelf: 'center' }}><EscenaCarretera /></View>}
      <View style={{ backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 20, padding: 24, gap: 16, boxShadow: `0 12px 30px ${c.sombra}` }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: c.texto }}>{titulo}</Text>
          {subtitulo && <Text style={{ fontSize: 15, color: c.textoSuave }}>{subtitulo}</Text>}
        </View>
        {children}
      </View>
      {pie}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <EncabezadoPublico ocultar={ocultar} />
      <View style={{ flex: 1, overflow: 'hidden' }}>
      <FondoDecorado />
      <Burbujas variante={2} escala={ancha ? 1.3 : 0.6} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingVertical: ancha ? 48 : 24, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        {ancha ? (
          <View style={{ flexDirection: 'row', gap: 48, alignItems: 'center', width: '100%', maxWidth: 1060, alignSelf: 'center' }}>
            {/* Lado izquierdo: escena 3D y beneficios */}
            <View style={{ flex: 1, gap: 18 }}>
              <Escena3D tamano={200} />
              <Text style={{ fontSize: 26, fontWeight: '800', color: c.texto }}>Tu moto y tu carro, siempre al día.</Text>
              {BENEFICIOS.map((texto) => (
                <View key={texto} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={22} color={c.bien} />
                  <Text style={{ fontSize: 16, color: c.texto }}>{texto}</Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1 }}>{formulario}</View>
          </View>
        ) : formulario}
      </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
