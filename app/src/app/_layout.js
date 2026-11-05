// =====================================================================
// Raíz de la app: sesión + mapa de pantallas.
// Con Expo Router cada archivo dentro de src/app/ es una pantalla:
//   src/app/login.js              -> /login
//   src/app/(tabs)/index.js       -> /           (pestaña Inicio)
//   src/app/vehiculo/[id]/index.js -> /vehiculo/5
// =====================================================================
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SesionProvider, useSesion } from '../context/SesionContext';
import { Cargando } from '../components/ui';
import AsistenteFlotante from '../components/AsistenteFlotante';
import { useColores } from '../tema';

function Navegacion() {
  const { usuario, cargando } = useSesion();
  const c = useColores();
  if (cargando) return <Cargando />;

  const opciones = {
    headerStyle: { backgroundColor: c.superficie },
    headerTintColor: c.texto,
    headerTitleStyle: { fontWeight: '700' },
    contentStyle: { backgroundColor: c.fondo },
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={opciones}>
        {/* Solo con sesión iniciada */}
        <Stack.Protected guard={Boolean(usuario)}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="vehiculo/nuevo" options={{ title: 'Registrar vehículo', presentation: 'modal' }} />
          <Stack.Screen name="vehiculo/[id]/index" options={{ title: 'Vehículo' }} />
          <Stack.Screen name="vehiculo/[id]/editar" options={{ title: 'Editar vehículo', presentation: 'modal' }} />
          <Stack.Screen name="vehiculo/[id]/kilometraje" options={{ title: 'Kilometraje', presentation: 'modal' }} />
          <Stack.Screen name="vehiculo/[id]/servicio" options={{ title: 'Registrar cambio', presentation: 'modal' }} />
          <Stack.Screen name="vehiculo/[id]/parte" options={{ title: 'Parte', presentation: 'modal' }} />
          <Stack.Screen name="vehiculo/[id]/documento" options={{ title: 'Documento', presentation: 'modal' }} />
          <Stack.Screen name="vehiculo/[id]/ultimos-cambios" options={{ title: 'Último cambio de las partes', presentation: 'modal' }} />
        </Stack.Protected>

        {/* Solo sin sesión. "bienvenida" va primero: es lo que ve quien entra sin haber iniciado sesión */}
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="bienvenida" options={{ headerShown: false, title: 'AlDía' }} />
          <Stack.Screen name="login" options={{ headerShown: false, title: 'Iniciar sesión' }} />
          <Stack.Screen name="registro" options={{ headerShown: false, title: 'Crear cuenta' }} />
          <Stack.Screen name="recuperar" options={{ headerShown: false, title: 'Recuperar contraseña' }} />
        </Stack.Protected>
      </Stack>

      {/* Botón flotante del asistente (RF-21): solo con sesión iniciada */}
      {usuario && <AsistenteFlotante />}
    </View>
  );
}

export default function RaizApp() {
  return (
    <SesionProvider>
      <StatusBar style="auto" />
      <Navegacion />
    </SesionProvider>
  );
}
