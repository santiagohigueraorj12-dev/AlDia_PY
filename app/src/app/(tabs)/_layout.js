// Pestañas de la parte inferior de la app.
import { useEffect, useState } from 'react';
import { Tabs, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api } from '../../api/cliente';
import { useSesion } from '../../context/SesionContext';
import { useColores } from '../../tema';
import { FondoEncabezado } from '../../components/Decoracion';
import BotonTema from '../../components/BotonTema';
import LogoAlDia from '../../components/LogoAlDia';

/** Ícono de una pestaña. */
const icono = (nombre) => ({ color, size }) => <Ionicons name={nombre} color={color} size={size} />;

export default function PestanasLayout() {
  const { usuario } = useSesion();
  const c = useColores();
  const ruta = usePathname();
  const [noLeidas, setNoLeidas] = useState(0);

  // Número de notificaciones sin leer: se actualiza al cambiar de pestaña y cada minuto
  useEffect(() => {
    const cargar = () => api('/notificaciones/contador').then((r) => setNoLeidas(r.noLeidas)).catch(() => {});
    cargar();
    const intervalo = setInterval(cargar, 60000);
    return () => clearInterval(intervalo);
  }, [ruta]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primario,
        tabBarInactiveTintColor: c.textoSuave,
        tabBarStyle: { backgroundColor: c.superficie, borderTopColor: c.borde, boxShadow: `0 -4px 16px ${c.sombra}` },
        tabBarLabelStyle: { fontWeight: '700' },
        // Barra de arriba en degradado azul con letras blancas
        headerBackground: () => <FondoEncabezado />,
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '800' },
        headerRight: () => <BotonTema />,  // botón de sol / luna en la esquina derecha
        sceneStyle: { backgroundColor: c.fondo },
      }}
    >
      {/* En Inicio la barra azul muestra el logo oficial en vez del texto */}
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerTitle: () => <LogoAlDia tamano={20} color="#ffffff" colorDia="#ffd166" />, tabBarIcon: icono('home') }} />
      <Tabs.Screen name="vehiculos" options={{ title: 'Vehículos', tabBarIcon: icono('car-sport') }} />
      <Tabs.Screen name="documentos" options={{ title: 'Docs', headerTitle: 'Documentación', tabBarIcon: icono('document-text') }} />
      <Tabs.Screen name="calendario" options={{ title: 'Calendario', tabBarIcon: icono('calendar') }} />
      <Tabs.Screen
        name="notificaciones"
        options={{ title: 'Alertas', headerTitle: 'Notificaciones', tabBarIcon: icono('notifications'), tabBarBadge: noLeidas > 0 ? noLeidas : undefined }}
      />
      <Tabs.Screen name="cuenta" options={{ title: 'Cuenta', headerTitle: 'Mi cuenta', tabBarIcon: icono('person') }} />
      {/* La pestaña de administración solo se ve si el usuario es administrador */}
      <Tabs.Screen
        name="admin"
        options={{ title: 'Admin', headerTitle: 'Administración', tabBarIcon: icono('settings'), href: usuario?.rol === 'admin' ? undefined : null }}
      />
    </Tabs>
  );
}
