// Estructura común de "Iniciar sesión", "Crear cuenta" y "Recuperar contraseña":
// la barra superior pública y, en el centro, una tarjeta con el título y el formulario.
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useColores } from '../tema';
import EncabezadoPublico from './EncabezadoPublico';

/**
 * @param titulo     título grande de la tarjeta
 * @param subtitulo  texto corto debajo del título
 * @param ocultar    botón de la barra superior que no se muestra ('login' | 'registro')
 * @param pie        contenido debajo de la tarjeta (ej.: "¿No tienes cuenta? Crea una")
 */
export default function PantallaAutenticacion({ titulo, subtitulo, ocultar, pie, children }) {
  const c = useColores();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <EncabezadoPublico ocultar={ocultar} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingVertical: 36 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 16 }}>
          <View style={{ backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 16, padding: 24, gap: 16 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: c.texto }}>{titulo}</Text>
              {subtitulo && <Text style={{ fontSize: 15, color: c.textoSuave }}>{subtitulo}</Text>}
            </View>
            {children}
          </View>
          {pie}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
