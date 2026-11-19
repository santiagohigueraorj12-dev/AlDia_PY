-- =====================================================================
-- MIGRACION 001: esquema inicial de AlDia
-- Crea las tablas en orden de dependencias. Las modificaciones al esquema
-- se agrupan en 002_actualizar_tablas.sql y se ejecutan despues de este archivo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL,
  correo              VARCHAR(150) NOT NULL UNIQUE,
  telefono            VARCHAR(20) NULL,
  password_hash       VARCHAR(100) NOT NULL,
  rol                 ENUM('usuario','admin') NOT NULL DEFAULT 'usuario',
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  acepta_datos_en     DATETIME NOT NULL,
  token_recuperacion  VARCHAR(64) NULL,
  token_expira_en     DATETIME NULL,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. CATALOGOS DE VEHICULOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_vehiculo (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS plan_base_partes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  tipo_vehiculo_id  INT NOT NULL,
  codigo            VARCHAR(30) NULL,
  nombre            VARCHAR(100) NOT NULL,
  intervalo_km      INT NULL,
  intervalo_meses   INT NOT NULL,
  CONSTRAINT fk_plan_tipo FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id) ON DELETE CASCADE,
  CONSTRAINT ck_plan_km CHECK (intervalo_km IS NULL OR intervalo_km > 0),
  CONSTRAINT ck_plan_meses CHECK (intervalo_meses > 0)
);

CREATE TABLE IF NOT EXISTS reglas_rtm (
  tipo_vehiculo_id  INT PRIMARY KEY,
  anios_primera     INT NOT NULL,
  CONSTRAINT fk_rtm_tipo FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3. VEHICULOS Y KILOMETRAJE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehiculos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id         INT NOT NULL,
  tipo_vehiculo_id   INT NOT NULL,
  marca              VARCHAR(50) NOT NULL,
  modelo             VARCHAR(50) NOT NULL,
  anio               SMALLINT NOT NULL,
  placa              VARCHAR(10) NOT NULL UNIQUE,
  fecha_matricula    DATE NOT NULL,
  km_inicial         INT NOT NULL,
  km_actual          INT NOT NULL,
  km_actualizado_en  DATETIME NOT NULL,
  foto_url           VARCHAR(255) NULL,
  creado_en          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehiculo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehiculo_tipo FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id)
);

CREATE TABLE IF NOT EXISTS lecturas_km (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id  INT NOT NULL,
  km           INT NOT NULL,
  fecha        DATETIME NOT NULL,
  CONSTRAINT fk_lectura_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  KEY ix_lecturas_vehiculo (vehiculo_id, fecha)
);

-- ---------------------------------------------------------------------
-- 4. PARTES, SERVICIOS E HISTORIAL DE MANTENIMIENTO
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partes_vehiculo (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id           INT NOT NULL,
  codigo                VARCHAR(30) NULL,
  nombre                VARCHAR(100) NOT NULL,
  intervalo_km          INT NULL,
  intervalo_meses       INT NOT NULL,
  ultimo_cambio_km      INT NOT NULL,
  ultimo_cambio_fecha   DATE NOT NULL,
  ultimo_cambio_conocido BOOLEAN NOT NULL DEFAULT TRUE,
  activa                BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_parte_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  CONSTRAINT ck_parte_km CHECK (intervalo_km IS NULL OR intervalo_km > 0),
  CONSTRAINT ck_parte_meses CHECK (intervalo_meses > 0)
);

CREATE TABLE IF NOT EXISTS servicios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id  INT NOT NULL,
  fecha        DATE NOT NULL,
  km           INT NOT NULL,
  lugar        VARCHAR(120) NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_servicio_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cambios_parte (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  servicio_id       INT NOT NULL,
  parte_id          INT NOT NULL,
  costo             DECIMAL(12,2) NOT NULL DEFAULT 0,
  marca_referencia  VARCHAR(120) NULL,
  CONSTRAINT fk_cambio_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
  CONSTRAINT fk_cambio_parte FOREIGN KEY (parte_id) REFERENCES partes_vehiculo(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 5. DOCUMENTOS Y RENOVACIONES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id        INT NOT NULL,
  tipo               ENUM('soat','rtm','impuesto') NOT NULL,
  fecha_vencimiento  DATE NOT NULL,
  archivo_url        VARCHAR(255) NULL,
  CONSTRAINT fk_documento_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  CONSTRAINT uq_documento_tipo UNIQUE (vehiculo_id, tipo)
);

CREATE TABLE IF NOT EXISTS renovaciones_documento (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  documento_id       INT NOT NULL,
  fecha_vencimiento  DATE NOT NULL,
  fecha_pago         DATE NOT NULL,
  valor              DECIMAL(12,2) NOT NULL DEFAULT 0,
  creado_en          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_renovacion_documento FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 6. NOTIFICACIONES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notificaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  tipo        ENUM('parte','documento','kilometraje') NOT NULL,
  titulo      VARCHAR(150) NOT NULL,
  mensaje     VARCHAR(500) NOT NULL,
  enlace      VARCHAR(150) NULL,
  clave       VARCHAR(150) NOT NULL,
  leida       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uq_notificacion_clave UNIQUE (usuario_id, clave),
  KEY ix_notif_usuario (usuario_id, leida)
);
