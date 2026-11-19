-- =====================================================================
-- MIGRACION 002: modificaciones sobre tablas ya creadas
-- Se ejecuta despues de 001_crear_tablas.sql.
-- Las operaciones son repetibles para permitir actualizar bases existentes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. USUARIOS: datos opcionales del perfil (RF-03, RN-18)
-- ---------------------------------------------------------------------
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS tipo_documento     ENUM('CC','CE','TI','PA','PPT') NULL AFTER telefono,
  ADD COLUMN IF NOT EXISTS numero_documento   VARCHAR(15) NULL AFTER tipo_documento,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento   DATE NULL AFTER numero_documento,
  ADD COLUMN IF NOT EXISTS departamento       VARCHAR(60) NULL AFTER fecha_nacimiento,
  ADD COLUMN IF NOT EXISTS ciudad             VARCHAR(80) NULL AFTER departamento,
  ADD COLUMN IF NOT EXISTS direccion          VARCHAR(150) NULL AFTER ciudad,
  ADD COLUMN IF NOT EXISTS licencia_categoria ENUM('A1','A2','B1','B2','B3','C1','C2','C3') NULL AFTER direccion,
  ADD COLUMN IF NOT EXISTS licencia_vence     DATE NULL AFTER licencia_categoria;

-- ---------------------------------------------------------------------
-- 2. VEHICULOS: modelo pasa a representar el anio; se conserva el nombre
-- de la linea (antes almacenada en modelo). En un esquema nuevo el campo
-- anio no existe despues de 001, por lo que este cambio no se repite.
-- ---------------------------------------------------------------------
SET @actualizar_campos_vehiculo = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vehiculos'
      AND COLUMN_NAME = 'anio'
  ),
  'ALTER TABLE vehiculos CHANGE COLUMN modelo linea VARCHAR(50) NOT NULL, CHANGE COLUMN anio modelo SMALLINT NOT NULL',
  'SELECT 1'
);
PREPARE actualizar_campos_vehiculo_stmt FROM @actualizar_campos_vehiculo;
EXECUTE actualizar_campos_vehiculo_stmt;
DEALLOCATE PREPARE actualizar_campos_vehiculo_stmt;
