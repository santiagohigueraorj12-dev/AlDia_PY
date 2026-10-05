// Pestañas de la parte inferior de la app.
import { useEffect, useState } from 'react';
import { Tabs, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { api } from '../../api/cliente';
import { useSesion } from '../../context/SesionContext';
import { useColores } from '../../tema';

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
        tabBarStyle: { backgroundColor: c.superficie, borderTopColor: c.borde },
        headerStyle: { backgroundColor: c.superficie },
        headerTintColor: c.texto,
        headerTitleStyle: { fontWeight: '700' },
        sceneStyle: { backgroundColor: c.fondo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', headerTitle: 'AlDía', tabBarIcon: icono('home') }} />
      <Tabs.Screen name="vehiculos" options={{ title: 'Vehículos', tabBarIcon: icono('car-sport') }} />
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
