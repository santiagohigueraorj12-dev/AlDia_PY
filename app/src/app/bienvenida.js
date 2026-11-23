// Página de inicio pública: lo primero que ve quien entra sin haber iniciado sesión.
// Explica qué es AlDía, cómo funciona y qué hace, e invita a crear una cuenta.
// Las secciones se acomodan en columnas en el computador y una debajo de otra en el celular.
import { useRef } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColores } from '../tema';
import { ANCHO_PAGINA, BarraDesgaste, Boton, Etiqueta, margenLateral } from '../components/ui';
import EncabezadoPublico, { Logo } from '../components/EncabezadoPublico';
import { IlustracionCarro, IlustracionMoto } from '../components/Ilustraciones';
import Escena3D from '../components/Escena3D';
import { ESTADO_PARTE, ESTADO_VEHICULO } from '../utils/formato';
import { Burbujas, Degradado, FondoDecorado } from '../components/Decoracion';

const PROBLEMAS = [
  { icono: 'water', titulo: 'Se te pasó el cambio de aceite', texto: 'Llevar el mantenimiento de memoria o en el sticker del taller termina en motores, frenos y llantas dañados.' },
  { icono: 'wallet', titulo: 'No sabes cuánto gastas', texto: 'Sin un registro de los cambios no sabes cuánto cuesta realmente mantener tu vehículo.' },
  { icono: 'alert-circle', titulo: 'Te multaron por el SOAT', texto: 'Un documento vencido significa multas e incluso la inmovilización del vehículo.' },
  { icono: 'construct', titulo: 'Los frenos fallaron sin aviso', texto: 'Las pastillas y las llantas se gastan poco a poco: si nadie lleva la cuenta, el aviso llega tarde.' },
];

const PASOS = [
  { icono: 'car-sport', titulo: 'Registra tu vehículo', texto: 'Moto o carro, con su placa y su kilometraje. AlDía carga las partes que se cambian y cada cuánto se recomienda hacerlo.' },
  { icono: 'speedometer', titulo: 'Mantén el kilometraje al día', texto: 'Actualízalo cuando quieras. Si se te olvida, AlDía lo estima con tu uso diario y te lo recuerda.' },
  { icono: 'notifications', titulo: 'Recibe alertas y registra los cambios', texto: 'Te avisamos cuando una parte está próxima o vencida. Al cambiarla la registras y su desgaste vuelve a 0 %.' },
];

const FUNCIONES = [
  { icono: 'speedometer', titulo: 'Desgaste de cada parte', texto: 'Por kilómetros y por tiempo: lo que llegue primero.' },
  { icono: 'notifications', titulo: 'Alertas a tiempo', texto: 'Partes próximas o vencidas, y documentos 30, 7 y 1 día antes de vencer.' },
  { icono: 'document-text', titulo: 'SOAT, técnico-mecánica e impuesto', texto: 'Con su fecha de vencimiento, su historial y el archivo adjunto.' },
  { icono: 'cash', titulo: 'Costo de mantenimiento', texto: 'Cuánto has gastado en tu vehículo y cuánto te cuesta cada kilómetro.' },
  { icono: 'calendar', titulo: 'Calendario', texto: 'Los cambios estimados y los vencimientos del mes, en un solo lugar.' },
  { icono: 'document-attach', titulo: 'Hoja de vida en PDF', texto: 'Todo el historial del vehículo, listo para compartir o para cuando lo vendas.' },
  { icono: 'pie-chart', titulo: 'Gráfica de gastos', texto: 'Lo que gastaste cada mes y en qué se va la plata, de un vistazo.' },
  { icono: 'mail', titulo: 'Avisos por correo', texto: 'Un resumen diario de lo que necesita atención, aunque no abras la app.' },
];

// Ventajas rápidas debajo de los botones de la portada
const VENTAJAS = [
  { icono: 'gift', texto: 'Gratis y sin anuncios' },
  { icono: 'phone-portrait', texto: 'En el celular y el computador' },
  { icono: 'notifications', texto: 'Avisos antes de que venza' },
];

