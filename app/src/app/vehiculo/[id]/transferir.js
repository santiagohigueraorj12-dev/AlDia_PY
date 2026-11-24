// RF-29: transferir el vehículo a otro usuario de AlDía (por ejemplo, al venderlo).
// Pasa con todo su historial: partes, cambios, documentos, daños y fotos.
import { useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { api } from '../../../api/cliente';
import { useDatos } from '../../../api/useDatos';
import { useErrores } from '../../../api/useErrores';
import { Aviso, Boton, Campo, CampoPassword, Cargando, NotaObligatorios, Pantalla, Tarjeta, Texto, TituloSeccion } from '../../../components/ui';
import { confirmar } from '../../../utils/dialogos';
import { useCelebracion } from '../../../components/Celebracion';

export default function Transferir() {
  const { id } = useLocalSearchParams();
  const { datos: vehiculo } = useDatos(`/vehiculos/${id}`);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();
  const celebrar = useCelebracion();

  if (!vehiculo) return <Cargando />;

  async function transferir() {
    reiniciar();
    if (!(await confirmar('Transferir vehículo', `¿Pasar ${vehiculo.placa} a la cuenta de ${correo || 'ese correo'}? Dejará de aparecer en tu cuenta.`, 'Transferir'))) return;
    setEnviando(true);
    try {
      const r = await api(`/vehiculos/${id}/transferir`, { metodo: 'POST', datos: { correo, password } });
      celebrar(r.mensaje);
      router.replace('/vehiculos');
    } catch (e) {
      mostrar(e);
      setEnviando(false);
    }
  }

  return (
    <Pantalla>
      <Stack.Screen options={{ title: `Transferir ${vehiculo.placa}` }} />
      <Tarjeta estilo={{ gap: 12 }}>
        <TituloSeccion titulo="¿Vendiste el vehículo?" icono="swap-horizontal-outline" />
        <Texto variante="suave">
          Pásalo a la cuenta del comprador con todo su historial: partes, cambios, documentos, daños y fotos.
          Así puede seguir llevando el mantenimiento y comprobar cómo se cuidó.
        </Texto>
        <Aviso tipo="info">El comprador debe tener una cuenta en AlDía con ese correo. Tras transferirlo, el vehículo ya no aparecerá en tu cuenta.</Aviso>
        <NotaObligatorios />
        <Aviso>{general}</Aviso>
        <Campo etiqueta="Correo del nuevo dueño" obligatorio placeholder="nombre@correo.com" value={correo} keyboardType="email-address" autoCapitalize="none"
          onChangeText={(t) => { setCorreo(t); limpiar('correo'); }} error={errores.correo} />
        <CampoPassword etiqueta="Tu contraseña (para confirmar)" obligatorio value={password}
          onChangeText={(t) => { setPassword(t); limpiar('password'); }} error={errores.password} />
        <Boton titulo={enviando ? 'Transfiriendo…' : 'Transferir vehículo'} icono="swap-horizontal" tipo="primario" onPress={transferir} deshabilitado={enviando} />
      </Tarjeta>
    </Pantalla>
  );
}
