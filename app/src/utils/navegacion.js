// Volver a la pantalla anterior.
// En el navegador alguien puede abrir directamente una URL (o recargar la página)
// y entonces no hay "pantalla anterior". En ese caso se va a la ruta indicada.
import { router } from 'expo-router';

export function volver(rutaSiNoHayAnterior = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(rutaSiNoHayAnterior);
}
