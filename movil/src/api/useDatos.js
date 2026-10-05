// Hook para cargar datos de la API en una pantalla.
// Recarga cada vez que la pantalla vuelve a verse (por ejemplo, al cerrar
// la ventana de "Registrar cambio"), así los datos nunca quedan viejos.
//
//   const { datos, error, refrescar, refrescando } = useDatos('/panel');
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from './cliente';

export function useDatos(ruta) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setDatos(await api(ruta));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [ruta]);

  // useFocusEffect: se ejecuta cada vez que la pantalla queda visible
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  // Para "deslizar hacia abajo para actualizar"
  async function refrescar() {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  return { datos, setDatos, error, cargar, refrescar, refrescando };
}
