// Guarda quién inició sesión y lo comparte con toda la app.
// Cualquier pantalla puede usar:  const { usuario, cerrarSesion } = useSesion();
import { createContext, useContext, useEffect, useState } from 'react';
import { api, cargarToken, definirAlExpirarSesion, guardarToken } from '../api/cliente';

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app, si hay un token guardado, se recupera el usuario
  useEffect(() => {
    definirAlExpirarSesion(() => setUsuario(null));
    (async () => {
      try {
        if (await cargarToken()) setUsuario(await api('/auth/perfil'));
      } catch {
        await guardarToken(null);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function iniciarSesion(correo, password) {
    const r = await api('/auth/login', { metodo: 'POST', datos: { correo, password } });
    await guardarToken(r.token);
    setUsuario(r.usuario);
  }

  async function registrarse(datos) {
    const r = await api('/auth/registro', { metodo: 'POST', datos });
    await guardarToken(r.token);
    setUsuario(r.usuario);
  }

  // Con JWT, cerrar sesión es simplemente olvidar el token
  async function cerrarSesion() {
    await guardarToken(null);
    setUsuario(null);
  }

  return (
    <SesionContext.Provider value={{ usuario, setUsuario, cargando, iniciarSesion, registrarse, cerrarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  return useContext(SesionContext);
}
