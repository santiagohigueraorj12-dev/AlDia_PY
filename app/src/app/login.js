// RF-02: inicio de sesión.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useSesion } from '../context/SesionContext';
import { useErrores } from '../api/useErrores';
import { Aviso, Boton, Campo, CampoPassword } from '../components/ui';
import PantallaAutenticacion from '../components/PantallaAutenticacion';
import { useColores } from '../tema';

export default function Login() {
  const { iniciarSesion } = useSesion();
  const c = useColores();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    reiniciar();
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), password);
      // No hace falta navegar: al haber usuario, la navegación muestra el panel
    } catch (e) {
      mostrar(e);
      setEnviando(false);
    }
  }

  return (
    <PantallaAutenticacion
      titulo="Iniciar sesión"
      subtitulo="Qué bueno verte de nuevo."
      ocultar="login"
      pie={(
        <Text style={{ textAlign: 'center', color: c.textoSuave, fontSize: 15 }}>
          ¿No tienes cuenta? <Link href="/registro" style={{ color: c.primario, fontWeight: '700' }}>Crea una gratis</Link>
        </Text>
      )}
    >
      <Aviso>{general}</Aviso>
      <Campo etiqueta="Correo" placeholder="nombre@correo.com" value={correo} keyboardType="email-address"
        autoCapitalize="none" autoComplete="email" error={errores.correo}
        onChangeText={(t) => { setCorreo(t); limpiar('correo'); }} />
      <View style={{ gap: 6 }}>
        <CampoPassword etiqueta="Contraseña" value={password} autoComplete="password" error={errores.password}
          onChangeText={(t) => { setPassword(t); limpiar('password'); }} onSubmitEditing={entrar} />
        <Link href="/recuperar" style={{ color: c.primario, fontSize: 14, alignSelf: 'flex-end' }}>¿Olvidaste tu contraseña?</Link>
      </View>
      <Boton titulo={enviando ? 'Ingresando…' : 'Iniciar sesión'} tipo="primario" onPress={entrar} deshabilitado={enviando} />
    </PantallaAutenticacion>
  );
}
