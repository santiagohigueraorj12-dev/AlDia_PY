// RF-04: editar los datos de un vehículo.
import { router, useLocalSearchParams } from 'expo-router';
import { useDatos } from '../../../api/useDatos';
import { Aviso, Cargando, Pantalla } from '../../../components/ui';
import FormularioVehiculo from '../../../components/FormularioVehiculo';

export default function EditarVehiculo() {
  const { id } = useLocalSearchParams();
  const { datos: vehiculo, error } = useDatos(`/vehiculos/${id}`);

  if (error) return <Pantalla><Aviso>{error}</Aviso></Pantalla>;
  if (!vehiculo) return <Cargando />;
  return <FormularioVehiculo vehiculo={vehiculo} onGuardado={() => router.back()} />;
}
