// Ventanas de confirmación ("¿Seguro que quieres eliminar…?").
import { Alert } from 'react-native';

/**
 * Pregunta y devuelve true si el usuario acepta.
 *   if (await confirmar('Eliminar', '¿Seguro?')) { ... }
 */
export function confirmar(titulo, mensaje, textoAceptar = 'Aceptar') {
  return new Promise((resolver) => {
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
      { text: textoAceptar, style: 'destructive', onPress: () => resolver(true) },
    ], { cancelable: true, onDismiss: () => resolver(false) });
  });
}

/** Muestra un mensaje simple. */
export function avisar(titulo, mensaje) {
  Alert.alert(titulo, mensaje);
}
