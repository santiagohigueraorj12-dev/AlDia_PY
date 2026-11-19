# AlDía 🏍️🚗

> **"Que no se te pase ningún cambio de tu vehículo."**

Aplicación para controlar el **mantenimiento de motos y carros**, que funciona en el **celular y en el computador**. Calcula el desgaste de cada parte
(aceite, frenos, llantas…) según los kilómetros y el tiempo, avisa cuándo toca cada cambio, lleva el costo
del mantenimiento y controla el vencimiento del SOAT, la revisión técnico-mecánica y el impuesto.

Proyecto formativo — Tecnólogo en Análisis y Desarrollo de Software (ADSO), SENA. Ficha 3407177.
Integrantes: Simon Higuera y Santiago Higuera.

| Capa | Tecnología |
|---|---|
| App | Expo SDK 57 (React Native) — Android, iOS y navegador del computador |
| Backend | Node.js + Express 5 (API REST) |
| Base de datos | MariaDB (administrada con HeidiSQL) |

### Entregables del proyecto
Todos están en Word y PDF. La lista completa está en [docs/ENTREGABLES.md](docs/ENTREGABLES.md).

| Entregable | Documento |
|---|---|
| Despliegue de la aplicación | `desplegar.bat` + [Manual de instalación y despliegue](docs/manuales/AlDia_Manual_de_Instalacion_y_Despliegue.pdf) |
| Requisitos corregidos | [Especificación de requisitos v2.0](docs/requisitos/AlDia_Especificacion_de_Requisitos.pdf) (resumen en [docs/ALCANCE.md](docs/ALCANCE.md)) |
| Plan de pruebas | [Documentación de pruebas ISO/IEC/IEEE 29119-3](docs/pruebas/AlDia_Documentacion_de_Pruebas.pdf) + [casos en Excel](docs/pruebas/AlDia_Especificacion_Casos_de_Prueba.xlsx) |
| Plan de respaldo | [Plan de respaldo](docs/respaldo/AlDia_Plan_de_Respaldo.pdf) + `respaldar.bat` / `restaurar.bat` |
| Manual de usuario | [Manual de usuario](docs/manuales/AlDia_Manual_de_Usuario.pdf) |
| Manual de instalación | [Manual de instalación y despliegue](docs/manuales/AlDia_Manual_de_Instalacion_y_Despliegue.pdf) |
| Otros | [Manual técnico](docs/manuales/AlDia_Manual_Tecnico.pdf), [Documento de análisis](docs/AlDia_Documento_de_analisis.pdf), [arquitectura](docs/ARQUITECTURA.md) |

---

## Cómo ponerlo a funcionar

