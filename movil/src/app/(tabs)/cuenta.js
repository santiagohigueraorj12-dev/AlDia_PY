// RF-03: datos personales, contraseña, cerrar sesión y eliminar la cuenta (RNF-09).
import { useState } from 'react';
import { api } from '../../api/cliente';
import { useSesion } from '../../context/SesionContext';
import { Aviso, Boton, Campo, Pantalla, Tarjeta, Texto } from '../../components/ui';
import { confirmar } from '../../utils/dialogos';

export default function Cuenta() {
  const { usuario, setUsuario, cerrarSesion } = useSesion();
  return (
    <Pantalla>
      <Texto variante="suave">{usuario.correo}</Texto>
      <DatosPersonales usuario={usuario} onGuardado={setUsuario} />
      <CambiarPassword />
      <Boton titulo="Cerrar sesión" onPress={cerrarSesion} />
      <EliminarCuenta onEliminada={cerrarSesion} />
    </Pantalla>
  );
}

function DatosPersonales({ usuario, onGuardado }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [telefono, setTelefono] = useState(usuario.telefono || '');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function guardar() {
    setMensaje(''); setError('');
    try {
      onGuardado(await api('/auth/perfil', { metodo: 'PUT', datos: { nombre, telefono } }));
      setMensaje('Datos actualizados');
    } catch (e) { setError(e.message); }
  }

  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Texto variante="subtitulo">Datos personales</Texto>
      <Aviso>{error}</Aviso>
      <Aviso tipo="ok">{mensaje}</Aviso>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} />
      <Campo etiqueta="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
      <Boton titulo="Guardar" tipo="primario" onPress={guardar} />
    </Tarjeta>
  );
}

function CambiarPassword() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function guardar() {
    setMensaje(''); setError('');
    try {
      const r = await api('/auth/password', { metodo: 'PUT', datos: { actual, nueva } });
      setMensaje(r.mensaje);
      setActual(''); setNueva('');
    } catch (e) { setError(e.message); }
  }

  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Texto variante="subtitulo">Cambiar contraseña</Texto>
      <Aviso>{error}</Aviso>
      <Aviso tipo="ok">{mensaje}</Aviso>
      <Campo etiqueta="Contraseña actual" value={actual} onChangeText={setActual} secureTextEntry />
      <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 8 caracteres" value={nueva} onChangeText={setNueva} secureTextEntry />
      <Boton titulo="Cambiar" tipo="primario" onPress={guardar} deshabilitado={!actual || nueva.length < 8} />
    </Tarjeta>
  );
}

function EliminarCuenta({ onEliminada }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function eliminar() {
    if (!(await confirmar('Eliminar cuenta', 'Se borrarán tu cuenta, tus vehículos y todo su historial. Esta acción no se puede deshacer.', 'Eliminar'))) return;
    try {
      await api('/auth/cuenta', { metodo: 'DELETE', datos: { password } });
      onEliminada();
    } catch (e) { setError(e.message); }
  }

  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Texto variante="subtitulo">Eliminar mi cuenta</Texto>
      <Texto variante="suave">Ley 1581 de 2012: puedes eliminar tu cuenta y todos tus datos en cualquier momento.</Texto>
      <Aviso>{error}</Aviso>
      <Campo etiqueta="Confirma con tu contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      <Boton titulo="Eliminar cuenta" tipo="peligro" onPress={eliminar} deshabilitado={!password} />
    </Tarjeta>
  );
}
