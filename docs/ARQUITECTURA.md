# Arquitectura de AlDía — guía para entender el código

## La idea general

```
 App (Expo)                 Backend (Express)                           MariaDB
┌──────────────┐  HTTP   ┌──────────────────────────────────────────┐   SQL   ┌────────┐
│ app/   ──► api/cliente ─┼─► routes ─► controller ─► service ─► repository ─┼────────►│ aldia  │
└──────────────┘  JSON   │                             │                    │         └────────┘
                         │                             ▼                    │
                         │                       domain/ (reglas puras)     │
                         └──────────────────────────────────────────────────┘
```

El backend está organizado **por capas** (RNF-10). Cada capa tiene una sola responsabilidad:

| Capa | Archivo | Qué hace | Qué NO hace |
|---|---|---|---|
| Rutas | `*.routes.js` | Define la URL, valida los datos de entrada (Zod) y aplica permisos | Lógica |
| Controlador | `*.controller.js` | Lee `req`, llama al servicio y responde con `res.json` | Reglas ni SQL |
| Servicio | `*.service.js` | Aplica las reglas de negocio y coordina; usa transacciones | SQL directo (casi nunca) |
| Repositorio | `*.repository.js` | Consultas SQL | Decidir nada |
| Dominio | `domain/*.js` | Fórmulas y reglas **puras** (sin BD), fáciles de probar | Acceder a la BD |

> **¿Por qué `domain/` aparte?** Porque las reglas importantes (desgaste, estados, alertas) se pueden probar
> sin base de datos ni servidor. Por eso las pruebas unitarias (`backend/tests/`) solo prueban `domain/`.

## Ejemplo: ¿qué pasa al registrar un cambio de aceite?

1. **App** — `app/src/app/vehiculo/[id]/servicio.js` llama a
   `api('/vehiculos/1/servicios', { metodo: 'POST', datos: {...} })`.
2. **Cliente** — `app/src/api/cliente.js` agrega el token JWT y hace el `fetch`.
3. **app.js** — `requiereSesion` verifica el token y deja el usuario en `req.usuario`.
4. **Rutas** — `vehiculos.routes.js` valida con Zod que lleguen fecha, km y al menos una parte.
5. **Controlador** — `vehiculos.controller.js → registrarServicio` llama al servicio.
6. **Servicio** — `vehiculos.service.js → registrarServicio`:
   - verifica que el vehículo sea del usuario (RN-01),
   - valida el km y la fecha (RN-09),
   - guarda el servicio y los cambios **en una transacción** (RNF-07).
7. **Repositorio** — `vehiculos.repository.js → registrarCambio` hace el `INSERT` y pone el
   "último cambio" de la parte en ese km/fecha, así el desgaste vuelve a 0 %.
8. La app vuelve al detalle del vehículo, que se recarga solo (hook `useDatos`) y muestra el desgaste en 0 %.

Si algo falla, el servicio lanza un `AppError('mensaje')`, y `middlewares/errores.js` lo convierte en
`{ "error": "mensaje" }` con su código HTTP. La app lo muestra con `<Aviso>`.

## ¿Dónde se calcula el desgaste?

El desgaste **no se guarda** en la base de datos: se calcula cada vez que se consulta un vehículo, en
`vehiculos.service.js → armarVehiculo()`. Esa función:

1. Calcula el km a usar (`domain/kilometraje.js`): el real, o uno estimado si lleva 15 días sin actualizarse (RN-04).
2. Calcula el desgaste de cada parte (`domain/desgaste.js → calcularDesgaste`): el mayor entre % por km y % por tiempo (RN-07).
3. Ordena las partes por urgencia y calcula el estado del vehículo (`domain/vehiculo.js`, RN-11).

Así el dato nunca queda desactualizado. La **tarea diaria** (`jobs/tareaDiaria.js`) solo existe para
**enviar las alertas**: recorre los vehículos, los "arma" y llama a `notificaciones/alertas.service.js`.

## ¿Cómo se evita enviar la misma alerta dos veces?

Cada notificación tiene una **clave** única por usuario (ej.: `parte:5:2026-04-05:12000:proxima`).
Se inserta con `INSERT IGNORE`, así que si ya existe no pasa nada. Cuando se registra un cambio, la clave
cambia (porque cambian la fecha y el km del último cambio) y la parte vuelve a poder alertar.

## Validación de formularios
Todas las reglas de los formularios usan las piezas de `backend/src/utils/validaciones.js` (`texto`, `entero`, `fecha`,
`correo`…), así que todos validan igual y con mensajes en español. Aceptan números escritos a la colombiana
("15.400", "$38.000").

Cuando algo falla, el backend responde **todos** los errores a la vez, uno por campo:
```json
{ "error": "Revisa los campos marcados.",
  "errores": { "marca": "Escribe la marca", "km_inicial": "Escribe el kilometraje actual" } }
```
La app (`useErrores`) muestra cada mensaje en rojo debajo de su campo. Las reglas de negocio que dependen de la
base de datos (por ejemplo, "el kilometraje no puede ser menor al último registrado") también indican su campo,
con `AppError.campo('km', 'mensaje')`.

## Seguridad
- Contraseñas con **bcrypt**; sesión con **JWT** que expira (RNF-01) — `modules/auth/auth.service.js`.
- Cada consulta filtra por el dueño: `buscarDelUsuario(id, usuarioId)`. Si el vehículo no es tuyo, la
  respuesta es **404**, para no revelar que existe (RNF-02).
- Archivos: solo JPG/PNG/PDF de máximo 5 MB, con nombre aleatorio (RNF-03) — `middlewares/subirArchivo.js`.
- Rutas de administración protegidas con `requiereAdmin`.

