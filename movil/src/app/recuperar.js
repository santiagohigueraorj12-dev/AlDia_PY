// RF-02: recuperar la contraseña en dos pasos: pedir el código y luego usarlo.
import { useState } from 'react';
import { router } from 'expo-router';
import { api } from '../api/cliente';
import { Aviso, Boton, Campo, Pantalla, Tarjeta } from '../components/ui';

export default function Recuperar() {
  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function pedirCodigo() {
    setError('');
    try {
      const r = await api('/auth/recuperar', { metodo: 'POST', datos: { correo: correo.trim() } });
      // Sin servidor de correo, en desarrollo el backend devuelve el código para poder probar
      if (r.tokenDesarrollo) setToken(r.tokenDesarrollo);
      setMensaje(r.tokenDesarrollo ? 'Modo desarrollo: el código ya quedó escrito abajo (también aparece en la consola del backend).' : r.mensaje);
      setPaso(2);
    } catch (e) {
      setError(e.message);
    }
  }

  async function cambiarPassword() {
    setError('');
    try {
      const r = await api('/auth/restablecer', { metodo: 'POST', datos: { token: token.trim(), password } });
      setMensaje(r.mensaje);
      setPaso(3);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Pantalla>
      <Tarjeta estilo={{ gap: 14 }}>
        <Aviso>{error}</Aviso>
        <Aviso tipo="ok">{mensaje}</Aviso>
        {paso === 1 && (
          <>
            <Campo etiqueta="Correo de tu cuenta" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
            <Boton titulo="Enviar código" tipo="primario" onPress={pedirCodigo} deshabilitado={!correo} />
          </>
        )}
        {paso === 2 && (
          <>
            <Campo etiqueta="Código de recuperación" value={token} onChangeText={setToken} autoCapitalize="none" />
            <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 8 caracteres" value={password} onChangeText={setPassword} secureTextEntry />
            <Boton titulo="Cambiar contraseña" tipo="primario" onPress={cambiarPassword} deshabilitado={!token || password.length < 8} />
          </>
        )}
        {paso === 3 && <Boton titulo="Volver a iniciar sesión" tipo="primario" onPress={() => router.back()} />}
      </Tarjeta>
    </Pantalla>
  );
}
