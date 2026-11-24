# AlDía – Alcance del proyecto (versión enfocada)

> Versión 2.0 (13/11/2026): corregida y ajustada a la aplicación real. La especificación completa, con la matriz de trazabilidad, está en `docs/requisitos/`.

> **"Que no se te pase ningún cambio de tu vehículo."**

AlDía es una aplicación para celular y computador que ayuda a las personas a llevar al día el **mantenimiento de sus motos y carros**:
calcula el desgaste de cada parte según los kilómetros y el tiempo, avisa cuándo toca cada cambio, registra lo que se
gasta en mantenimiento y controla el vencimiento de los documentos del vehículo (SOAT, revisión técnico-mecánica e impuesto).

## Qué incluye
- Registro de motos y carros con su kilometraje.
- Plan de partes por vehículo, cálculo de desgaste, alertas y registro de cambios.
- Costo de mantenimiento y costo por kilómetro.
- Documentos del vehículo con fecha de vencimiento: SOAT, revisión técnico-mecánica (RTM) e impuesto.
- Módulo de documentación que agrupa SOAT, RTM e impuesto por vehículo y resalta documentos faltantes, vencidos o próximos a vencer.
- Panel, calendario mensual, notificaciones y hoja de vida del vehículo en PDF.
- Administración del plan base de partes, de las reglas de la RTM y de los usuarios.

## Qué NO incluye
- Pagos de servicios públicos, suscripciones o cuotas (quedan fuera para mantener un solo enfoque).
- Pagos en línea o conexión con el RUNT (los datos se registran a mano).
- Lectura automática del kilometraje por GPS.
- Diagnóstico mecánico: el sistema dice **cuándo** toca un cambio, no diagnostica fallas.

## Actores
| Actor | Descripción |
|---|---|
| Usuario | Registra sus vehículos, kilometraje, cambios de partes y documentos. |
| Administrador | Gestiona el plan base de partes, las reglas de la RTM y activa/desactiva usuarios. |
| Sistema | Tarea automática diaria que recalcula el desgaste, estima el kilometraje y envía alertas. |

## Reglas de negocio
| Código | Regla | Dónde está en el código |
|---|---|---|
| RN-01 | Cada usuario solo ve y modifica sus propios vehículos. | `vehiculos.service.js` → `vehiculoDelUsuario()` |
| RN-02 | El sistema maneja motos y carros. La placa es única. | BD (`UNIQUE`) + `vehiculos.service.js` |
| RN-03 | El kilometraje nunca puede ser menor al último registrado. Si sube más de 1.500 km en menos de un día, se pide confirmación. | `domain/kilometraje.js` |
| RN-04 | Si el kilometraje no se actualiza en 15 días, se estima con el promedio diario de uso y se le pide al usuario que lo actualice. | `domain/kilometraje.js` |
| RN-05 | Al registrar un vehículo se carga el plan base de su tipo. El usuario puede agregar o quitar partes y ajustar los intervalos, pero no dejarlos en cero. | `vehiculos.repository.js` + validación |
| RN-06 | Cada parte se cambia por km o por tiempo, lo que ocurra primero. Las partes sin intervalo de km se controlan solo por tiempo. | `domain/desgaste.js` |
| RN-07 | El desgaste es el mayor entre: % de km recorridos desde el último cambio y % de días transcurridos. | `domain/desgaste.js` |
| RN-08 | Estados: **Bien** (< 80 %), **Próxima a cambio** (80–99 %, se envía alerta) y **Vencida** (≥ 100 %, alerta que se repite cada 3 días). | `domain/desgaste.js` + `alertas.service.js` |
| RN-09 | Un cambio guarda fecha, km, costo, marca/referencia y lugar. El km no puede ser mayor al actual del vehículo ni menor al del cambio anterior. El desgaste vuelve a 0 %. | `vehiculos.service.js` → `registrarServicio()` |
| RN-10 | Si se cambia el aceite y el filtro de aceite tiene 50 % o más de desgaste, se sugiere cambiarlo en el mismo servicio. | `domain/desgaste.js` |
| RN-11 | Vehículo con SOAT o RTM vencidos → **No apto para circular**. Con pastillas de freno o llantas vencidas → **Requiere atención**. | `domain/vehiculo.js` |
| RN-12 | Costo por km = suma de los costos de los cambios ÷ km recorridos desde que se registró el vehículo. | `domain/vehiculo.js` |
| RN-13 | Las alertas de documentos se envían 30, 7 y 1 día antes del vencimiento, y el mismo día. | `domain/documentos.js` |
| RN-14 | La fecha de la primera RTM se calcula con la fecha de matrícula y la regla del tipo de vehículo (motos 2 años, carros 5), que configura el Administrador. | `domain/vehiculo.js` |
| RN-15 | Al renovar un documento se conserva el historial. La nueva fecha de vencimiento debe ser posterior a la anterior. | `domain/documentos.js` |
| RN-16 | Al registrar un vehículo, cada parte se cuenta desde la matrícula (0 km y fecha de matrícula), como si nunca se hubiera cambiado. El usuario puede indicar el km y la fecha de su último cambio real: el km no puede pasar del actual y la fecha no puede ser futura ni anterior a la matrícula. Solo se puede indicar mientras la parte no tenga cambios registrados en la app. | `domain/desgaste.js` → `validarUltimoCambio()` |
| RN-17 | El asistente funciona con reglas definidas: sus preguntas son fijas y cada respuesta se arma solo con los datos registrados del vehículo elegido (desgaste, documentos, costos y kilometraje), uno a la vez. Si falta un dato, lo dice en vez de inventarlo. No usa internet ni servicios externos. | `domain/asistente.js` |
| RN-18 | Datos del perfil: todos son opcionales. El usuario debe tener al menos 16 años; el tipo y el número de documento van juntos (la cédula y la tarjeta de identidad solo tienen números); la categoría y el vencimiento de la licencia van juntos y la licencia no puede vencer en más de 10 años. La licencia muestra su estado igual que un documento (vigente, por vencer a 30 días o vencida) y aparece en "Lo que debes hacer" cuando está por vencer o vencida. | `domain/perfil.js` |
| RN-19 | Salud del vehículo de 0 a 100 %: partes (bien 100, próxima 50, vencida 0) pesan 70 % y documentos (vigente 100, por vencer 50, vencido 0) 30 %. No contradice el estado: no apto, máximo 49 %; requiere atención, máximo 79 %. Verde desde 80 %. | `domain/salud.js` |
| RN-20 | Revisión de una parte ("Revisé y está bien"): el usuario elige el mes de la próxima revisión (del mes siguiente hasta 36 meses). Hasta el día 1 de ese mes la parte está bien y su barra avanza con el tiempo (80 %: próxima; el día elegido: vencida, toca revisarla). No es un cambio: sin costo, no borra el último cambio y los km no cuentan. Un cambio posterior anula la revisión. | `domain/desgaste.js` → `validarMesRevision()`, `calcularDesgaste()` |
| RN-21 | Una novedad (daño, falla o golpe) pendiente pone el vehículo en "requiere atención" (salvo que sea no apto). Fecha y km no futuros ni mayores al actual; el arreglo no puede ser antes de la novedad. Al arreglar una novedad de una parte del plan se registra el cambio de esa parte; si no, el costo queda en la novedad. | `domain/vehiculo.js` → `estadoVehiculo()` |
| RN-22 | Las motos de hasta 125 cc no pagan impuesto vehicular (Ley 488 de 1998, art. 141): con el cilindraje registrado, no se les pide el impuesto. | `domain/vehiculo.js` → `exentoDeImpuesto()` |
| RN-23 | Transferir un vehículo: contraseña del dueño y correo de una cuenta activa distinta; pasa con todo su historial y el nuevo dueño recibe una notificación. | `vehiculos.service.js` → `transferir()` |

