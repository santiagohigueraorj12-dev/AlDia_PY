// RF-02: recuperar la contraseña en dos pasos: pedir el código y luego usarlo.
import { useState } from 'react';
import { Text } from 'react-native';
import { Link, router } from 'expo-router';
import { api } from '../api/cliente';
import { useErrores } from '../api/useErrores';
import { Aviso, Boton, Campo, CampoPassword } from '../components/ui';
import PantallaAutenticacion from '../components/PantallaAutenticacion';
import { useColores } from '../tema';

export default function Recuperar() {
  const c = useColores();
  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();

  async function pedirCodigo() {
    reiniciar();
    try {
      const r = await api('/auth/recuperar', { metodo: 'POST', datos: { correo: correo.trim() } });
      // Sin servidor de correo, en desarrollo el backend devuelve el código para poder probar
      if (r.tokenDesarrollo) setToken(r.tokenDesarrollo);
      setMensaje(r.tokenDesarrollo ? 'Modo desarrollo: el código ya quedó escrito abajo (también aparece en la consola del backend).' : r.mensaje);
      setPaso(2);
    } catch (e) {
      mostrar(e);
    }
  }

  async function cambiarPassword() {
    reiniciar();
    try {
      const r = await api('/auth/restablecer', { metodo: 'POST', datos: { token: token.trim(), password } });
      setMensaje(r.mensaje);
      setPaso(3);
    } catch (e) {
      mostrar(e);
    }
  }

  const subtitulos = {
    1: 'Escribe el correo de tu cuenta y te enviaremos un código.',
    2: 'Escribe el código que recibiste y tu nueva contraseña.',
    3: 'Listo. Ya puedes iniciar sesión con tu nueva contraseña.',
  };

  return (
    <PantallaAutenticacion
      titulo="Recuperar contraseña"
      subtitulo={subtitulos[paso]}
      pie={(
        <Text style={{ textAlign: 'center', fontSize: 15 }}>
          <Link href="/login" style={{ color: c.primario, fontWeight: '700' }}>Volver a iniciar sesión</Link>
        </Text>
      )}
    >
      <Aviso>{general}</Aviso>
      <Aviso tipo="ok">{mensaje}</Aviso>
      {paso === 1 && (
        <>
          <Campo etiqueta="Correo de tu cuenta" placeholder="nombre@correo.com" value={correo} keyboardType="email-address"
            autoCapitalize="none" error={errores.correo} onChangeText={(t) => { setCorreo(t); limpiar('correo'); }} />
          <Boton titulo="Enviar código" tipo="primario" onPress={pedirCodigo} />
        </>
      )}
      {paso === 2 && (
        <>
          <Campo etiqueta="Código de recuperación" value={token} autoCapitalize="none" error={errores.token}
            onChangeText={(t) => { setToken(t); limpiar('token'); }} />
          <CampoPassword etiqueta="Nueva contraseña" ayuda="Mínimo 8 caracteres." value={password} error={errores.password}
            onChangeText={(t) => { setPassword(t); limpiar('password'); }} />
          <Boton titulo="Cambiar contraseña" tipo="primario" onPress={cambiarPassword} />
        </>
      )}
      {paso === 3 && <Boton titulo="Iniciar sesión" tipo="primario" onPress={() => router.replace('/login')} />}
    </PantallaAutenticacion>
  );
}
