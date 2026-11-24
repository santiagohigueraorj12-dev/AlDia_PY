-- =====================================================================
-- MIGRACION 004: revisiones de partes y novedades del vehículo
--
-- 1. Revisiones (RF-27, RN-20): el usuario revisa una parte, la encuentra en
--    buen estado y elige el mes en que quiere volver a revisarla. No es un
--    cambio: no tiene costo y no borra la fecha del último cambio real.
-- 2. Novedades (RF-28, RN-21): daños, fallas o golpes que pasan sin aviso.
--    Mientras una novedad esté pendiente, el vehículo "requiere atención".
-- Escrita para MariaDB y MySQL 8 (no usa ADD COLUMN IF NOT EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. REVISIONES DE PARTES
-- En la parte se guarda la última revisión (para calcular rápido el estado)
-- y en revisiones_parte queda el historial de todas.
-- ---------------------------------------------------------------------
SET @agregar_revision = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'partes_vehiculo' AND COLUMN_NAME = 'revisar_en'),
  'SELECT 1',
  'ALTER TABLE partes_vehiculo
     ADD COLUMN ultima_revision_fecha DATE NULL,
     ADD COLUMN ultima_revision_km INT NULL,
     ADD COLUMN revisar_en DATE NULL'
);
PREPARE agregar_revision_stmt FROM @agregar_revision;
EXECUTE agregar_revision_stmt;
DEALLOCATE PREPARE agregar_revision_stmt;

CREATE TABLE IF NOT EXISTS revisiones_parte (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  parte_id    INT NOT NULL,
  fecha       DATE NOT NULL,
  km          INT NOT NULL,
  revisar_en  DATE NOT NULL,
  nota        VARCHAR(255) NULL,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_revision_parte FOREIGN KEY (parte_id) REFERENCES partes_vehiculo(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2. NOVEDADES DEL VEHÍCULO
-- parte_id es opcional: una novedad puede ser de una parte del plan o de
-- algo que no está en la lista (por ejemplo, un espejo).
-- Al arreglarla: si es de una parte, se registra un servicio con el cambio
-- de esa parte (servicio_id); si no, el costo queda en la novedad.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS novedades (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id   INT NOT NULL,
  parte_id      INT NULL,
  tipo          ENUM('dano','accidente','otro') NOT NULL,
  titulo        VARCHAR(120) NOT NULL,
  descripcion   VARCHAR(1000) NULL,
  fecha         DATE NOT NULL,
  km            INT NOT NULL,
  estado        ENUM('pendiente','arreglada') NOT NULL DEFAULT 'pendiente',
  foto_url      VARCHAR(255) NULL,
  arreglada_en  DATE NULL,
  arreglada_km  INT NULL,
  lugar         VARCHAR(120) NULL,
  costo         DECIMAL(12,2) NULL,
  servicio_id   INT NULL,
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_novedad_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  CONSTRAINT fk_novedad_parte FOREIGN KEY (parte_id) REFERENCES partes_vehiculo(id) ON DELETE SET NULL,
  CONSTRAINT fk_novedad_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL
);
