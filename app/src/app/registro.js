// RF-01: registro, con la autorización de datos de la Ley 1581 (RNF-09).
import { useState } from 'react';
import { Text } from 'react-native';
import { Link } from 'expo-router';
import { useSesion } from '../context/SesionContext';
import { useErrores } from '../api/useErrores';
import { Aviso, Boton, Campo, CampoPassword, Casilla, NotaObligatorios } from '../components/ui';
import PantallaAutenticacion from '../components/PantallaAutenticacion';
import { useColores } from '../tema';

export default function Registro() {
  const { registrarse } = useSesion();
  const c = useColores();
  const [datos, setDatos] = useState({ nombre: '', correo: '', telefono: '', password: '' });
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();
  const [enviando, setEnviando] = useState(false);

  // Al cambiar un campo se guarda el valor y se borra su error
  const cambiar = (campo) => (valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    limpiar(campo);
  };

  async function enviar() {
    reiniciar();
    setEnviando(true);
    try {
      await registrarse({ ...datos, correo: datos.correo.trim(), aceptaDatos });
    } catch (e) {
      mostrar(e);
      setEnviando(false);
    }
  }

  return (
    <PantallaAutenticacion
      titulo="Crear cuenta"
      subtitulo="Es gratis y toma menos de un minuto."
      ocultar="registro"
      pie={(
        <Text style={{ textAlign: 'center', color: c.textoSuave, fontSize: 15 }}>
          ¿Ya tienes cuenta? <Link href="/login" style={{ color: c.primario, fontWeight: '700' }}>Inicia sesión</Link>
        </Text>
      )}
    >
      <NotaObligatorios />
      <Aviso>{general}</Aviso>
      <Campo etiqueta="Nombre completo" obligatorio placeholder="Ej.: Laura Gómez" value={datos.nombre}
        onChangeText={cambiar('nombre')} error={errores.nombre} autoComplete="name" />
      <Campo etiqueta="Correo" obligatorio placeholder="nombre@correo.com" value={datos.correo} onChangeText={cambiar('correo')}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errores.correo} />
      <Campo etiqueta="Teléfono" placeholder="Ej.: 3001234567" value={datos.telefono} onChangeText={cambiar('telefono')}
        keyboardType="phone-pad" error={errores.telefono} />
      <CampoPassword etiqueta="Contraseña" obligatorio ayuda="Mínimo 8 caracteres." value={datos.password}
        onChangeText={cambiar('password')} error={errores.password} autoComplete="new-password" />
      <Casilla marcada={aceptaDatos} onCambio={(v) => { setAceptaDatos(v); limpiar('aceptaDatos'); }} error={errores.aceptaDatos}>
        Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012. Puedo eliminar mi cuenta y mis datos cuando quiera.
      </Casilla>
      <Boton titulo={enviando ? 'Creando cuenta…' : 'Crear cuenta'} tipo="primario" onPress={enviar} deshabilitado={enviando} />
    </PantallaAutenticacion>
  );
}
