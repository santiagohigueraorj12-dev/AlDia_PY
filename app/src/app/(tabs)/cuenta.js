// RF-03: datos personales, contraseña, cerrar sesión y eliminar la cuenta (RNF-09).
import { useState } from 'react';
import { api } from '../../api/cliente';
import { useErrores } from '../../api/useErrores';
import { useSesion } from '../../context/SesionContext';
import { Aviso, Boton, Campo, CampoPassword, Pantalla, Tarjeta, Texto } from '../../components/ui';
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
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();

  async function guardar() {
    setMensaje('');
    reiniciar();
    try {
      onGuardado(await api('/auth/perfil', { metodo: 'PUT', datos: { nombre, telefono } }));
      setMensaje('Datos actualizados');
    } catch (e) { mostrar(e); }
  }

  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Texto variante="subtitulo">Datos personales</Texto>
      <Aviso>{general}</Aviso>
      <Aviso tipo="ok">{mensaje}</Aviso>
      <Campo etiqueta="Nombre" obligatorio value={nombre} error={errores.nombre}
        onChangeText={(t) => { setNombre(t); limpiar('nombre'); }} />
      <Campo etiqueta="Teléfono" placeholder="Ej.: 3001234567" value={telefono} keyboardType="phone-pad"
        error={errores.telefono} onChangeText={(t) => { setTelefono(t); limpiar('telefono'); }} />
      <Boton titulo="Guardar" tipo="primario" onPress={guardar} />
    </Tarjeta>
  );
}

function CambiarPassword() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();

  async function guardar() {
    setMensaje('');
    reiniciar();
    try {
      const r = await api('/auth/password', { metodo: 'PUT', datos: { actual, nueva } });
      setMensaje(r.mensaje);
      setActual(''); setNueva('');
    } catch (e) { mostrar(e); }
  }

  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Texto variante="subtitulo">Cambiar contraseña</Texto>
      <Aviso>{general}</Aviso>
      <Aviso tipo="ok">{mensaje}</Aviso>
      <CampoPassword etiqueta="Contraseña actual" obligatorio value={actual} error={errores.actual}
        onChangeText={(t) => { setActual(t); limpiar('actual'); }} />
      <CampoPassword etiqueta="Nueva contraseña" obligatorio ayuda="Mínimo 8 caracteres." value={nueva} error={errores.nueva}
        onChangeText={(t) => { setNueva(t); limpiar('nueva'); }} />
      <Boton titulo="Cambiar contraseña" tipo="primario" onPress={guardar} />
    </Tarjeta>
  );
}

function EliminarCuenta({ onEliminada }) {
  const [password, setPassword] = useState('');
  const { errores, general, mostrar, limpiar, reiniciar, marcar } = useErrores();

  async function eliminar() {
    reiniciar();
    if (!password) { marcar('password', 'Confirma con tu contraseña'); return; }
    if (!(await confirmar('Eliminar cuenta', 'Se borrarán tu cuenta, tus vehículos y todo su historial. Esta acción no se puede deshacer.', 'Eliminar'))) return;
    try {
      await api('/auth/cuenta', { metodo: 'DELETE', datos: { password } });
      onEliminada();
    } catch (e) { mostrar(e); }
  }

  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <Texto variante="subtitulo">Eliminar mi cuenta</Texto>
      <Texto variante="suave">Ley 1581 de 2012: puedes eliminar tu cuenta y todos tus datos en cualquier momento.</Texto>
      <Aviso>{general}</Aviso>
      <CampoPassword etiqueta="Confirma con tu contraseña" value={password} error={errores.password}
        onChangeText={(t) => { setPassword(t); limpiar('password'); }} />
      <Boton titulo="Eliminar cuenta" tipo="peligro" onPress={eliminar} />
    </Tarjeta>
  );
}
