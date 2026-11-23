// Botón sutil para cambiar entre modo claro y oscuro. Va en la esquina derecha de la
// barra superior. Muestra el modo al que se cambia: luna = pasar a oscuro, sol = pasar a claro.
//
//   <BotonTema />                 sobre la barra azul (ícono blanco)
//   <BotonTema sobreClaro />      sobre una barra blanca (páginas públicas)
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColores, useTema } from '../tema';

export default function BotonTema({ sobreClaro = false }) {
  const c = useColores();
  const { esOscuro, alternar } = useTema();
  // Sobre una barra clara (o el encabezado en modo claro) el ícono es oscuro
  const claro = sobreClaro || !c.esOscuro;
  const colorIcono = claro ? c.texto : '#ffffff';
  const fondo = claro ? c.superficie2 : 'rgba(255, 255, 255, 0.16)';
  return (
    <Pressable
      onPress={alternar}
      accessibilityRole="button"
      accessibilityLabel={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      hitSlop={8}
      style={({ pressed, hovered }) => ({
        width: 36, height: 36, borderRadius: 18, marginHorizontal: sobreClaro ? 0 : 12,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: fondo, opacity: pressed ? 0.6 : hovered ? 0.85 : 1,
      })}
    >
      <Ionicons name={esOscuro ? 'sunny-outline' : 'moon-outline'} size={19} color={colorIcono} />
    </Pressable>
  );
}
