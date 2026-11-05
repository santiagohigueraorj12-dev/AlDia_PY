// Página de inicio pública: lo primero que ve quien entra sin haber iniciado sesión.
// Explica qué es AlDía, cómo funciona y qué hace, e invita a crear una cuenta.
// Las secciones se acomodan en columnas en el computador y una debajo de otra en el celular.
import { useRef } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColores } from '../tema';
import { BarraDesgaste, Boton, Etiqueta } from '../components/ui';
import EncabezadoPublico, { Logo } from '../components/EncabezadoPublico';
import { ESTADO_PARTE, ESTADO_VEHICULO } from '../utils/formato';

const PROBLEMAS = [
  { icono: 'water', titulo: 'Se te pasó el cambio de aceite', texto: 'Llevar el mantenimiento de memoria o en el sticker del taller termina en motores, frenos y llantas dañados.' },
  { icono: 'wallet', titulo: 'No sabes cuánto gastas', texto: 'Sin un registro de los cambios no sabes cuánto cuesta realmente mantener tu vehículo.' },
  { icono: 'alert-circle', titulo: 'Te multaron por el SOAT', texto: 'Un documento vencido significa multas e incluso la inmovilización del vehículo.' },
];

const PASOS = [
  { titulo: 'Registra tu vehículo', texto: 'Moto o carro, con su placa y su kilometraje. AlDía carga las partes que se cambian y cada cuánto se recomienda hacerlo.' },
  { titulo: 'Mantén el kilometraje al día', texto: 'Actualízalo cuando quieras. Si se te olvida, AlDía lo estima con tu uso diario y te lo recuerda.' },
  { titulo: 'Recibe alertas y registra los cambios', texto: 'Te avisamos cuando una parte está próxima o vencida. Al cambiarla la registras y su desgaste vuelve a 0 %.' },
];

