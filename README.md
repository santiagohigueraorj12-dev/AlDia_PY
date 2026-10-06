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

- **Alcance, reglas de negocio y requisitos:** [docs/ALCANCE.md](docs/ALCANCE.md)
- **Cómo está organizado el código:** [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)

---

## Cómo ponerlo a funcionar

### 1. Base de datos (HeidiSQL)
1. Abre **HeidiSQL** y crea una conexión: host `127.0.0.1`, usuario `root`, contraseña vacía, **puerto `3320`**.
2. Menú **Archivo → Cargar archivo SQL…**, elige `database/01_schema.sql` y presiona **F9**.
3. Haz lo mismo con `database/02_datos_iniciales.sql` (catálogos y usuario administrador).
4. *(Opcional)* Haz lo mismo con `database/03_datos_demo.sql` (datos de ejemplo para la presentación).
5. Presiona **F5**: debe aparecer la base `aldia` con 12 tablas.

> ⚠️ `01_schema.sql` **borra y vuelve a crear** la base `aldia`. Úsalo solo para empezar de cero.

### 2. Backend (API)
```bash
cd backend
npm install
copy .env.example .env      # en Git Bash: cp .env.example .env  (revisa el puerto de la BD)
npm run dev                 # queda en http://localhost:4000
```

### 3. App (celular y computador)
Es **un solo proyecto** que se abre en el celular y en el navegador del computador. En **otra** terminal:
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

### Usuarios de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@aldia.co` | `Admin123*` |
| Usuario demo (si cargaste `03_datos_demo.sql`) | `demo@aldia.co` | `Demo123*` |

El usuario demo tiene una **moto** que "Requiere atención" (pastillas de freno vencidas) y un **carro** "No apto
para circular" (revisión técnico-mecánica vencida, SOAT por vencer y kilometraje estimado).

### Pruebas unitarias
```bash
cd backend
npm test                    # 53 pruebas de las reglas de negocio
npm run test:cobertura      # con porcentaje de cobertura
```

---

## Estructura de carpetas
```
AlDia_PY/
├── database/            Scripts SQL para HeidiSQL (esquema, catálogos, demo)
├── docs/                Alcance (reglas y requisitos) y arquitectura
├── app/                 ⭐ App para celular y computador (Expo)
│   └── src/
│       ├── app/         Pantallas: cada archivo es una pantalla (Expo Router)
│       ├── components/  Piezas reutilizables (botones, campos, barra de desgaste…)
│       ├── api/         Cliente que llama al backend + hook useDatos
│       ├── context/     Sesión del usuario
│       └── utils/       Formatos colombianos y diálogos
├── backend/
│   ├── src/
│   │   ├── domain/      ⭐ Reglas de negocio puras (desgaste, km, documentos…)
│   │   ├── modules/     Un módulo por funcionalidad: rutas → controlador → servicio → repositorio
│   │   ├── middlewares/ Sesión (JWT), validación, archivos, errores
│   │   ├── jobs/        Tarea automática diaria (alertas)
│   │   ├── config/      Conexión a la BD y variables de entorno
│   │   ├── utils/       Fechas, PDF, errores
│   │   ├── app.js       Todas las rutas de la API
│   │   └── server.js    Arranque
│   └── tests/           Pruebas unitarias de domain/
```

## Notas
- **Recuperar contraseña:** no hay servidor de correo. En desarrollo el código de recuperación aparece en la
  pantalla y en la consola del backend.
- **Archivos adjuntos** (fotos, SOAT en PDF…) se guardan en `backend/uploads/`.
- **Notificaciones:** se ven dentro de la app (pestaña Alertas). Las notificaciones *push* reales en Android
  necesitan una "development build" (Expo Go ya no las soporta), por eso no se incluyeron.
- La tarea automática revisa todos los vehículos al iniciar el backend y cada día a las 6:00 a. m.
