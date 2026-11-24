// Pestañas de la app (con sesión iniciada).
// Computador: la barra va ARRIBA (logo, pestañas, alertas, tema y cuenta) y no hay encabezado aparte.
// Celular: las pestañas van ABAJO y cada pantalla tiene su encabezado con alertas, tema y cuenta.
// Ver components/BarraPestanas.js.
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api } from '../../api/cliente';
import { useSesion } from '../../context/SesionContext';
import { useColores } from '../../tema';
import { FondoEncabezado } from '../../components/Decoracion';
import BarraPestanas, { AccionesEncabezado } from '../../components/BarraPestanas';
import LogoAlDia from '../../components/LogoAlDia';

/** Ícono de una pestaña. */
const icono = (nombre) => ({ color, size }) => <Ionicons name={nombre} color={color} size={size} />;

/** Desde este ancho la barra de pestañas va arriba. */
const ANCHO_BARRA_ARRIBA = 900;

export default function PestanasLayout() {
  const { usuario } = useSesion();
  const c = useColores();
  const ruta = usePathname();
  const { width } = useWindowDimensions();
  const arriba = width >= ANCHO_BARRA_ARRIBA;
  const [noLeidas, setNoLeidas] = useState(0);

  // Número de notificaciones sin leer: se actualiza al cambiar de pantalla y cada minuto
  useEffect(() => {
    const cargar = () => api('/notificaciones/contador').then((r) => setNoLeidas(r.noLeidas)).catch(() => {});
    cargar();
    const intervalo = setInterval(cargar, 60000);
    return () => clearInterval(intervalo);
  }, [ruta]);

  return (
    <Tabs
      tabBar={(props) => <BarraPestanas {...props} arriba={arriba} noLeidas={noLeidas} ruta={ruta} ancho={width} />}
      screenOptions={{
        tabBarPosition: arriba ? 'top' : 'bottom',
        // En el computador la barra de arriba reemplaza al encabezado
        headerShown: !arriba,
        headerBackground: () => <FondoEncabezado />,
        headerTintColor: c.sobreDegradado,
        headerTitleStyle: { fontWeight: '800' },
        headerRight: () => <AccionesEncabezado noLeidas={noLeidas} ruta={ruta} />,
        sceneStyle: { backgroundColor: c.fondo },
      }}
    >
      {/* En Inicio el encabezado del celular muestra el logo oficial en vez del texto */}
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerTitle: () => <LogoAlDia tamano={20} color={c.sobreDegradado} colorDia={c.esOscuro ? '#ffd166' : c.primario} />, tabBarIcon: icono('home') }} />
      <Tabs.Screen name="vehiculos" options={{ title: 'Vehículos', tabBarIcon: icono('car-sport') }} />
      <Tabs.Screen name="danos" options={{ title: 'Daños', headerTitle: 'Daños de mis vehículos', tabBarIcon: icono('warning') }} />
      <Tabs.Screen name="documentos" options={{ title: 'Docs', headerTitle: 'Documentación', tabBarIcon: icono('document-text') }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario', tabBarIcon: icono('calendar') }} />
      {/* No son pestañas: se abren con la campana y con el círculo de la cuenta */}
      <Tabs.Screen name="notificaciones" options={{ title: 'Alertas', headerTitle: 'Notificaciones' }} />
      <Tabs.Screen name="cuenta" options={{ title: 'Cuenta', headerTitle: 'Mi cuenta' }} />
      {/* La pestaña de administración solo se ve si el usuario es administrador */}
      <Tabs.Screen
        name="admin"
        options={{ title: 'Admin', headerTitle: 'Administración', tabBarIcon: icono('settings'), href: usuario?.rol === 'admin' ? undefined : null }}
      />
    </Tabs>
  );
}