## Requisitos funcionales
**Usuarios**
- RF-01: Registrarse con nombre, correo, contraseña y autorización de tratamiento de datos (los demás datos se completan después en el perfil).
- RF-02: Iniciar sesión, cerrar sesión y recuperar la contraseña con un código de un solo uso que vence en 1 hora. Como el sistema no envía correos, el código queda en la consola del backend (el administrador se lo entrega al usuario); en desarrollo la pantalla lo muestra directamente.
- RF-03: Completar y editar el perfil (teléfono, documento de identidad, fecha de nacimiento, departamento, ciudad, dirección y licencia de conducción), cambiar la contraseña y eliminar la cuenta.

**Vehículos y partes**
- RF-04: Registrar, editar y eliminar vehículos (tipo, marca, línea y modelo —el año del vehículo—, placa, fecha de matrícula, km inicial y foto).
- RF-05: Actualizar el kilometraje y ver su historial.
- RF-06: Ver las partes con su % de desgaste y estado, de la más a la menos urgente.
- RF-07: Agregar y quitar partes del plan, ajustar sus intervalos e indicar cuándo fue su último cambio.
- RF-08: Registrar un servicio con el cambio de una o varias partes.
- RF-09: Consultar el historial de cambios de cada vehículo y de cada parte.
- RF-10: Ver el costo total de mantenimiento y el costo por kilómetro.
- RF-11: Descargar la hoja de vida del vehículo en PDF.

**Documentos**
- RF-12: Registrar el SOAT, la RTM y el impuesto con su fecha de vencimiento, valor y archivo adjunto.
- RF-13: Renovar un documento y consultar su historial.

**Panel y notificaciones**
- RF-14: Panel de inicio con el estado de cada vehículo, las partes próximas o vencidas, un resumen de documentos faltantes, vencidos o próximos (con acceso al módulo de documentación) y el gasto del mes.
- RF-15: Calendario mensual con los cambios de partes estimados y los vencimientos de documentos.
- RF-16: Notificaciones dentro de la aplicación, que se pueden marcar como leídas.

**Administración**
- RF-17: Gestionar el plan base de partes de cada tipo de vehículo.
- RF-18: Gestionar las reglas de la primera RTM.
- RF-19: Listar, activar y desactivar usuarios.

