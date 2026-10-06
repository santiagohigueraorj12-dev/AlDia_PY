// RF-04: registrar un vehículo nuevo.
import { router } from 'expo-router';
import FormularioVehiculo from '../../components/FormularioVehiculo';

export default function NuevoVehiculo() {
  // Al guardar, se reemplaza esta pantalla por el detalle del vehículo creado
  return <FormularioVehiculo onGuardado={(v) => router.replace(`/vehiculo/${v.id}`)} />;
}