**Necesitas:** [Node.js](https://nodejs.org) (versión LTS) y **MariaDB** encendido (el de HeidiSQL, XAMPP o Laragon).
No hay que crear la base de datos a mano: **el backend la crea sola** la primera vez que se enciende.

### Producción (para usarlo de verdad): doble clic en `desplegar.bat`
Compila la app y enciende **un solo servidor** en http://localhost:4000 (desde otros equipos o celulares de la misma red: `http://IP-del-computador:4000`).
Antes pon una `JWT_SECRETO` propia en `backend/.env`. Detalles en el manual de instalación.

### Respaldo
`respaldar.bat` guarda la base de datos y los archivos subidos en `respaldos/`; `restaurar.bat` los recupera. Ver el plan de respaldo.

### Opción rápida (Windows): doble clic en `iniciar.bat`
Instala las librerías la primera vez, enciende el backend en otra ventana y abre la app en el navegador
(http://localhost:8081). Para apagar todo, cierra las dos ventanas.

### Opción manual
**1. Backend (API)** — en una terminal:
```bash
cd backend
npm install
npm run dev                 # queda en http://localhost:4000
```
Al encenderse busca MariaDB (en el puerto del archivo `.env` y, si no responde, en el 3306 y el 3320), crea la base
`aldia`, ejecuta las **migraciones** que falten y, si la base es nueva, carga los datos iniciales y de demostración.
Si tu MariaDB usa otro usuario, contraseña o puerto, copia `backend/.env.example` como `backend/.env` y ajústalo.

**2. App (celular y computador)** — en **otra** terminal:
```bash
cd app
npm install
npx expo start
```

**En el computador:** presiona la tecla `w` en esa terminal, o abre http://localhost:8081 en Chrome, Edge o Firefox.
Desde otro computador de la misma red se abre con `http://IP-DEL-COMPUTADOR:8081`.

**En el celular:**
1. Instala **Expo Go** (Play Store o App Store).
2. Conecta el celular a la **misma red Wi-Fi** que el computador.
3. Escanea el código QR con Expo Go (Android) o con la cámara (iPhone).

La app encuentra sola el backend (puerto 4000) usando la dirección del computador. Si no conecta:
- La primera vez que corre el backend, Windows pregunta si permite el acceso a la red: elige **Permitir**
  (o abre el puerto 4000 en el Firewall de Windows).
- Puedes fijar la dirección a mano creando `app/.env` con `EXPO_PUBLIC_API_URL=http://TU-IP:4000`.

### Base de datos: migraciones y semillas
La carpeta `database/` separa la creación del esquema y sus modificaciones:

| Carpeta | Qué tiene |
|---|---|
| `database/estructuraBD/` | `001_crear_tablas.sql`: crea las tablas, agrupadas por función y orden de dependencias. `002_actualizar_tablas.sql`: aplica los cambios de esquema después de crear las tablas; es compatible con bases existentes. |
| `database/semillas/` | Datos iniciales: catálogos (tipos de vehículo, plan base de partes, reglas RTM), el usuario administrador y los datos de demostración. |

La tabla **`migraciones`** anota cuáles ya se ejecutaron. El backend procesa los archivos en orden alfabético:
primero crea las tablas y después las actualiza. Los scripts agrupados reconocen tablas y cambios existentes para
no borrar ni duplicar datos. Para futuros cambios, **no se editan migraciones ya aplicadas**: se agrega una nueva
con el número siguiente (`003_...sql`) y se ejecuta con `npm run bd:migrar` (o al encender el backend). En HeidiSQL
se ve el resultado: la base `aldia` con sus tablas.

### Usuarios de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@aldia.co` | `Admin123*` |
| Usuario demo (se crea con la base nueva) | `demo@aldia.co` | `Demo123*` |

El usuario demo tiene una **moto** que "Requiere atención" (pastillas de freno vencidas) y un **carro** "No apto
para circular" (revisión técnico-mecánica vencida, SOAT por vencer y kilometraje estimado).

### Pruebas unitarias
```bash
cd backend
npm test                    # 127 pruebas: reglas de negocio, perfil, fechas, errores, validaciones y asistente
npm run test:cobertura      # con porcentaje de cobertura

cd ../app
npm test                    # 23 pruebas: formatos y lista "Lo que debes hacer"
```
Cada prueba tiene un identificador fijo (por ejemplo `CP-DES-02`). La documentación de pruebas sigue la norma
**ISO/IEC/IEEE 29119-3** y está en `docs/pruebas/`:
- `AlDia_Documentacion_de_Pruebas.docx` (y PDF): política y estrategia, plan de pruebas con registro de riesgos,
  diseño (conjuntos y condiciones), procedimientos, datos y entorno, registro de ejecución, incidentes e informes.
- `AlDia_Especificacion_Casos_de_Prueba.xlsx`: los 150 casos con entradas, resultado esperado y resultado real,
  la matriz de trazabilidad con los requisitos, el registro de ejecución y los incidentes.

---

## Estructura de carpetas
```
AlDia_PY/
├── database/
│   ├── estructuraBD/    Creación y actualizaciones del esquema, organizadas por fase
│   └── semillas/        Datos iniciales: catálogos, administrador y demo
├── docs/                Entregables: requisitos/, manuales/, pruebas/ (ISO/IEC/IEEE 29119-3), respaldo/, alcance y arquitectura
├── app/                 ⭐ App para celular y computador (Expo)
│   └── src/
│       ├── app/         Pantallas: cada archivo es una pantalla (Expo Router)
│       ├── components/  Piezas reutilizables (botones, campos, ilustraciones…)
│       ├── api/         Cliente que llama al backend + hook useDatos
│       ├── context/     Sesión del usuario
│       └── utils/       Formatos colombianos, listas de Colombia y tareas del inicio
│   └── tests/           Pruebas unitarias de la app
├── backend/
│   ├── src/
│   │   ├── domain/      ⭐ Reglas de negocio puras (desgaste, km, documentos…)
│   │   ├── modules/     Un módulo por funcionalidad: rutas → controlador → servicio → repositorio
│   │   ├── middlewares/ Sesión (JWT), validación, archivos, errores
│   │   ├── jobs/        Tarea automática diaria (alertas)
│   │   ├── config/      Conexión a la BD, variables de entorno y migraciones
│   │   ├── utils/       Fechas, PDF, errores
│   │   ├── app.js       Todas las rutas de la API
│   │   └── server.js    Arranque
│   └── tests/           Pruebas unitarias de domain/ y utils/
└── iniciar.bat          Enciende todo con doble clic (Windows)
```

## Notas
- **Recuperar contraseña:** no hay servidor de correo. En desarrollo el código de recuperación aparece en la
  pantalla y en la consola del backend.
- **Archivos adjuntos** (fotos, SOAT en PDF…) se guardan en `backend/uploads/`.
- **Notificaciones:** se ven dentro de la app (pestaña Alertas). Las notificaciones *push* reales en Android
  necesitan una "development build" (Expo Go ya no las soporta), por eso no se incluyeron.
- La tarea automática revisa todos los vehículos al iniciar el backend y cada día a las 6:00 a. m.
