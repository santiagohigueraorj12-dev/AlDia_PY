// RF-03: datos personales, contraseña, cerrar sesión y eliminar la cuenta (RNF-09).
import { useState } from 'react';
import { api } from '../../api/cliente';
import { useErrores } from '../../api/useErrores';
import { useSesion } from '../../context/SesionContext';
import { Text, View } from 'react-native';
import { Aviso, Boton, Campo, CampoPassword, Pantalla, Tarjeta, Texto, TituloSeccion } from '../../components/ui';
import { useColores } from '../../tema';
import { confirmar } from '../../utils/dialogos';

export default function Cuenta() {
  const { usuario, setUsuario, cerrarSesion } = useSesion();
  const c = useColores();
  // Iniciales del nombre para el círculo: "Santiago Higuera" -> "SH"
  const iniciales = usuario.nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  return (
    <Pantalla>
      <Tarjeta estilo={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.primario, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.primarioTexto, fontSize: 20, fontWeight: '700' }}>{iniciales}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Texto variante="subtitulo">{usuario.nombre}</Texto>
          <Texto variante="suave">{usuario.correo}</Texto>
        </View>
        <Boton titulo="Cerrar sesión" icono="log-out-outline" pequeno onPress={cerrarSesion} />
      </Tarjeta>
      <DatosPersonales usuario={usuario} onGuardado={setUsuario} />
      <CambiarPassword />
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
      <TituloSeccion titulo="Datos personales" icono="person-outline" />
      <Aviso>{general}</Aviso>
      <Aviso tipo="ok">{mensaje}</Aviso>
      <Campo etiqueta="Nombre" obligatorio value={nombre} error={errores.nombre}
        onChangeText={(t) => { setNombre(t); limpiar('nombre'); }} />
      <Campo etiqueta="Teléfono" placeholder="Ej.: 3001234567" value={telefono} keyboardType="phone-pad"
        error={errores.telefono} onChangeText={(t) => { setTelefono(t); limpiar('telefono'); }} />
      <Boton titulo="Guardar cambios" icono="save-outline" tipo="primario" onPress={guardar} />
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
      <TituloSeccion titulo="Cambiar contraseña" icono="lock-closed-outline" />
      <Aviso>{general}</Aviso>
      <Aviso tipo="ok">{mensaje}</Aviso>
      <CampoPassword etiqueta="Contraseña actual" obligatorio value={actual} error={errores.actual}
        onChangeText={(t) => { setActual(t); limpiar('actual'); }} />
      <CampoPassword etiqueta="Nueva contraseña" obligatorio ayuda="Mínimo 8 caracteres." value={nueva} error={errores.nueva}
        onChangeText={(t) => { setNueva(t); limpiar('nueva'); }} />
      <Boton titulo="Cambiar contraseña" icono="key-outline" tipo="primario" onPress={guardar} />
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
      <TituloSeccion titulo="Eliminar mi cuenta" icono="trash-outline" />
      <Texto variante="suave">Puedes eliminar tu cuenta y todos tus datos cuando quieras (Ley 1581 de 2012). Se borran también tus vehículos y su historial.</Texto>
      <Aviso>{general}</Aviso>
      <CampoPassword etiqueta="Confirma con tu contraseña" value={password} error={errores.password}
        onChangeText={(t) => { setPassword(t); limpiar('password'); }} />
      <Boton titulo="Eliminar cuenta" icono="trash-outline" tipo="peligro" onPress={eliminar} />
    </Tarjeta>
  );
}
