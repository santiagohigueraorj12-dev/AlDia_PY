// RF-01: registro, con la autorización de datos de la Ley 1581 (RNF-09).
import { useState } from 'react';
import { useSesion } from '../context/SesionContext';
import { Aviso, Boton, Campo, Casilla, Pantalla, Tarjeta } from '../components/ui';

export default function Registro() {
  const { registrarse } = useSesion();
  const [datos, setDatos] = useState({ nombre: '', correo: '', telefono: '', password: '' });
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => setDatos({ ...datos, [campo]: valor });

  async function enviar() {
    setError('');
    setEnviando(true);
    try {
      await registrarse({ ...datos, correo: datos.correo.trim(), aceptaDatos });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Tarjeta estilo={{ gap: 14 }}>
        <Aviso>{error}</Aviso>
        <Campo etiqueta="Nombre completo" value={datos.nombre} onChangeText={cambiar('nombre')} />
        <Campo etiqueta="Correo" value={datos.correo} onChangeText={cambiar('correo')} keyboardType="email-address" autoCapitalize="none" />
        <Campo etiqueta="Teléfono (opcional)" value={datos.telefono} onChangeText={cambiar('telefono')} keyboardType="phone-pad" />
        <Campo etiqueta="Contraseña" ayuda="Mínimo 8 caracteres" value={datos.password} onChangeText={cambiar('password')} secureTextEntry />
        <Casilla marcada={aceptaDatos} onCambio={setAceptaDatos}>
          Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012. Puedo eliminar mi cuenta y mis datos cuando quiera.
        </Casilla>
        <Boton titulo={enviando ? 'Creando cuenta…' : 'Registrarme'} tipo="primario" onPress={enviar} deshabilitado={enviando || !aceptaDatos} />
      </Tarjeta>
    </Pantalla>
  );
}
