// RF-04: registrar un vehículo nuevo.
import { router } from 'expo-router';
import FormularioVehiculo from '../../components/FormularioVehiculo';

export default function NuevoVehiculo() {
  // RN-16: al guardar, se pregunta cuándo se cambió por última vez cada parte
  return <FormularioVehiculo onGuardado={(v) => router.replace(`/vehiculo/${v.id}/ultimos-cambios?nuevo=1`)} />;
}
