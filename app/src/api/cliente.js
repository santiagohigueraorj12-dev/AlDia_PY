// =====================================================================
// Cliente de la API: TODAS las llamadas al backend pasan por aquí.
// Agrega el token JWT y convierte los errores del servidor en excepciones.
//
// La app corre en el celular (Android/iOS) y en el computador (navegador).
// Las pocas diferencias entre ambos están aquí, marcadas con ES_WEB.
// =====================================================================
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ES_WEB = Platform.OS === 'web';

/**
 * Dirección del backend (puerto 4000).
 *  - En el navegador: el mismo computador desde el que se abrió la página.
 *  - En el celular: "localhost" sería el propio celular, así que se usa la IP
 *    del computador donde corre Expo (misma red Wi-Fi).
 * Se puede forzar otra dirección con EXPO_PUBLIC_API_URL en el archivo app/.env
 */
function calcularServidor() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (ES_WEB) return `http://${window.location.hostname}:4000`;
  const ipComputador = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${ipComputador || 'localhost'}:4000`;
}

export const SERVIDOR = calcularServidor();

/** URL completa de un archivo subido (ej.: la foto de un vehículo). */
export function urlArchivo(ruta) {
  return ruta ? `${SERVIDOR}${ruta}` : null;
}

// --- Token de sesión ---
// En el celular se guarda cifrado con SecureStore (RNF-01).
// En el navegador SecureStore no existe y se usa el almacenamiento del navegador.
// Además se mantiene una copia en memoria para no leerlo en cada petición.
const CLAVE_TOKEN = 'aldia_token';
let tokenEnMemoria = null;

export async function cargarToken() {
  tokenEnMemoria = ES_WEB ? localStorage.getItem(CLAVE_TOKEN) : await SecureStore.getItemAsync(CLAVE_TOKEN);
  return tokenEnMemoria;
}

export async function guardarToken(token) {
  tokenEnMemoria = token;
  if (ES_WEB) {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } else if (token) {
    await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  } else {
    await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  }
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
  } catch (error) {
    // Al final va el detalle técnico: sirve para saber qué falló exactamente
    throw new ErrorApi(`No se pudo conectar con el servidor (${SERVIDOR}). Revisa que el backend esté encendido${ES_WEB ? '' : ' y que el celular esté en la misma red Wi-Fi'}. Detalle: ${error.message}`, 0);
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
 * Convierte el archivo elegido (foto o PDF) en lo que espera un FormData.
 *  - En el navegador, el selector entrega un File real (archivo.web).
 *  - En el celular se usa File de expo-file-system, que funciona como un archivo
 *    real (un Blob). Desde Expo SDK 54 el fetch del celular es el de Expo y ya
 *    no acepta el formato antiguo de React Native { uri, name, type }.
 */
export function archivoParaFormulario(archivo) {
  if (archivo.web) return archivo.web;
  return new File(archivo.uri);
}

/**
 * Descarga un PDF protegido (ej.: la hoja de vida).
 *  - En el celular abre el menú "Compartir" (WhatsApp, correo, guardar…).
 *  - En el navegador lo descarga como cualquier archivo.
 */
export async function descargarYCompartir(ruta, nombreArchivo) {
  if (ES_WEB) {
    const respuesta = await fetch(`${SERVIDOR}/api${ruta}`, { headers: { Authorization: `Bearer ${tokenEnMemoria}` } });
    if (!respuesta.ok) throw new ErrorApi('No se pudo descargar el archivo', respuesta.status);
    const url = URL.createObjectURL(await respuesta.blob());
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(url);
    return;
  }
  const destino = new File(Paths.cache, nombreArchivo);
  if (destino.exists) destino.delete();
  const archivo = await File.downloadFileAsync(`${SERVIDOR}/api${ruta}`, destino, {
    headers: { Authorization: `Bearer ${tokenEnMemoria}` },
  });
  await Sharing.shareAsync(archivo.uri, { mimeType: 'application/pdf', dialogTitle: nombreArchivo });
}