const FUNCIONES = [
  { icono: 'speedometer', titulo: 'Desgaste de cada parte', texto: 'Por kilómetros y por tiempo: lo que llegue primero.' },
  { icono: 'notifications', titulo: 'Alertas a tiempo', texto: 'Partes próximas o vencidas, y documentos 30, 7 y 1 día antes de vencer.' },
  { icono: 'document-text', titulo: 'SOAT, técnico-mecánica e impuesto', texto: 'Con su fecha de vencimiento, su historial y el archivo adjunto.' },
  { icono: 'cash', titulo: 'Costo de mantenimiento', texto: 'Cuánto has gastado en tu vehículo y cuánto te cuesta cada kilómetro.' },
  { icono: 'calendar', titulo: 'Calendario', texto: 'Los cambios estimados y los vencimientos del mes, en un solo lugar.' },
  { icono: 'document-attach', titulo: 'Hoja de vida en PDF', texto: 'Todo el historial del vehículo, listo para compartir o para cuando lo vendas.' },
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
  const scroll = useRef(null);
  const posiciones = useRef({});  // y de cada sección, para los enlaces de la barra superior

  const irA = (seccion) => scroll.current?.scrollTo({ y: posiciones.current[seccion] ?? 0, animated: true });
  const guardarPosicion = (seccion) => (e) => { posiciones.current[seccion] = e.nativeEvent.layout.y; };

  // Estilos que dependen del tamaño de la pantalla
  const contenedor = { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 20 };
  const titulo = { fontSize: ancha ? 30 : 24, fontWeight: '800', color: c.texto, textAlign: 'center' };
  const subtitulo = { fontSize: 16, color: c.textoSuave, textAlign: 'center', maxWidth: 640, alignSelf: 'center' };
  const rejilla = { flexDirection: ancha ? 'row' : 'column', flexWrap: 'wrap', gap: 16 };
  const columna = ancha ? { flexBasis: '31%', flexGrow: 1 } : {};
  const tarjeta = { backgroundColor: c.superficie, borderColor: c.borde, borderWidth: 1, borderRadius: 14, padding: 20, gap: 8 };

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      <EncabezadoPublico enlaces={[
        { texto: 'Cómo funciona', onPress: () => irA('pasos') },
        { texto: 'Funciones', onPress: () => irA('funciones') },
      ]} />

      <ScrollView ref={scroll}>
        {/* ---------------- Portada ---------------- */}
        <View style={{ backgroundColor: c.primarioSuave, paddingVertical: ancha ? 64 : 36 }}>
          <View style={[contenedor, { flexDirection: ancha ? 'row' : 'column', gap: 36, alignItems: 'center' }]}>
            <View style={{ flex: ancha ? 1.1 : undefined, gap: 16 }}>
              <View style={{ alignSelf: 'flex-start', backgroundColor: c.superficie, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ color: c.primario, fontWeight: '700', fontSize: 13 }}>🏍️ Para motos y carros 🚗</Text>
              </View>
              <Text style={{ fontSize: ancha ? 44 : 32, fontWeight: '800', color: c.texto, lineHeight: ancha ? 52 : 38 }}>
                Que no se te pase ningún cambio de tu vehículo.
              </Text>
              <Text style={{ fontSize: 17, color: c.textoSuave, lineHeight: 26 }}>
                AlDía calcula el desgaste del aceite, los frenos, las llantas y cada parte de tu moto o carro según los
                kilómetros y el tiempo, y te avisa cuándo toca cambiarla. También te recuerda el SOAT, la revisión
                técnico-mecánica y el impuesto antes de que venzan.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                <Boton titulo="Crear cuenta gratis" tipo="primario" onPress={() => router.push('/registro')} />
                <Boton titulo="Ya tengo cuenta" onPress={() => router.push('/login')} />
              </View>
              <Text style={{ color: c.textoSuave, fontSize: 13 }}>Funciona en el celular y en el computador.</Text>
            </View>

            {/* Vista previa ilustrativa de cómo se ve un vehículo dentro de la app */}
            <View style={{ flex: ancha ? 0.9 : undefined, width: ancha ? undefined : '100%', maxWidth: 440 }}>
              <VistaPrevia />
            </View>
          </View>
        </View>

        {/* ---------------- El problema ---------------- */}
        <View style={[contenedor, { paddingVertical: 48, gap: 24 }]}>
          <Text style={titulo}>¿Te ha pasado?</Text>
          <View style={rejilla}>
            {PROBLEMAS.map((p) => (
              <View key={p.titulo} style={[tarjeta, columna]}>
                <Ionicons name={p.icono} size={28} color={c.vencida} />
                <Text style={{ fontSize: 17, fontWeight: '700', color: c.texto }}>{p.titulo}</Text>
                <Text style={{ fontSize: 15, color: c.textoSuave, lineHeight: 22 }}>{p.texto}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ---------------- Cómo funciona ---------------- */}
        <View onLayout={guardarPosicion('pasos')} style={{ backgroundColor: c.superficie, paddingVertical: 48 }}>
          <View style={[contenedor, { gap: 24 }]}>
            <Text style={titulo}>Cómo funciona</Text>
            <Text style={subtitulo}>En tres pasos tienes el mantenimiento de tu vehículo bajo control.</Text>
            <View style={rejilla}>
              {PASOS.map((p, i) => (
                <View key={p.titulo} style={[{ gap: 10, padding: 8 }, columna]}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.primario, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: c.primarioTexto, fontSize: 20, fontWeight: '800' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: c.texto }}>{p.titulo}</Text>
                  <Text style={{ fontSize: 15, color: c.textoSuave, lineHeight: 22 }}>{p.texto}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---------------- Funciones ---------------- */}
        <View onLayout={guardarPosicion('funciones')} style={[contenedor, { paddingVertical: 48, gap: 24 }]}>
          <Text style={titulo}>Todo lo que hace por ti</Text>
          <View style={rejilla}>
            {FUNCIONES.map((f) => (
              <View key={f.titulo} style={[tarjeta, columna, { flexDirection: 'row', gap: 14, alignItems: 'flex-start' }]}>
                <View style={{ backgroundColor: c.primarioSuave, borderRadius: 10, padding: 10 }}>
                  <Ionicons name={f.icono} size={24} color={c.primario} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: c.texto }}>{f.titulo}</Text>
                  <Text style={{ fontSize: 14.5, color: c.textoSuave, lineHeight: 21 }}>{f.texto}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ---------------- Estados con colores ---------------- */}
        <View style={{ backgroundColor: c.superficie, paddingVertical: 48 }}>
          <View style={[contenedor, { gap: 24 }]}>
            <Text style={titulo}>Los colores te dicen qué hacer</Text>
            <Text style={subtitulo}>Cada parte muestra su desgaste con una barra y un color.</Text>
            <View style={rejilla}>
              {ESTADOS.map((e) => (
                <View key={e.estado} style={[tarjeta, columna, { backgroundColor: c.fondo }]}>
                  <Etiqueta estado={ESTADO_PARTE[e.estado]} />
                  <BarraDesgaste porcentaje={e.porcentaje} estado={e.estado} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: c.texto }}>{e.rango}</Text>
                  <Text style={{ fontSize: 15, color: c.textoSuave }}>{e.texto}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---------------- Llamado final ---------------- */}
        <View style={[contenedor, { paddingVertical: 48 }]}>
          <View style={{ backgroundColor: c.primario, borderRadius: 18, padding: ancha ? 40 : 24, alignItems: 'center', gap: 14 }}>
            <Text style={{ fontSize: ancha ? 28 : 22, fontWeight: '800', color: c.primarioTexto, textAlign: 'center' }}>
              Empieza hoy a llevar el mantenimiento al día
            </Text>
            <Text style={{ fontSize: 16, color: c.primarioTexto, opacity: 0.9, textAlign: 'center' }}>
              Crear tu cuenta toma menos de un minuto.
            </Text>
            <Boton titulo="Crear cuenta gratis" onPress={() => router.push('/registro')} />
          </View>
        </View>

        {/* ---------------- Pie de página ---------------- */}
        <View style={{ borderTopWidth: 1, borderTopColor: c.borde, paddingVertical: 24 }}>
          <View style={[contenedor, { alignItems: 'center', gap: 8 }]}>
            <Logo tamano={18} />
            <Text style={{ color: c.textoSuave, fontSize: 13, textAlign: 'center' }}>
              Proyecto formativo del SENA · Tecnólogo en Análisis y Desarrollo de Software (ADSO) · Ficha 3407177
            </Text>
            <Text style={{ color: c.textoSuave, fontSize: 13 }}>Simon Higuera y Santiago Higuera · 2026</Text>
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
