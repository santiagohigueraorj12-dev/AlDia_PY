// Hook para manejar los errores de un formulario.
// El backend responde los errores por campo:  { errores: { marca: "Escribe la marca", ... } }
// y este hook los guarda para mostrar cada uno debajo de su campo.
//
//   const { errores, general, mostrar, limpiar, reiniciar } = useErrores();
//   try { ... } catch (e) { mostrar(e); }
//   <Campo error={errores.marca} onChangeText={(t) => { setMarca(t); limpiar('marca'); }} />
//   <Aviso>{general}</Aviso>
import { useState } from 'react';

export function useErrores() {
  const [errores, setErrores] = useState({});   // { campo: 'mensaje' }
  const [general, setGeneral] = useState('');   // mensaje para arriba del formulario

  /** Recibe el error que lanzó api() y lo reparte por campos. */
  function mostrar(error) {
    const porCampo = error?.datos?.errores || {};
    setErrores(porCampo);
    const cuantos = Object.keys(porCampo).length;
    // Si el error es de un campo, ya se ve debajo de él; arriba solo un resumen.
    if (cuantos > 1) setGeneral('Revisa los campos marcados en rojo.');
    else if (cuantos === 1) setGeneral('');
    else setGeneral(error?.message || 'Ocurrió un error');
  }

  /** Quita el error de un campo (se llama cuando el usuario lo corrige). */
  function limpiar(campo) {
    setErrores((actuales) => {
      if (!actuales[campo]) return actuales;
      const { [campo]: _quitado, ...resto } = actuales;
      return resto;
    });
  }

  function reiniciar() {
    setErrores({});
    setGeneral('');
  }

  /** Marca un error en un campo desde la app (sin esperar al backend). */
  function marcar(campo, mensaje) {
    setErrores((actuales) => ({ ...actuales, [campo]: mensaje }));
  }

  return { errores, general, mostrar, limpiar, reiniciar, marcar, setGeneral };
}

/**
 * Todos los errores en un solo texto, para pantallas sin campos individuales
 * (por ejemplo, la tabla del plan base en Administración).
 */
export function mensajeCompleto(error) {
  const porCampo = error?.datos?.errores;
  if (porCampo && Object.keys(porCampo).length) return Object.values(porCampo).join('. ');
  return error?.message || 'Ocurrió un error';
}