// Partes que AlDía controla en cada tipo de vehículo (las mismas del plan base)
const VEHICULOS = [
  { tipo: 'Moto', titulo: 'Para tu moto', texto: 'Desde una scooter hasta una moto de alto cilindraje.', partes: ['Aceite y filtro', 'Kit de arrastre', 'Pastillas de freno', 'Llantas', 'Bujía', 'Batería'] },
  { tipo: 'Carro', titulo: 'Para tu carro', texto: 'Automóviles, camionetas y vehículos particulares.', partes: ['Aceite y filtros', 'Correa de distribución', 'Alineación y balanceo', 'Frenos', 'Refrigerante', 'Llantas'] },
];

const ESTADOS = [
  { estado: 'bien', porcentaje: 45, rango: 'Menos del 80 %', texto: 'Todo en orden.' },
  { estado: 'proxima', porcentaje: 88, rango: 'Del 80 % al 99 %', texto: 'Programa el cambio pronto.' },
  { estado: 'vencida', porcentaje: 100, rango: '100 % o más', texto: 'Cámbiala lo antes posible.' },
];

export default function Bienvenida() {
  const c = useColores();
  const { width } = useWindowDimensions();
  const ancha = width >= 800;
  const grande = width >= 1200;   // computador grande: más columnas y letra más grande
  const scroll = useRef(null);
  const posiciones = useRef({});  // y de cada sección, para los enlaces de la barra superior

  const irA = (seccion) => scroll.current?.scrollTo({ y: posiciones.current[seccion] ?? 0, animated: true });
  const guardarPosicion = (seccion) => (e) => { posiciones.current[seccion] = e.nativeEvent.layout.y; };

  // Estilos que dependen del tamaño de la pantalla (hasta 1440 px de ancho, como la barra superior)
  const contenedor = { width: '100%', maxWidth: ANCHO_PAGINA, alignSelf: 'center', paddingHorizontal: margenLateral(width) };
  const seccion = { paddingVertical: grande ? 72 : 48 };
  const titulo = { fontSize: grande ? 36 : ancha ? 30 : 24, fontWeight: '800', color: c.texto, textAlign: 'center' };
  const subtitulo = { fontSize: grande ? 18 : 16, color: c.textoSuave, textAlign: 'center', maxWidth: 760, alignSelf: 'center', lineHeight: grande ? 27 : 24 };
  const rejilla = { flexDirection: ancha ? 'row' : 'column', flexWrap: 'wrap', gap: grande ? 22 : 16 };
  const columnas = (n) => (ancha ? { flexBasis: `${100 / n - 3}%`, flexGrow: 1 } : {});
  const tarjeta = {
    backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 16, padding: grande ? 26 : 20, gap: 10,
    boxShadow: `0 6px 20px ${c.sombra}`,
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <EncabezadoPublico enlaces={[
        { texto: 'Cómo funciona', onPress: () => irA('pasos') },
        { texto: 'Motos y carros', onPress: () => irA('vehiculos') },
        { texto: 'Funciones', onPress: () => irA('funciones') },
        { texto: 'Colores', onPress: () => irA('colores') },
      ]} />

      <ScrollView ref={scroll}>
        {/* ---------------- Portada ---------------- */}
        <View style={{ backgroundColor: c.esOscuro ? c.fondo : c.primarioSuave, paddingVertical: grande ? 80 : ancha ? 56 : 32, overflow: 'hidden' }}>
          <FondoDecorado />
          <Burbujas variante={0} escala={grande ? 1.3 : ancha ? 1 : 0.6} />
          <View style={[contenedor, { flexDirection: ancha ? 'row' : 'column', gap: grande ? 64 : 36, alignItems: 'center' }]}>
            <View style={{ flex: ancha ? 1.1 : undefined, gap: 18 }}>
              <View style={{ alignSelf: 'flex-start', backgroundColor: c.superficie, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: c.borde }}>
                <Text style={{ color: c.primario, fontWeight: '800', fontSize: 13.5 }}>Tu taller de bolsillo</Text>
              </View>
              <Text style={{ fontSize: grande ? 58 : ancha ? 44 : 32, fontWeight: '800', color: c.texto, lineHeight: grande ? 66 : ancha ? 52 : 38 }}>
                Que no se te pase ningún cambio de tu vehículo.
              </Text>
              <Text style={{ fontSize: grande ? 19 : 17, color: c.textoSuave, lineHeight: grande ? 30 : 26, maxWidth: 640 }}>
                AlDía calcula el desgaste del aceite, los frenos, las llantas y cada parte de tu moto o carro según los
                kilómetros y el tiempo, y te avisa cuándo toca cambiarla. También te recuerda el SOAT, la revisión
                técnico-mecánica y el impuesto antes de que venzan.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                <Boton titulo="Crear cuenta gratis" tipo="primario" icono="arrow-forward" onPress={() => router.push('/registro')} />
                <Boton titulo="Ya tengo cuenta" onPress={() => router.push('/login')} />
              </View>
              {/* Ventajas en pastillas con ícono */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {VENTAJAS.map((x) => (
                  <View key={x.texto} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.superficie, borderWidth: 1, borderColor: c.borde,
                    borderRadius: 99, paddingLeft: 5, paddingRight: 14, paddingVertical: 5, boxShadow: `0 4px 14px ${c.sombra}` }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.primarioSuave, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={x.icono} size={15} color={c.primario} />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: c.texto }}>{x.texto}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Escena 3D: AlDía en un celular, con avisos flotando alrededor */}
            <View style={{ flex: ancha ? 1 : undefined, width: ancha ? undefined : '100%', alignItems: 'center' }}>
              <Escena3D tamano={grande ? 290 : ancha ? 230 : 170} />
            </View>
          </View>
        </View>

        {/* ---------------- El problema ---------------- */}
        <View style={{ overflow: 'hidden' }}>
        <Burbujas variante={1} escala={grande ? 1.2 : ancha ? 1 : 0.55} />
        <View style={[contenedor, seccion, { gap: 28 }]}>
          <Text style={titulo}>¿Te ha pasado?</Text>
          <Text style={subtitulo}>Llevar el mantenimiento de memoria sale caro. Estas son las situaciones que AlDía evita.</Text>
          <View style={rejilla}>
            {PROBLEMAS.map((p) => (
              <View key={p.titulo} style={[tarjeta, columnas(grande ? 4 : 2)]}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: c.vencidaFondo, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={p.icono} size={26} color={c.vencida} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: c.texto }}>{p.titulo}</Text>
                <Text style={{ fontSize: 15, color: c.textoSuave, lineHeight: 22 }}>{p.texto}</Text>
              </View>
            ))}
          </View>
        </View>

        </View>

        {/* ---------------- Para motos y carros ---------------- */}
        <View onLayout={guardarPosicion('vehiculos')} style={[seccion, { backgroundColor: c.superficie, overflow: 'hidden' }]}>
          <Burbujas variante={2} escala={grande ? 1.2 : ancha ? 1 : 0.55} />
          <View style={[contenedor, { gap: 28 }]}>
            <Text style={titulo}>Hecho para motos y carros</Text>
            <Text style={subtitulo}>AlDía ya sabe qué partes tiene cada vehículo y cada cuánto se cambian. Tú solo ajustas lo que diga tu manual.</Text>
            <View style={[rejilla, { alignItems: 'stretch' }]}>
              {VEHICULOS.map((v) => (
                <View key={v.tipo} style={[tarjeta, columnas(2), { backgroundColor: c.fondo, flexDirection: grande ? 'row' : 'column', alignItems: 'center', gap: 20 }]}>
                  <View style={{ width: grande ? '46%' : '80%', maxWidth: 340 }}>
                    {v.tipo === 'Moto' ? <IlustracionMoto /> : <IlustracionCarro color="#64748b" />}
                  </View>
                  <View style={{ flex: grande ? 1 : undefined, gap: 12, alignItems: grande ? 'flex-start' : 'center' }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: c.texto }}>{v.titulo}</Text>
                    <Text style={{ fontSize: 14.5, color: c.textoSuave, textAlign: grande ? 'left' : 'center' }}>{v.texto}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: grande ? 'flex-start' : 'center' }}>
                      {v.partes.map((p) => (
                        <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                          <Ionicons name="checkmark-circle" size={16} color={c.bien} />
                          <Text style={{ color: c.texto, fontSize: 14 }}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---------------- Cómo funciona ---------------- */}
        <View onLayout={guardarPosicion('pasos')} style={[seccion, { overflow: 'hidden' }]}>
          <Burbujas variante={3} escala={grande ? 1.2 : ancha ? 1 : 0.55} />
          <View style={[contenedor, { gap: 28 }]}>
            <Text style={titulo}>Cómo funciona</Text>
            <Text style={subtitulo}>En tres pasos tienes el mantenimiento de tu vehículo bajo control.</Text>
            <View style={rejilla}>
              {PASOS.map((p, i) => (
                <View key={p.titulo} style={[tarjeta, columnas(3), { overflow: 'hidden' }]}>
                  {/* número grande de fondo, como marca de agua */}
                  <Text style={{ position: 'absolute', right: 14, top: -8, fontSize: 110, fontWeight: '800', color: c.primario, opacity: 0.08 }}>{i + 1}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: c.primario, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={p.icono} size={24} color={c.primarioTexto} />
                    </View>
                    <Text style={{ color: c.primario, fontWeight: '800', fontSize: 14, letterSpacing: 1 }}>PASO {i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: c.texto }}>{p.titulo}</Text>
                  <Text style={{ fontSize: 15, color: c.textoSuave, lineHeight: 22 }}>{p.texto}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---------------- Funciones ---------------- */}
        <View onLayout={guardarPosicion('funciones')} style={[seccion, { backgroundColor: c.superficie, overflow: 'hidden' }]}>
          <Burbujas variante={0} escala={grande ? 1.2 : ancha ? 1 : 0.55} />
          <View style={[contenedor, { gap: 28 }]}>
            <Text style={titulo}>Todo lo que hace por ti</Text>
            <Text style={subtitulo}>Lo que necesitas para cuidar tu vehículo, en una sola aplicación.</Text>
            <View style={rejilla}>
              {FUNCIONES.map((f) => (
                <View key={f.titulo} style={[tarjeta, columnas(grande ? 4 : 2), { backgroundColor: c.fondo, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }]}>
                  <View style={{ backgroundColor: c.primarioSuave, borderRadius: 12, padding: 11 }}>
                    <Ionicons name={f.icono} size={24} color={c.primario} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 16.5, fontWeight: '800', color: c.texto }}>{f.titulo}</Text>
                    <Text style={{ fontSize: 14.5, color: c.textoSuave, lineHeight: 21 }}>{f.texto}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---------------- Estados con colores + vista previa al lado ---------------- */}
        <View onLayout={guardarPosicion('colores')} style={[seccion, { overflow: 'hidden' }]}>
          <Burbujas variante={1} escala={grande ? 1.2 : ancha ? 1 : 0.55} />
          <View style={[contenedor, { flexDirection: grande ? 'row' : 'column', gap: grande ? 56 : 28, alignItems: grande ? 'center' : 'stretch' }]}>
            <View style={{ flex: grande ? 1.2 : undefined, gap: 20 }}>
              <Text style={[titulo, grande && { textAlign: 'left' }]}>Los colores te dicen qué hacer</Text>
              <Text style={[subtitulo, grande && { textAlign: 'left', alignSelf: 'flex-start' }]}>
                Cada parte muestra su desgaste con una barra y un color, así sabes de un vistazo qué atender primero.
              </Text>
              <View style={rejilla}>
                {ESTADOS.map((e) => (
                  <View key={e.estado} style={[tarjeta, columnas(3)]}>
                    <Etiqueta estado={ESTADO_PARTE[e.estado]} />
                    <BarraDesgaste porcentaje={e.porcentaje} estado={e.estado} />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: c.texto }}>{e.rango}</Text>
                    <Text style={{ fontSize: 14.5, color: c.textoSuave }}>{e.texto}</Text>
                  </View>
                ))}
              </View>
            </View>
            {/* Vista previa de cómo se ve un vehículo dentro de la app */}
            <View style={{ flex: grande ? 1 : undefined, width: '100%', maxWidth: grande ? undefined : 480, alignSelf: 'center', gap: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: c.textoSuave, letterSpacing: 1, textAlign: grande ? 'left' : 'center' }}>ASÍ SE VE TU VEHÍCULO EN ALDÍA</Text>
              <VistaPrevia />
            </View>
          </View>
        </View>

        {/* ---------------- Llamado final ---------------- */}
        <View style={[contenedor, { paddingBottom: grande ? 72 : 48 }]}>
          <Degradado circulos estilo={{ borderRadius: 24, borderWidth: 1, borderColor: c.borde, boxShadow: `0 12px 30px ${c.sombra}` }}>
            <View style={{ padding: grande ? 48 : 24, flexDirection: grande ? 'row' : 'column', alignItems: 'center', gap: grande ? 48 : 16 }}>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
                <IlustracionMoto ancho={grande ? 200 : 120} color={c.secundario} />
                <IlustracionCarro ancho={grande ? 230 : 130} color={c.acento} />
              </View>
              <View style={{ flex: grande ? 1 : undefined, gap: 12, alignItems: grande ? 'flex-start' : 'center' }}>
                <Text style={{ fontSize: grande ? 34 : 22, fontWeight: '800', color: c.sobreDegradado, textAlign: grande ? 'left' : 'center' }}>
                  Empieza hoy a llevar el mantenimiento al día
                </Text>
                <Text style={{ fontSize: 16.5, color: c.sobreDegradadoSuave, textAlign: grande ? 'left' : 'center' }}>
                  Crear tu cuenta toma menos de un minuto y es gratis.
                </Text>
                <Boton titulo="Crear cuenta gratis" tipo="primario" icono="arrow-forward" onPress={() => router.push('/registro')} />
              </View>
            </View>
          </Degradado>
        </View>

        {/* ---------------- Pie de página ---------------- */}
        <View style={{ borderTopWidth: 1, borderTopColor: c.borde, backgroundColor: c.superficie, paddingVertical: 28 }}>
          <View style={[contenedor, { flexDirection: ancha ? 'row' : 'column', alignItems: 'center', justifyContent: 'space-between', gap: 12 }]}>
            <View style={{ alignItems: ancha ? 'flex-start' : 'center', gap: 6 }}>
              <Logo tamano={18} />
              <Text style={{ color: c.textoSuave, fontSize: 13 }}>Tu vehículo, siempre al día.</Text>
            </View>
            <Text style={{ color: c.textoSuave, fontSize: 13, textAlign: 'center' }}>© 2026 AlDía · Creado por Simon Higuera y Santiago Higuera</Text>
            <Text style={{ fontSize: 13, textAlign: 'center' }}>
              <Text style={{ color: c.primario, fontWeight: '700' }} onPress={() => router.push('/privacidad')}>Política de privacidad</Text>
              <Text style={{ color: c.textoSuave }}>  ·  aldiatuvehiculo@gmail.com</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Tarjeta de ejemplo que muestra cómo se ve un vehículo dentro de la app (es solo una ilustración). */
function VistaPrevia() {
  const c = useColores();
  const partes = [
    { nombre: 'Pastillas de freno', porcentaje: 101, estado: 'vencida' },
    { nombre: 'Aceite de motor', porcentaje: 86, estado: 'proxima' },
    { nombre: 'Llantas', porcentaje: 37, estado: 'bien' },
  ];
  return (
    <View
      accessibilityLabel="Ejemplo de cómo se ve un vehículo en AlDía"
      style={{ backgroundColor: c.superficie, borderRadius: 18, padding: 20, gap: 14, borderWidth: 1, borderColor: c.borde,
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: c.texto }}>ABC12D</Text>
          <Text style={{ fontSize: 13, color: c.textoSuave }}>Moto · Yamaha NMAX · 15.400 km</Text>
        </View>
        <Etiqueta estado={ESTADO_VEHICULO.requiere_atencion} />
      </View>
      {partes.map((p) => (
        <View key={p.nombre} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: c.texto }}>{p.nombre}</Text>
            <Text style={{ fontSize: 13, color: c.textoSuave }}>{p.porcentaje} %</Text>
          </View>
          <BarraDesgaste porcentaje={p.porcentaje} estado={p.estado} />
        </View>
      ))}
      <View style={{ backgroundColor: c.proximaFondo, borderRadius: 10, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name="notifications" size={18} color={c.proxima} />
        <Text style={{ color: c.proxima, fontSize: 13.5, flex: 1 }}>El SOAT vence en 20 días</Text>
      </View>
    </View>
  );
}
