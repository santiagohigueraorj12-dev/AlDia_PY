-- =====================================================================
-- MIGRACION 006: factura o foto de cada servicio (RF-30)
--
-- servicios.archivo_url: foto o PDF de la factura del taller, guardado en la
-- tabla archivos (igual que los adjuntos de los documentos). Sirve como
-- evidencia en el historial y en la hoja de vida al vender el vehículo.
-- Escrita para MariaDB y MySQL 8 (no usa ADD COLUMN IF NOT EXISTS).
-- =====================================================================
SET @col = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'servicios' AND COLUMN_NAME = 'archivo_url'),
  'SELECT 1', 'ALTER TABLE servicios ADD COLUMN archivo_url VARCHAR(255) NULL');
PREPARE s1 FROM @col; EXECUTE s1; DEALLOCATE PREPARE s1;
