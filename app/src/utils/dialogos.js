// Ventanas de confirmación ("¿Seguro que quieres eliminar…?").
// En el celular se usa la alerta nativa; en el navegador, la del navegador
// (Alert.alert con botones no funciona en la web).
import { Alert, Platform } from 'react-native';

/**
 * Pregunta y devuelve true si el usuario acepta.
 *   if (await confirmar('Eliminar', '¿Seguro?')) { ... }
 */
export function confirmar(titulo, mensaje, textoAceptar = 'Aceptar') {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  return new Promise((resolver) => {
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
      { text: textoAceptar, style: 'destructive', onPress: () => resolver(true) },
    ], { cancelable: true, onDismiss: () => resolver(false) });
  });
}

/** Muestra un mensaje simple. */
export function avisar(titulo, mensaje) {
  if (Platform.OS === 'web') window.alert(`${titulo}\n\n${mensaje}`);
  else Alert.alert(titulo, mensaje);
}
