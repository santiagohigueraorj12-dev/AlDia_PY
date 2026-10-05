// =====================================================================
// Cliente de la API: TODAS las llamadas al backend pasan por aquí.
// Agrega el token JWT y convierte los errores del servidor en excepciones.
// =====================================================================
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Dirección del backend.
 * En el celular "localhost" es el propio celular, así que se usa la IP del
 * computador donde corre Expo (la misma red Wi-Fi). Se puede forzar otra
 * dirección con la variable EXPO_PUBLIC_API_URL en el archivo movil/.env
 */
function calcularServidor() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const ipComputador = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${ipComputador || 'localhost'}:4000`;
}

export const SERVIDOR = calcularServidor();

/** URL completa de un archivo subido (ej.: la foto de un vehículo). */
export function urlArchivo(ruta) {
  return ruta ? `${SERVIDOR}${ruta}` : null;
}

// --- Token de sesión ---
// Se guarda cifrado en el celular con SecureStore (RNF-01) y se mantiene
// una copia en memoria para no leerlo en cada petición.
const CLAVE_TOKEN = 'aldia_token';
let tokenEnMemoria = null;

export async function cargarToken() {
  tokenEnMemoria = await SecureStore.getItemAsync(CLAVE_TOKEN);
  return tokenEnMemoria;
}

export async function guardarToken(token) {
  tokenEnMemoria = token;
  if (token) await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  else await SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

// Se llama cuando el backend responde 401 (sesión vencida). La define SesionContext.
let alExpirarSesion = () => {};
export function definirAlExpirarSesion(funcion) {
  alExpirarSesion = funcion;
}

/** Error que trae el mensaje y los datos que respondió el backend. */
export class ErrorApi extends Error {
  constructor(mensaje, status, datos) {
    super(mensaje);
    this.status = status;
    this.datos = datos || {};
  }
}

/**
 * Llama a la API.
 *   api('/vehiculos')                                     -> GET
 *   api('/vehiculos/1/kilometraje', { metodo: 'POST', datos: { km: 15000 } })
 *   api('/vehiculos', { metodo: 'POST', formulario })     -> envía archivos (FormData)
 */
export async function api(ruta, { metodo = 'GET', datos, formulario } = {}) {
  const opciones = { method: metodo, headers: {} };
  if (tokenEnMemoria) opciones.headers.Authorization = `Bearer ${tokenEnMemoria}`;

  if (formulario) {
    opciones.body = formulario;
  } else if (datos !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${SERVIDOR}/api${ruta}`, opciones);
  } catch {
    throw new ErrorApi(`No se pudo conectar con el servidor (${SERVIDOR}). Revisa que el backend esté encendido y que el celular esté en la misma red Wi-Fi.`, 0);
  }

  if (respuesta.status === 401 && tokenEnMemoria) {
    await guardarToken(null);
    alExpirarSesion();
  }

  const esJson = respuesta.headers.get('content-type')?.includes('application/json');
  const cuerpo = esJson ? await respuesta.json() : null;
  if (!respuesta.ok) throw new ErrorApi(cuerpo?.error || 'Ocurrió un error', respuesta.status, cuerpo);
  return cuerpo;
}

/**
 * Prepara un archivo elegido en el celular para enviarlo en un FormData.
 * React Native acepta { uri, name, type } como si fuera un archivo.
 */
export function archivoParaFormulario(archivo) {
  return { uri: archivo.uri, name: archivo.nombre, type: archivo.tipo };
}

/** Descarga un PDF protegido (ej.: la hoja de vida) y abre el menú "Compartir" del celular. */
export async function descargarYCompartir(ruta, nombreArchivo) {
  const destino = new File(Paths.cache, nombreArchivo);
  if (destino.exists) destino.delete();
  const archivo = await File.downloadFileAsync(`${SERVIDOR}/api${ruta}`, destino, {
    headers: { Authorization: `Bearer ${tokenEnMemoria}` },
  });
  await Sharing.shareAsync(archivo.uri, { mimeType: 'application/pdf', dialogTitle: nombreArchivo });
}
