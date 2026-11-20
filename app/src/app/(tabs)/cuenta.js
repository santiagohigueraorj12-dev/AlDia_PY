// RF-03: resumen del perfil, contraseña, cerrar sesión y eliminar la cuenta (RNF-09).
// Los datos personales se editan en la pantalla "Mi perfil" (app/perfil.js).
import { useState } from 'react';
import { api, descargarYCompartir } from '../../api/cliente';
import { useErrores } from '../../api/useErrores';
import { useSesion } from '../../context/SesionContext';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Aviso, BarraDesgaste, Boton, CampoPassword, Pantalla, Tarjeta, Texto, TituloSeccion } from '../../components/ui';
import { useColores } from '../../tema';
import { confirmar } from '../../utils/dialogos';

export default function Cuenta() {
  const { usuario, cerrarSesion } = useSesion();
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
      <ResumenPerfil usuario={usuario} />
      <CambiarPassword />
      <MisDatos />
      <EliminarCuenta onEliminada={cerrarSesion} />
    </Pantalla>
  );
}

/** Ley 1581: descargar todos mis datos y leer la política de privacidad. */
function MisDatos() {
  const [cargando, setCargando] = useState(false);
  const { general, mostrar, reiniciar } = useErrores();

  async function descargar() {
    reiniciar();
    setCargando(true);
    try {
      await descargarYCompartir('/auth/mis-datos', 'mis-datos-aldia.json', 'application/json');
    } catch (e) { mostrar(e); } finally { setCargando(false); }
  }

  return (
    <Tarjeta estilo={{ gap: 12 }}>
      <TituloSeccion titulo="Mis datos y privacidad" icono="shield-checkmark-outline" />
      <Texto variante="suave">Descarga una copia de todo lo que AlDía guarda sobre ti: tu perfil, tus vehículos, su historial y tus documentos.</Texto>
      <Aviso>{general}</Aviso>
      <Boton titulo={cargando ? 'Preparando…' : 'Descargar mis datos'} icono="download-outline" onPress={descargar} />
      <Boton titulo="Política de privacidad" icono="document-text-outline" tipo="enlace" onPress={() => router.push('/privacidad')} />
    </Tarjeta>
  );
}

/** Resumen de "Mi perfil": cuánto está completo y botón para llenarlo. */
function ResumenPerfil({ usuario }) {
  const { porcentaje, faltan } = usuario.perfil;
  return (
    <Tarjeta estilo={{ gap: 10 }}>
      <TituloSeccion titulo="Mi perfil" icono="person-outline"
        accion={<Texto variante="pequeno">{porcentaje} % completo</Texto>} />
      <BarraDesgaste porcentaje={porcentaje} estado={porcentaje === 100 ? 'bien' : 'proxima'} />
      <Texto variante="suave">
        {faltan.length === 0
          ? 'Tus datos personales, tu dirección y tu licencia están al día.'
          : `Completa tus datos: ${faltan.join(', ').toLowerCase()}.`}
      </Texto>
      <Boton titulo={faltan.length === 0 ? 'Ver o cambiar mis datos' : 'Completar mi perfil'} icono="create-outline"
        tipo={faltan.length === 0 ? 'normal' : 'primario'} onPress={() => router.push('/perfil')} />
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
