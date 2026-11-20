# Despliegue de AlDía en Render (plan gratuito)

AlDía queda publicada en internet con una dirección como `https://aldia-xxxx.onrender.com`.
Un solo servicio de Render entrega la app web y la API en esa misma dirección.

## Cómo se arma

| Pieza | Dónde vive | Costo |
|---|---|---|
| Código | GitHub (`santiagohigueraorj12-dev/AlDia_PY`) | Gratis |
| App web + API (Node/Express) | Render, "Web Service" | Gratis |
| Base de datos MySQL | Aiven, "Free MySQL" | Gratis |

**¿Por qué la base no está en Render?** Render gratis solo ofrece PostgreSQL, y AlDía usa
MariaDB/MySQL. Aiven regala un MySQL 8 que es compatible con AlDía: las migraciones
(`database/estructuraBD/`) ya están escritas para correr en MariaDB y en MySQL.

## Archivos que usa Render

- `render.yaml`: describe el servicio (comando de compilación, comando de inicio, variables).
- `build.sh`: compila la app web (`app/dist`) e instala el backend.
- `backend/src/config/prepararBD.js`: al encender, crea las tablas, carga las semillas y,
  si existe `ADMIN_CLAVE`, cambia la contraseña del administrador. No hay que correr
  migraciones a mano.

---

## Paso 1. Crear la base MySQL gratis en Aiven

1. Entra a <https://aiven.io> y crea una cuenta (con Google o GitHub).
2. **Create service** → **MySQL** → plan **Free** → una región cercana (por ejemplo, la de
   Estados Unidos) → **Create service**.
3. Espera a que el estado diga **Running** (unos minutos).
4. En la pestaña **Overview**, sección **Connection information**, anota:
   - **Host**: algo como `mysql-xxxx.aivencloud.com`
   - **Port**: un número como `12345`
   - **User**: `avnadmin`
   - **Password**: pulsa el ojo para verla
   - **CA certificate**: pulsa **Show** y copia todo el texto, desde
     `-----BEGIN CERTIFICATE-----` hasta `-----END CERTIFICATE-----`.

> No hace falta crear la base `aldia`: el backend la crea solo la primera vez.

## Paso 2. Subir el código a GitHub

Render despliega lo que está en la rama `main` de GitHub:

```
git push origin main
```

## Paso 3. Crear el servicio en Render

1. Entra a <https://render.com> → **Get Started for Free** → entra con **GitHub**.
2. **New +** → **Blueprint**.
3. Conecta el repositorio `AlDia_PY` (si no aparece: **Configure account** y dale acceso).
4. Render lee `render.yaml` y te pide las variables marcadas para escribir a mano.
   Llénalas con los datos de Aiven:

| Variable | Valor |
|---|---|
| `DB_HOST` | Host de Aiven |
| `DB_PUERTO` | Port de Aiven |
| `DB_USUARIO` | `avnadmin` |
| `DB_CLAVE` | Password de Aiven |
| `DB_SSL_CA` | Todo el texto del CA certificate |
| `ADMIN_CLAVE` | Una contraseña nueva para `admin@aldia.co` (mínimo 8 caracteres) |

Las demás variables ya vienen en `render.yaml`. No hay que tocarlas:

| Variable | Valor | Para qué |
|---|---|---|
| `NODE_ENV` | `production` | Modo producción |
| `NODE_VERSION` | `22.12.0` | Versión de Node |
| `JWT_SECRETO` | La genera Render | Firma las sesiones |
| `JWT_EXPIRA` | `8h` | Duración de la sesión |
| `DB_SSL` | `true` | Conexión cifrada con Aiven |
| `DB_NOMBRE` | `aldia` | Nombre de la base |

5. **Apply**. Render compila (la primera vez tarda de 5 a 10 minutos) y enciende.

### Si prefieres crearlo sin Blueprint

**New +** → **Web Service** → elige el repositorio, y configura:

- **Runtime**: Node
- **Build Command**: `bash ./build.sh`
- **Start Command**: `cd backend && npm start`
- **Instance Type**: Free
- **Health Check Path** (en *Advanced*): `/api/salud`
- **Environment Variables**: todas las de las dos tablas anteriores. Para `JWT_SECRETO`
  pulsa **Generate**.

## Paso 4. Verificar

1. En **Logs** deben aparecer estas líneas:
   ```
   ✔ Migración 001_crear_tablas.sql
   ✔ Migración 002_actualizar_tablas.sql
   ✔ Semilla ...
   ✔ Contraseña del administrador (admin@aldia.co) actualizada desde ADMIN_CLAVE
   API de AlDía escuchando en http://localhost:10000
   ```
   (Render escoge el puerto; la dirección pública es la `onrender.com`.)
2. Abre `https://TU-SERVICIO.onrender.com/api/salud`: debe responder `{"ok":true,"app":"AlDía"}`.
3. Abre `https://TU-SERVICIO.onrender.com` e inicia sesión:
   - Demo: `demo@aldia.co` / `Demo123*`
   - Administrador: `admin@aldia.co` / la `ADMIN_CLAVE` que pusiste.
     `Admin123*` deja de funcionar.

## Cada vez que cambies el código

Haz `git push origin main` y Render vuelve a desplegar solo. La base de datos no se borra:
las migraciones ya ejecutadas se saltan y las semillas no se repiten.

---

## Limitaciones del plan gratuito (tenlas en cuenta para la sustentación)

| Limitación | Qué pasa | Qué hacer |
|---|---|---|
| **Se duerme** tras 15 min sin visitas | La primera visita tarda ~1 minuto en despertar | Abre la página unos minutos antes de presentar |
| **Archivos subidos no se guardan** | Las fotos y PDF adjuntos se borran cuando Render reinicia o redespliega (el disco es temporal) | Para la demo súbelos el mismo día; los datos en la base sí se conservan |
| **Tarea de las 6:00 a. m.** | Si el servicio está dormido no corre a esa hora | Igual corre cada vez que el servicio despierta, así que las alertas se generan |
| **Respaldos** (`respaldar.bat`) | Funcionan contra tu MariaDB local, no contra Aiven | Aiven hace sus propios respaldos diarios del plan gratis |

## Problemas comunes

| Síntoma en los Logs | Causa | Solución |
|---|---|---|
| `En producción debes poner una JWT_SECRETO propia` | Falta `JWT_SECRETO` | En **Environment**, crea `JWT_SECRETO` con **Generate** |
| `No se pudo conectar a MariaDB ... ETIMEDOUT` | Host o puerto mal escritos | Cópialos otra vez de Aiven (el puerto **no** es 3306) |
| `Access denied for user 'avnadmin'` | Contraseña mal copiada | Vuelve a copiar el Password de Aiven |
| `self-signed certificate in certificate chain` | Falta o está incompleto `DB_SSL_CA` | Pega el CA certificate completo, con las líneas BEGIN y END |
| `npm ci` falla en el Build | `package-lock.json` desactualizado | En tu PC: `npm install` en `app` y en `backend`, y sube los `package-lock.json` |
| `JavaScript heap out of memory` al compilar | Poca memoria al compilar la web | **Manual Deploy** → **Clear build cache & deploy**. Si persiste, en **Environment** agrega `NODE_OPTIONS=--max-old-space-size=460` |
| La página abre en blanco | La compilación de `app/dist` falló | Revisa la parte "Compilando la app web" de los Logs del Build |
| El servicio no responde y en Aiven sale **Powered off** | Aiven apaga los servicios gratis sin uso prolongado | En Aiven pulsa **Power on** y en Render **Manual Deploy** |
