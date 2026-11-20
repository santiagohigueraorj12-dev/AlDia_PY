-- =====================================================================
-- MIGRACION 003: archivos dentro de la base de datos y avisos por correo
--
-- 1. Tabla "archivos": las fotos y PDF adjuntos se guardan en la base de datos.
--    En la nube (Render) el disco se borra en cada reinicio; la base de datos no.
-- 2. Columna notificaciones.correo_enviado: marca qué alertas ya se enviaron
--    por correo en el resumen diario.
-- Escrita para MariaDB y MySQL 8 (no usa ADD COLUMN IF NOT EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ARCHIVOS ADJUNTOS
-- El id es un UUID aleatorio: la dirección del archivo no se puede adivinar.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS archivos (
  id          CHAR(36) PRIMARY KEY,
  usuario_id  INT NULL,
  nombre      VARCHAR(255) NOT NULL,
  tipo        VARCHAR(100) NOT NULL,
  tamano      INT NOT NULL,
  datos       LONGBLOB NOT NULL,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_archivo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. NOTIFICACIONES ENVIADAS POR CORREO
-- Las notificaciones que ya existían quedan como enviadas (DEFAULT TRUE al
-- crear la columna) para no mandarle al usuario un correo con alertas viejas.
-- Después el valor por defecto pasa a FALSE para las nuevas.
-- ---------------------------------------------------------------------
SET @agregar_correo_enviado = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notificaciones' AND COLUMN_NAME = 'correo_enviado'),
  'SELECT 1',
  'ALTER TABLE notificaciones ADD COLUMN correo_enviado BOOLEAN NOT NULL DEFAULT TRUE'
);
PREPARE agregar_correo_enviado_stmt FROM @agregar_correo_enviado;
EXECUTE agregar_correo_enviado_stmt;
DEALLOCATE PREPARE agregar_correo_enviado_stmt;

ALTER TABLE notificaciones ALTER COLUMN correo_enviado SET DEFAULT FALSE;
