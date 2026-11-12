// RF-03: "Mi perfil". El registro solo pide nombre, correo y contraseña;
// aquí, ya dentro de la app, el usuario completa el resto de sus datos (RN-18).
import { useState } from 'react';
import { View } from 'react-native';
import { api } from '../api/cliente';
import { useErrores } from '../api/useErrores';
import { useSesion } from '../context/SesionContext';
import { Aviso, BarraDesgaste, Boton, Campo, Fila, NotaObligatorios, Pantalla, Tarjeta, Texto, TituloSeccion } from '../components/ui';
import CampoFecha from '../components/CampoFecha';
import Selector from '../components/Selector';
import { CATEGORIAS_LICENCIA, DEPARTAMENTOS, TIPOS_DOCUMENTO } from '../utils/colombia';
import { hoyISO } from '../utils/formato';

/** Fecha de hoy menos n años, como 'AAAA-MM-DD' (para la edad mínima). */
function haceAnios(n) {
  const hoy = hoyISO();
  return `${Number(hoy.slice(0, 4)) - n}${hoy.slice(4)}`;
}

const CAMPOS = ['nombre', 'telefono', 'tipo_documento', 'numero_documento', 'fecha_nacimiento',
  'departamento', 'ciudad', 'direccion', 'licencia_categoria', 'licencia_vence'];

export default function Perfil() {
  const { usuario, setUsuario } = useSesion();
  // Se copia el usuario a un formulario: los campos vacíos quedan como ''
  const [datos, setDatos] = useState(() => Object.fromEntries(CAMPOS.map((c) => [c, usuario[c] ?? ''])));
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { errores, general, mostrar, limpiar, reiniciar } = useErrores();

  const cambiar = (campo) => (valor) => {
    setDatos((d) => ({ ...d, [campo]: valor ?? '' }));
    limpiar(campo);
    setMensaje('');
  };

  async function guardar() {
    reiniciar();
    setMensaje('');
    setEnviando(true);
    try {
      const actualizado = await api('/auth/perfil', { metodo: 'PUT', datos });
      setUsuario(actualizado);  // el Inicio y la Cuenta se actualizan solos
      setMensaje(actualizado.perfil.porcentaje === 100 ? '¡Listo! Tu perfil está completo.' : 'Datos guardados.');
    } catch (e) {
      mostrar(e);
    } finally {
      setEnviando(false);
    }
  }

  const { porcentaje, faltan } = usuario.perfil;

  return (
    <Pantalla>
      {/* Cuánto le falta al perfil */}
      <Tarjeta>
        <Fila estilo={{ justifyContent: 'space-between' }}>
          <Texto variante="subtitulo">Tu perfil va en {porcentaje} %</Texto>
          <Texto variante="pequeno">{faltan.length === 0 ? 'Completo' : `${faltan.length} dato${faltan.length === 1 ? '' : 's'} por llenar`}</Texto>
        </Fila>
        <BarraDesgaste porcentaje={porcentaje} estado={porcentaje === 100 ? 'bien' : 'proxima'} />
        <Texto variante="pequeno">
          {faltan.length === 0
            ? 'Tienes todos tus datos al día.'
            : `Te falta: ${faltan.join(', ').toLowerCase()}. Ninguno es obligatorio, pero con tu licencia AlDía también te avisa cuando esté por vencer.`}
        </Texto>
      </Tarjeta>

      <Aviso>{general}</Aviso>
      <NotaObligatorios />

      <Tarjeta estilo={{ gap: 12 }}>
        <TituloSeccion titulo="Datos personales" icono="person-outline" />
        <Campo etiqueta="Nombre completo" obligatorio value={datos.nombre} onChangeText={cambiar('nombre')} error={errores.nombre} autoComplete="name" />
        <Texto variante="pequeno">Correo: {usuario.correo} (con él inicias sesión, no se puede cambiar)</Texto>
        <Selector etiqueta="Tipo de documento" opciones={TIPOS_DOCUMENTO} valor={datos.tipo_documento || null}
          onCambio={cambiar('tipo_documento')} error={errores.tipo_documento} />
        <Campo etiqueta="Número de documento" placeholder="Ej.: 1012345678" value={datos.numero_documento}
          onChangeText={cambiar('numero_documento')} error={errores.numero_documento} ayuda="Sin puntos ni espacios."
          keyboardType={['CC', 'TI'].includes(datos.tipo_documento) ? 'number-pad' : 'default'} autoCapitalize="characters" />
        <CampoFecha etiqueta="Fecha de nacimiento" valor={datos.fecha_nacimiento} onCambio={cambiar('fecha_nacimiento')}
          maxima={haceAnios(16)} error={errores.fecha_nacimiento} ayuda="Debes tener al menos 16 años." borrable />
        <Campo etiqueta="Teléfono celular" placeholder="Ej.: 3001234567" value={datos.telefono} onChangeText={cambiar('telefono')}
          keyboardType="phone-pad" error={errores.telefono} autoComplete="tel" />
      </Tarjeta>

      <Tarjeta estilo={{ gap: 12 }}>
        <TituloSeccion titulo="Dónde vives" icono="home-outline" />
        <Selector etiqueta="Departamento" opciones={DEPARTAMENTOS} valor={datos.departamento || null}
          onCambio={cambiar('departamento')} error={errores.departamento} />
        <Campo etiqueta="Ciudad o municipio" placeholder="Ej.: Bogotá" value={datos.ciudad} onChangeText={cambiar('ciudad')} error={errores.ciudad} />
        <Campo etiqueta="Dirección" placeholder="Ej.: Cra. 7 # 45-10, apto 301" value={datos.direccion} onChangeText={cambiar('direccion')}
          error={errores.direccion} autoComplete="street-address" />
      </Tarjeta>

      <Tarjeta estilo={{ gap: 12 }}>
        <TituloSeccion titulo="Licencia de conducción" icono="card-outline" />
        <Texto variante="pequeno">Si la registras, AlDía te avisa cuando esté por vencer, igual que con el SOAT.</Texto>
        <Selector etiqueta="Categoría" opciones={CATEGORIAS_LICENCIA} valor={datos.licencia_categoria || null}
          onCambio={cambiar('licencia_categoria')} error={errores.licencia_categoria} />
        <CampoFecha etiqueta="Fecha de vencimiento" valor={datos.licencia_vence} onCambio={cambiar('licencia_vence')}
          error={errores.licencia_vence} ayuda="Aparece en la parte de atrás de la licencia." borrable />
      </Tarjeta>

      <View style={{ gap: 10 }}>
        <Aviso tipo="ok">{mensaje}</Aviso>
        <Boton titulo={enviando ? 'Guardando…' : 'Guardar mi perfil'} icono="checkmark-circle" tipo="primario" onPress={guardar} deshabilitado={enviando} />
      </View>
    </Pantalla>
  );
}
