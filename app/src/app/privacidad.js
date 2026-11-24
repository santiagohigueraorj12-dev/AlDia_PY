// Política de tratamiento de datos personales (Ley 1581 de 2012 y Decreto 1377 de 2013).
// Pública: se puede leer antes de crear la cuenta (desde el registro) y con sesión (desde Cuenta).
import { Pantalla, Tarjeta, Texto, TituloSeccion } from '../components/ui';

const SECCIONES = [
  {
    titulo: '1. Responsable',
    icono: 'business-outline',
    parrafos: [
      'AlDía es una aplicación creada y administrada por Simon Higuera y Santiago Higuera, responsables del tratamiento de los datos que registras en ella.',
      'Para cualquier consulta, reclamo o solicitud sobre tus datos personales escríbenos a aldiatuvehiculo@gmail.com. Respondemos en un plazo máximo de 15 días hábiles.',
    ],
  },
  {
    titulo: '2. Qué datos recogemos',
    icono: 'list-outline',
    parrafos: [
      'Datos de la cuenta: nombre, correo electrónico y contraseña (guardada cifrada; nadie puede leerla).',
      'Datos del perfil, si decides llenarlos: teléfono, tipo y número de documento, fecha de nacimiento, departamento, ciudad, dirección y categoría y vencimiento de tu licencia de conducción.',
      'Datos de tus vehículos: marca, línea, modelo, placa, fecha de matrícula, kilometraje, mantenimientos, partes, documentos (SOAT, revisión técnico-mecánica, impuesto) y los archivos que adjuntes (fotos y PDF).',
    ],
  },
  {
    titulo: '3. Para qué los usamos',
    icono: 'checkmark-circle-outline',
    parrafos: [
      'Únicamente para prestarte el servicio de AlDía: calcular el desgaste de las partes, recordarte los mantenimientos y los vencimientos de tus documentos, enviarte avisos dentro de la app y por correo, y permitirte recuperar tu contraseña.',
      'No vendemos, alquilamos ni compartimos tus datos con terceros para publicidad.',
    ],
  },
  {
    titulo: '4. Tus derechos',
    icono: 'hand-left-outline',
    parrafos: [
      'Como titular de los datos tienes derecho a conocerlos, actualizarlos, rectificarlos, pedir prueba de la autorización que diste, ser informado sobre su uso, revocar la autorización y pedir que se eliminen.',
      'Todo lo puedes hacer tú mismo en la aplicación, en la pestaña Cuenta:',
      '• Ver y corregir tus datos: "Mi perfil".\n• Descargar una copia de todos tus datos: "Descargar mis datos".\n• Revocar la autorización y eliminar todos tus datos: "Eliminar mi cuenta". Se borran de inmediato tu cuenta, tus vehículos, su historial y tus archivos.',
    ],
  },
  {
    titulo: '5. Dónde se guardan y cómo se protegen',
    icono: 'lock-closed-outline',
    parrafos: [
      'La aplicación funciona en servidores en la nube: Render (aplicación), Aiven (base de datos) y Google (envío de correos con Gmail). Estos proveedores pueden estar fuera de Colombia y actúan solo como encargados que guardan o transmiten la información por cuenta de AlDía.',
      'La conexión con la base de datos va cifrada, las contraseñas se guardan con cifrado de una sola vía (bcrypt), la sesión usa tokens que vencen y el inicio de sesión se bloquea tras varios intentos fallidos.',
    ],
  },
  {
    titulo: '6. Autorización y vigencia',
    icono: 'calendar-outline',
    parrafos: [
      'Al crear tu cuenta marcas la casilla de autorización; queda registrada la fecha en que la diste. Tus datos se conservan mientras tengas la cuenta activa y se eliminan cuando la borras.',
      'Si esta política cambia, lo avisaremos dentro de la aplicación.',
      'Vigente desde el 20 de noviembre de 2026.',
    ],
  },
];

export default function Privacidad() {
  return (
    <Pantalla>
      <Texto variante="titulo">Política de privacidad</Texto>
      <Texto variante="suave">
        Cómo AlDía trata tus datos personales, según la Ley 1581 de 2012 de protección de datos personales de Colombia.
      </Texto>
      {SECCIONES.map((s) => (
        <Tarjeta key={s.titulo} estilo={{ gap: 8 }}>
          <TituloSeccion titulo={s.titulo} icono={s.icono} />
          {s.parrafos.map((p) => <Texto key={p.slice(0, 30)}>{p}</Texto>)}
        </Tarjeta>
      ))}
    </Pantalla>
  );
}
