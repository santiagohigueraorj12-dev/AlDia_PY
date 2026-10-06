// RF-02: inicio de sesión.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Link } from 'expo-router';
import { useSesion } from '../context/SesionContext';
import { Aviso, Boton, Campo, Pantalla, Tarjeta, Texto } from '../components/ui';
import { useColores } from '../tema';

export default function Login() {
  const { iniciarSesion } = useSesion();
  const c = useColores();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), password);
      // No hace falta navegar: al haber usuario, el layout muestra las pestañas
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla>
        <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 10, gap: 6 }}>
          <Texto estilo={{ fontSize: 40, fontWeight: '800', color: c.primario }}>AlDía</Texto>
          <Texto variante="suave" estilo={{ textAlign: 'center' }}>Que no se te pase ningún cambio de tu vehículo.</Texto>
        </View>
        <Tarjeta estilo={{ gap: 14 }}>
          <Aviso>{error}</Aviso>
          <Campo etiqueta="Correo" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Campo etiqueta="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={entrar} />
          <Boton titulo={enviando ? 'Ingresando…' : 'Iniciar sesión'} tipo="primario" onPress={entrar} deshabilitado={enviando || !correo || !password} />
        </Tarjeta>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Link href="/recuperar"><Texto estilo={{ color: c.primario }}>¿Olvidaste tu contraseña?</Texto></Link>
          <Link href="/registro"><Texto estilo={{ color: c.primario }}>¿No tienes cuenta? Regístrate</Texto></Link>
        </View>
      </Pantalla>
    </KeyboardAvoidingView>
  );
}
