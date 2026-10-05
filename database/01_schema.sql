-- =====================================================================
--  AlDía - Control del mantenimiento de vehículos
--  Esquema de base de datos (MariaDB)
--
--  CÓMO EJECUTARLO EN HEIDISQL:
--    1. Abre HeidiSQL y conéctate: host 127.0.0.1, usuario root,
--       contraseña vacía, puerto 3320.
--    2. Menú Archivo > Cargar archivo SQL... y elige este archivo.
--    3. Presiona F9 (Ejecutar) y luego F5 para refrescar el árbol.
--    4. Después ejecuta 02_datos_iniciales.sql y (opcional) 03_datos_demo.sql.
--
--  ¡OJO! Este script BORRA y vuelve a crear la base de datos "aldia".
--  Los códigos RN-xx corresponden a las reglas de negocio de docs/ALCANCE.md
-- =====================================================================

DROP DATABASE IF EXISTS aldia;
CREATE DATABASE aldia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aldia;

-- ---------------------------------------------------------------------
-- USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL,
  correo              VARCHAR(150) NOT NULL UNIQUE,
  telefono            VARCHAR(20)  NULL,
  password_hash       VARCHAR(100) NOT NULL,              -- contraseña cifrada con bcrypt
  rol                 ENUM('usuario','admin') NOT NULL DEFAULT 'usuario',
  activo              BOOLEAN NOT NULL DEFAULT TRUE,      -- el admin puede desactivar cuentas
  acepta_datos_en     DATETIME NOT NULL,                  -- autorización Ley 1581 de 2012
  token_recuperacion  VARCHAR(64) NULL,                   -- para "olvidé mi contraseña"
  token_expira_en     DATETIME NULL,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- CATÁLOGOS (los administra el Administrador)
-- ---------------------------------------------------------------------
CREATE TABLE tipos_vehiculo (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(50) NOT NULL UNIQUE
);

-- Plan base de partes de cada tipo de vehículo (RN-05).
-- "codigo" marca las partes con reglas especiales:
--   aceite_motor / filtro_aceite  -> RN-10 (sugerir filtro)
--   pastillas_freno / llantas     -> RN-11 (vehículo "requiere atención")
CREATE TABLE plan_base_partes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  tipo_vehiculo_id  INT NOT NULL,
  codigo            VARCHAR(30) NULL,
  nombre            VARCHAR(100) NOT NULL,
  intervalo_km      INT NULL,          -- NULL = se controla solo por tiempo (RN-06)
  intervalo_meses   INT NOT NULL,
  CONSTRAINT fk_plan_tipo  FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id) ON DELETE CASCADE,
  CONSTRAINT ck_plan_km    CHECK (intervalo_km IS NULL OR intervalo_km > 0),
  CONSTRAINT ck_plan_meses CHECK (intervalo_meses > 0)
);

-- Cuándo toca la primera revisión técnico-mecánica (RN-14).
CREATE TABLE reglas_rtm (
  tipo_vehiculo_id  INT PRIMARY KEY,
  anios_primera     INT NOT NULL,     -- años desde la matrícula
  CONSTRAINT fk_rtm_tipo FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- VEHÍCULOS Y KILOMETRAJE
-- ---------------------------------------------------------------------
CREATE TABLE vehiculos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id         INT NOT NULL,                  -- dueño del vehículo (RN-01)
  tipo_vehiculo_id   INT NOT NULL,
  marca              VARCHAR(50) NOT NULL,
  modelo             VARCHAR(50) NOT NULL,
  anio               SMALLINT NOT NULL,
  placa              VARCHAR(10) NOT NULL UNIQUE,   -- RN-02
  fecha_matricula    DATE NOT NULL,
  km_inicial         INT NOT NULL,
  km_actual          INT NOT NULL,                  -- último kilometraje REAL registrado
  km_actualizado_en  DATETIME NOT NULL,
  foto_url           VARCHAR(255) NULL,
  creado_en          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehiculo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehiculo_tipo    FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id)
);