**Proceso automático**
- RF-20: Cada día (y al iniciar el servidor) recalcular el desgaste, estimar el kilometraje y generar las alertas.

**Correos, privacidad e indicadores (v2.2)**
- RF-22: Recibir por correo un resumen diario con las alertas nuevas.
- RF-23: Descargar todos mis datos en un archivo JSON (sin contraseñas ni códigos).
- RF-24: Consultar la política de tratamiento de datos (Ley 1581) antes de registrarse y desde Mi cuenta.
- RF-25: Ver la salud de cada vehículo y de todos en conjunto (anillo de 0 a 100 %, RN-19).
- RF-26: Ver la gráfica de gastos de los últimos 12 meses y en qué se va la plata.
- RF-27: Marcar una parte como revisada en buen estado y elegir el mes de la próxima revisión (aparece en el calendario, RN-20).
- RF-29: Transferir el vehículo a otro usuario de AlDía con todo su historial (RN-23).
- RF-28: Panel de daños (CRUD): registrar, consultar, editar, marcar como arreglados y eliminar los daños del vehículo (falla o golpe, con foto opcional) (RN-21).

**Asistente**
- RF-21: Consultar el asistente de preguntas: un botón flotante abre una ventana donde el usuario elige un vehículo y una de 7 preguntas frecuentes (qué le toca cambiar, si puede circular, cuándo vencen sus documentos, qué viene este mes, cuánto ha gastado, cuánto costará el próximo mantenimiento y cuántos km lleva). Solo con sesión iniciada.

## Requisitos no funcionales
| Código | Tipo | Requisito |
|---|---|---|
| RNF-01 | Seguridad | Contraseñas cifradas con bcrypt; sesión con JWT con expiración. |
| RNF-02 | Seguridad | Cada petición valida que el vehículo pertenezca al usuario. |
| RNF-03 | Seguridad | Adjuntos solo JPG, PNG o PDF de máximo 5 MB. |
| RNF-04 | Usabilidad | Registrar un cambio toma máximo 3 pasos. Estados con colores (verde, amarillo, rojo) y barras de desgaste. |
| RNF-05 | Accesibilidad | Modo claro y oscuro según el celular; contraste WCAG AA. |
| RNF-06 | Compatibilidad | La app funciona en Android e iOS, y en el computador desde Chrome, Edge o Firefox. |
| RNF-07 | Integridad | Registrar un servicio y renovar un documento se hacen en transacciones de la BD. |
| RNF-08 | Localización | Español, pesos colombianos, zona horaria de Bogotá, fechas dd/mm/aaaa. |
| RNF-09 | Privacidad | Ley 1581 de 2012: autorización de datos y opción de eliminar la cuenta. |
| RNF-10 | Mantenibilidad | Backend por capas con las reglas de negocio en funciones independientes; código en Git. |
| RNF-11 | Calidad | Pruebas unitarias de las reglas de desgaste, kilometraje, último cambio, estado del vehículo, documentos, perfil y asistente, y de las funciones de la app. |
| RNF-12 | Instalación | La base de datos se crea y actualiza sola al encender el backend: primero se crean las tablas y luego se aplican las modificaciones del esquema. |
| RNF-13 | Respaldo | La base de datos y los archivos subidos se respaldan con un comando (`respaldar.bat`), se guardan los últimos 14 respaldos y se restauran con `restaurar.bat`, que antes guarda el estado actual. |
| RNF-14 | Despliegue | En producción un solo servidor entrega la app web y la API (`desplegar.bat` en la red local; Render en internet: https://aldia-ru4q.onrender.com); el servidor no arranca si la clave JWT es la de ejemplo. |
| RNF-15 | Seguridad | Límite de intentos (10 inicios de sesión fallidos cada 15 min por IP y correo) y encabezados de seguridad (helmet). |
| RNF-16 | Persistencia | Las fotos y los PDF adjuntos se guardan en la base de datos (tabla `archivos`). |
| RNF-17 | Despliegue en la nube | Render + MySQL 8 en Aiven con SSL; sin usuario demo en producción; administradores desde la variable `ADMINS`. |
| RNF-18 | Correo | Correos por la API de Gmail (OAuth 2.0) desde aldiatuvehiculo@gmail.com, con versión de texto y HTML. |
| RNF-19 | Experiencia visual | Animaciones, siluetas de carga, celebración al completar, placa colombiana y logo oficial. |

## Restricciones conocidas
- No hay notificaciones push: las alertas se ven dentro de la aplicación y llegan por correo en un resumen diario.
- El kilometraje lo registra el usuario; si no lo actualiza, el sistema lo estima (RN-04).
- La app del celular se usa con Expo Go en la misma red Wi-Fi del servidor; no se publica en las tiendas de aplicaciones.

## Tecnologías
- **App (celular y computador):** Expo (React Native + React Native Web) con Expo Router
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** MariaDB (administrada con HeidiSQL), con migraciones y semillas en SQL
- **Control de versiones:** Git y GitHub
