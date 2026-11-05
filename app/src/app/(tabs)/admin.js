// RF-17, RF-18 y RF-19: plan base de partes, reglas de RTM y usuarios.
// Esta pestaña solo aparece para el administrador (ver (tabs)/_layout.js).
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { api } from '../../api/cliente';
import { useDatos } from '../../api/useDatos';
import { mensajeCompleto } from '../../api/useErrores';
import { useSesion } from '../../context/SesionContext';
import { Aviso, Boton, Campo, Cargando, Fila, Pantalla, Separador, Tarjeta, Texto } from '../../components/ui';
import { useColores } from '../../tema';
import { confirmar } from '../../utils/dialogos';

export default function Admin() {
  const [seccion, setSeccion] = useState('plan');
  return (
    <Pantalla>
      <Fila>
        <Boton titulo="Plan base" tipo={seccion === 'plan' ? 'primario' : 'normal'} onPress={() => setSeccion('plan')} />
        <Boton titulo="Usuarios" tipo={seccion === 'usuarios' ? 'primario' : 'normal'} onPress={() => setSeccion('usuarios')} />
      </Fila>
      {seccion === 'plan' ? <PlanBase /> : <Usuarios />}
    </Pantalla>
  );
}

function PlanBase() {
  const { datos: tipos, setDatos: setTipos, error: errorCarga } = useDatos('/admin/tipos');
  const [error, setError] = useState('');

  // Ejecuta una acción y muestra el error si el backend la rechaza
  const ejecutar = async (accion) => {
    setError('');
    try { setTipos(await accion()); } catch (e) { setError(mensajeCompleto(e)); }
  };

  if (!tipos) return errorCarga ? <Aviso>{errorCarga}</Aviso> : <Cargando />;

  return (
    <>
      <Texto variante="pequeno">Los cambios aplican a los vehículos que se registren de ahora en adelante. Deja “km” vacío si la parte se controla solo por tiempo.</Texto>
      <Aviso>{error}</Aviso>
      {tipos.map((tipo) => (
        <Tarjeta key={tipo.id} estilo={{ gap: 10 }}>
          <Texto variante="subtitulo">{tipo.nombre}</Texto>
          <ReglaRtm tipo={tipo} onGuardar={(anios) => ejecutar(() => api(`/admin/tipos/${tipo.id}/rtm`, { metodo: 'PUT', datos: { anios_primera: anios } }))} />
          {tipo.partes.map((p) => (
            <View key={p.id} style={{ gap: 8 }}>
              <Separador />
              <ParteBase parte={p}
                onGuardar={(datos) => ejecutar(() => api(`/admin/partes/${p.id}`, { metodo: 'PUT', datos }))}
                onQuitar={async () => (await confirmar('Quitar parte', `¿Quitar "${p.nombre}" del plan base de ${tipo.nombre}?`, 'Quitar'))
                  && ejecutar(() => api(`/admin/partes/${p.id}`, { metodo: 'DELETE' }))} />
            </View>
          ))}
          <Separador />
          <Texto variante="negrita">Agregar parte</Texto>
          <ParteBase key={`nueva-${tipo.partes.length}`} parte={{ nombre: '', intervalo_km: '', intervalo_meses: '' }} nueva
            onGuardar={(datos) => ejecutar(() => api(`/admin/tipos/${tipo.id}/partes`, { metodo: 'POST', datos }))} />
        </Tarjeta>
      ))}
    </>
  );
}

/** Campos editables de una parte del plan base. */
function ParteBase({ parte, nueva = false, onGuardar, onQuitar }) {
  const [nombre, setNombre] = useState(parte.nombre);
  const [intervaloKm, setIntervaloKm] = useState(String(parte.intervalo_km ?? ''));
  const [meses, setMeses] = useState(String(parte.intervalo_meses ?? ''));
  const cambio = nombre !== parte.nombre || intervaloKm !== String(parte.intervalo_km ?? '') || meses !== String(parte.intervalo_meses ?? '');

  const guardar = () => onGuardar({
    nombre,
    intervalo_km: intervaloKm === '' ? null : Number(intervaloKm),
    intervalo_meses: Number(meses),
  });

  return (
    <View style={{ gap: 8 }}>
      <Campo value={nombre} onChangeText={setNombre} placeholder="Nombre de la parte" accessibilityLabel="Nombre de la parte" />
      <Fila>
        <View style={{ flex: 1 }}><Campo value={intervaloKm} onChangeText={setIntervaloKm} keyboardType="number-pad" placeholder="Solo tiempo" ayuda="Cada (km)" /></View>
        <View style={{ flex: 1 }}><Campo value={meses} onChangeText={setMeses} keyboardType="number-pad" ayuda="Cada (meses)" /></View>
      </Fila>
      <Fila>
        {nueva
          ? <Boton titulo="Agregar" onPress={guardar} deshabilitado={!nombre || !meses} />
          : <>
              {cambio && <Boton titulo="Guardar" tipo="primario" onPress={guardar} />}
              <Boton titulo="Quitar" tipo="enlace" onPress={onQuitar} />
            </>}
      </Fila>
    </View>
  );
}

function ReglaRtm({ tipo, onGuardar }) {
  const [anios, setAnios] = useState(String(tipo.anios_primera ?? ''));
  return (
    <Fila>
      <Texto variante="suave">Primera revisión técnico-mecánica a los</Texto>
      <View style={{ width: 70 }}><Campo value={anios} onChangeText={setAnios} keyboardType="number-pad" accessibilityLabel="Años" /></View>
      <Texto variante="suave">años</Texto>
      {anios !== String(tipo.anios_primera ?? '') && <Boton titulo="Guardar" tipo="primario" onPress={() => onGuardar(Number(anios))} />}
    </Fila>
  );
}

function Usuarios() {
  const c = useColores();
  const { usuario: yo } = useSesion();
  const { datos: usuarios, setDatos: setUsuarios } = useDatos('/admin/usuarios');
  const [error, setError] = useState('');

  async function cambiarActivo(u) {
    setError('');
    try {
      setUsuarios(await api(`/admin/usuarios/${u.id}/activo`, { metodo: 'PUT', datos: { activo: !u.activo } }));
    } catch (e) { setError(mensajeCompleto(e)); }
  }

  if (!usuarios) return <Cargando />;

  return (
    <Tarjeta>
      <Aviso>{error}</Aviso>
      <Texto variante="pequeno">Un usuario desactivado no puede iniciar sesión.</Texto>
      {usuarios.map((u) => (
        <View key={u.id}>
          <Separador />
          <Fila estilo={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <View style={{ flex: 1 }}>
              <Texto variante="negrita">{u.nombre}{u.rol === 'admin' ? ' (admin)' : ''}</Texto>
              <Texto variante="pequeno">{u.correo} · {u.vehiculos} vehículo{u.vehiculos === 1 ? '' : 's'}</Texto>
            </View>
            <Switch value={Boolean(u.activo)} onValueChange={() => cambiarActivo(u)} disabled={u.id === yo.id}
              trackColor={{ true: c.primario }} accessibilityLabel={`Activo: ${u.nombre}`} />
          </Fila>
        </View>
      ))}
    </Tarjeta>
  );
}