-- Historial del odómetro: permite calcular el promedio de km por día (RN-04).
CREATE TABLE lecturas_km (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id  INT NOT NULL,
  km           INT NOT NULL,
  fecha        DATETIME NOT NULL,
  CONSTRAINT fk_lectura_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- PARTES Y CAMBIOS
-- ---------------------------------------------------------------------

-- Plan de partes propio de cada vehículo (se copia del plan base, RN-05).
CREATE TABLE partes_vehiculo (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id          INT NOT NULL,
  codigo               VARCHAR(30) NULL,
  nombre               VARCHAR(100) NOT NULL,
  intervalo_km         INT NULL,
  intervalo_meses      INT NOT NULL,
  ultimo_cambio_km     INT NOT NULL,      -- desde aquí se mide el desgaste (RN-07)
  ultimo_cambio_fecha  DATE NOT NULL,
  activa               BOOLEAN NOT NULL DEFAULT TRUE,   -- "quitar" una parte la desactiva y conserva su historial
  CONSTRAINT fk_parte_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  CONSTRAINT ck_parte_km    CHECK (intervalo_km IS NULL OR intervalo_km > 0),
  CONSTRAINT ck_parte_meses CHECK (intervalo_meses > 0)
);

-- Un servicio es una visita al taller donde se cambian una o varias partes.
CREATE TABLE servicios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id  INT NOT NULL,
  fecha        DATE NOT NULL,
  km           INT NOT NULL,
  lugar        VARCHAR(120) NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_servicio_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

-- Cada parte cambiada dentro de un servicio (RN-09).
CREATE TABLE cambios_parte (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  servicio_id       INT NOT NULL,
  parte_id          INT NOT NULL,
  costo             DECIMAL(12,2) NOT NULL DEFAULT 0,
  marca_referencia  VARCHAR(120) NULL,
  CONSTRAINT fk_cambio_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
  CONSTRAINT fk_cambio_parte    FOREIGN KEY (parte_id)    REFERENCES partes_vehiculo(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- DOCUMENTOS DEL VEHÍCULO  (RN-13, RN-14, RN-15)
-- ---------------------------------------------------------------------

-- Un vehículo tiene como máximo un documento vigente de cada tipo.
CREATE TABLE documentos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id        INT NOT NULL,
  tipo               ENUM('soat','rtm','impuesto') NOT NULL,
  fecha_vencimiento  DATE NOT NULL,
  archivo_url        VARCHAR(255) NULL,     -- foto o PDF del documento (JPG, PNG o PDF)
  CONSTRAINT fk_documento_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  CONSTRAINT uq_documento_tipo UNIQUE (vehiculo_id, tipo)
);

-- Historial: cada vez que se registra o renueva un documento queda una fila (RN-15).
CREATE TABLE renovaciones_documento (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  documento_id       INT NOT NULL,
  fecha_vencimiento  DATE NOT NULL,          -- vencimiento que quedó con esta renovación
  fecha_pago         DATE NOT NULL,
  valor              DECIMAL(12,2) NOT NULL DEFAULT 0,
  creado_en          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_renovacion_documento FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- NOTIFICACIONES (alertas dentro de la aplicación)
-- ---------------------------------------------------------------------
CREATE TABLE notificaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  tipo        ENUM('parte','documento','kilometraje') NOT NULL,
  titulo      VARCHAR(150) NOT NULL,
  mensaje     VARCHAR(500) NOT NULL,
  enlace      VARCHAR(150) NULL,        -- pantalla de la app a la que lleva la alerta
  clave       VARCHAR(150) NOT NULL,    -- identifica la alerta para no enviarla dos veces
  leida       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uq_notificacion_clave UNIQUE (usuario_id, clave)
);

CREATE INDEX ix_lecturas_vehiculo ON lecturas_km (vehiculo_id, fecha);
CREATE INDEX ix_notif_usuario     ON notificaciones (usuario_id, leida);