## Mapa de la API
| Método | Ruta | Para qué |
|---|---|---|
| POST | `/api/auth/registro` · `/login` · `/recuperar` · `/restablecer` | Cuenta (públicas) |
| GET/PUT/DELETE | `/api/auth/perfil` · `/password` · `/cuenta` | Mi cuenta |
| GET/POST | `/api/vehiculos` | Listar / registrar |
| GET/PUT/DELETE | `/api/vehiculos/:id` | Detalle / editar / eliminar |
| POST/GET | `/api/vehiculos/:id/kilometraje` | Actualizar km / historial |
| POST | `/api/vehiculos/:id/partes` | Agregar parte al plan |
| PUT/DELETE | `/api/partes/:id` · GET `/api/partes/:id/historial` | Ajustar / quitar / historial |
| POST | `/api/vehiculos/:id/servicios/sugerencias` | Sugerencia del filtro (RN-10) |
| POST/GET | `/api/vehiculos/:id/servicios` | Registrar cambio / historial |
| GET | `/api/vehiculos/:id/hoja-de-vida` | PDF |
| POST | `/api/vehiculos/:id/documentos` | Registrar SOAT/RTM/impuesto |
| GET/DELETE | `/api/documentos/:id` · POST `/api/documentos/:id/renovar` | Historial / eliminar / renovar |
| GET | `/api/panel` · `/api/panel/calendario?mes=AAAA-MM` | Panel y calendario |
| GET/POST | `/api/notificaciones` · `/contador` · `/:id/leer` · `/leer-todas` | Notificaciones |
| GET | `/api/asistente/preguntas` · `/api/asistente/vehiculos/:id/:pregunta` | Asistente: lista de preguntas y respuesta sobre un vehículo (RF-21) |
| GET/POST/PUT/DELETE | `/api/admin/...` | Plan base, reglas RTM, usuarios |

## App (app/) — celular y computador
Es **un solo código** que corre en Android, iOS y en el navegador del computador (Expo + React Native Web).
Las pocas diferencias entre celular y computador están aisladas en `src/api/cliente.js` (dónde se guarda el
token y cómo se descarga el PDF), `src/components/CampoFecha.js` (calendario nativo o del navegador) y
`src/utils/dialogos.js` (alertas). Se reconocen porque preguntan `Platform.OS === 'web'`.

Usa **Expo Router**: cada archivo dentro de `src/app/` es una pantalla y su ruta sale del nombre del archivo.

| Archivo | Pantalla |
|---|---|
| `src/app/_layout.js` | Raíz: sesión y qué pantallas se ven con o sin sesión (`Stack.Protected`) |
| `src/app/bienvenida.js` | Página de inicio pública: qué es AlDía, cómo funciona y funciones. Es lo primero que ve quien no ha iniciado sesión |
| `src/app/login.js`, `registro.js`, `recuperar.js` | Cuenta (usan `components/PantallaAutenticacion.js`) |
| `src/app/(tabs)/_layout.js` | Pestañas de abajo: Inicio, Vehículos, Calendario, Alertas, Cuenta (y Admin) |
| `src/app/(tabs)/index.js` | Inicio (panel) |
| `src/app/vehiculo/[id]/index.js` | Detalle del vehículo (`[id]` = número del vehículo) |
| `src/app/vehiculo/[id]/servicio.js` | Registrar cambio |
| `src/app/vehiculo/[id]/ultimos-cambios.js` | "¿Cuándo cambiaste cada parte?" (RN-16): aparece al registrar un vehículo |
| `src/app/vehiculo/[id]/kilometraje.js` · `parte.js` · `documento.js` · `editar.js` | Ventanas de acción |

Piezas clave:
- `src/api/cliente.js` — **único** lugar que habla con el backend. Calcula la dirección del servidor con la IP
  del computador donde corre Expo, y guarda el token cifrado con `expo-secure-store`.
- `src/api/useDatos.js` — carga datos y los **recarga cada vez que la pantalla vuelve a verse**. Por eso, al
  cerrar "Registrar cambio", el detalle del vehículo ya aparece actualizado sin código extra.
- `src/components/ui.js` — botones (con ícono), campos (con `*` de obligatorio y error en rojo), contraseña con botón para verla,
  tarjetas, etiquetas de estado, barra de desgaste y las piezas que hacen la interfaz intuitiva: `Icono` (ícono en círculo
  de color), `IconoVehiculo`, `ElementoLista` (fila tocable con flecha), `Segmentos` (pestañas dentro de una pantalla),
  `Vacio` (lista vacía que explica qué hacer), `Paso` (pasos numerados de un formulario) y `Aviso` con botón de acción.
- `src/utils/tareas.js` — arma la lista "Lo que debes hacer" del Inicio: documentos vencidos, partes vencidas,
  kilometraje sin actualizar y lo que está próximo, cada uno con el botón que lleva a resolverlo.
- `src/components/EncabezadoPublico.js` — barra superior de las pantallas públicas: logo a la izquierda, "Iniciar sesión" y "Crear cuenta" a la derecha.
- `src/components/AsistenteFlotante.js` — botón redondo abajo a la derecha (solo con sesión, en las pestañas y en el
  detalle del vehículo) que abre el chat del asistente. Las respuestas las arma el backend en `domain/asistente.js`
  con los datos del vehículo (RN-17): la app solo muestra las preguntas como botones y pinta la respuesta.
- `src/api/useErrores.js` — reparte los errores que devuelve el backend para mostrar cada uno debajo de su campo.
- `src/tema.js` — colores del modo claro y oscuro (se elige según el celular).
