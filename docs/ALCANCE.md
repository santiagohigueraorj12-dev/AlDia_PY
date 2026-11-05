# AlDía – Alcance del proyecto (versión enfocada)

> **"Que no se te pase ningún cambio de tu vehículo."**

AlDía es una aplicación para celular y computador que ayuda a las personas a llevar al día el **mantenimiento de sus motos y carros**:
calcula el desgaste de cada parte según los kilómetros y el tiempo, avisa cuándo toca cada cambio, registra lo que se
gasta en mantenimiento y controla el vencimiento de los documentos del vehículo (SOAT, revisión técnico-mecánica e impuesto).

## Qué incluye
- Registro de motos y carros con su kilometraje.
- Plan de partes por vehículo, cálculo de desgaste, alertas y registro de cambios.
- Costo de mantenimiento y costo por kilómetro.
- Documentos del vehículo con fecha de vencimiento: SOAT, revisión técnico-mecánica (RTM) e impuesto.
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
| RN-17 | El asistente no es una inteligencia artificial: sus preguntas son fijas y cada respuesta se arma solo con los datos registrados del vehículo elegido (desgaste, documentos, costos y kilometraje), uno a la vez. Si falta un dato, lo dice en vez de inventarlo. No usa internet ni servicios externos. | `domain/asistente.js` |

## Requisitos funcionales
**Usuarios**
- RF-01: Registrarse con nombre, correo, teléfono, contraseña y autorización de tratamiento de datos.
- RF-02: Iniciar sesión, cerrar sesión y recuperar la contraseña.
- RF-03: Editar el perfil, cambiar la contraseña y eliminar la cuenta.

**Vehículos y partes**
- RF-04: Registrar, editar y eliminar vehículos (tipo, marca, modelo, año, placa, fecha de matrícula, km inicial y foto).
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
- RF-14: Panel de inicio con el estado de cada vehículo, las partes próximas o vencidas, los documentos por vencer y el gasto del mes.
- RF-15: Calendario mensual con los cambios de partes estimados y los vencimientos de documentos.
- RF-16: Notificaciones dentro de la aplicación, que se pueden marcar como leídas.

**Administración**
- RF-17: Gestionar el plan base de partes de cada tipo de vehículo.
- RF-18: Gestionar las reglas de la primera RTM.
- RF-19: Listar, activar y desactivar usuarios.

**Proceso automático**
- RF-20: Cada día (y al iniciar el servidor) recalcular el desgaste, estimar el kilometraje y generar las alertas.

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
| RNF-11 | Calidad | Pruebas unitarias de las reglas de desgaste, kilometraje, último cambio, estado del vehículo y documentos. |

## Tecnologías
- **App (celular y computador):** Expo (React Native + React Native Web) con Expo Router
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** MariaDB (administrada con HeidiSQL)
- **Control de versiones:** Git y GitHub
