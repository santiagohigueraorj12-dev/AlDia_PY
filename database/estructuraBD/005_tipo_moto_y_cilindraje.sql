-- =====================================================================
-- MIGRACION 005: tipo de moto, cilindraje y gravedad de los daños
--
-- 1. vehiculos.subtipo: 'cambios' (moto con cadena) o 'automatica' (scooter,
--    con correa CVT). Con él se carga el plan de partes correcto (RN-05).
-- 2. vehiculos.cilindraje: las motos de hasta 125 cc no pagan impuesto
--    vehicular (Ley 488 de 1998, art. 141), RN-22.
-- 3. plan_base_partes.subtipo: partes que solo aplican a un tipo de moto.
-- 4. novedades.impide_circular: un daño que no deja usar el vehículo lo pone
--    "no apto para circular" mientras esté pendiente (RN-21).
-- 5. Plan base: kit de arrastre como parte crítica de las motos de cambios
--    (RN-11), partes de las motos automáticas y ajuste de intervalos.
-- Escrita para MariaDB y MySQL 8 (no usa ADD COLUMN IF NOT EXISTS).
-- =====================================================================

SET @col = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehiculos' AND COLUMN_NAME = 'subtipo'),
  'SELECT 1', 'ALTER TABLE vehiculos ADD COLUMN subtipo VARCHAR(20) NULL, ADD COLUMN cilindraje SMALLINT NULL');
PREPARE s1 FROM @col; EXECUTE s1; DEALLOCATE PREPARE s1;

SET @col = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'plan_base_partes' AND COLUMN_NAME = 'subtipo'),
  'SELECT 1', 'ALTER TABLE plan_base_partes ADD COLUMN subtipo VARCHAR(20) NULL');
PREPARE s2 FROM @col; EXECUTE s2; DEALLOCATE PREPARE s2;

SET @col = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'novedades' AND COLUMN_NAME = 'impide_circular'),
  'SELECT 1', 'ALTER TABLE novedades ADD COLUMN impide_circular BOOLEAN NOT NULL DEFAULT FALSE');
PREPARE s3 FROM @col; EXECUTE s3; DEALLOCATE PREPARE s3;

-- ---------------------------------------------------------------------
-- Plan base (solo en bases que ya tienen el plan: en una base nueva lo
-- carga completo la semilla 01_catalogos.sql)
-- ---------------------------------------------------------------------
UPDATE plan_base_partes SET codigo = 'kit_arrastre', subtipo = 'cambios', intervalo_km = 20000
 WHERE tipo_vehiculo_id = 1 AND nombre = 'Kit de arrastre (cadena, piñón y corona)';
UPDATE plan_base_partes SET intervalo_km = 40000
 WHERE tipo_vehiculo_id = 2 AND nombre = 'Bujías' AND intervalo_km = 30000;

INSERT INTO plan_base_partes (tipo_vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses, subtipo)
SELECT 1, 'lubricar_cadena', 'Lubricar y ajustar la cadena', 1000, 2, 'cambios' FROM DUAL
 WHERE EXISTS (SELECT 1 FROM plan_base_partes)
   AND NOT EXISTS (SELECT 1 FROM plan_base_partes WHERE tipo_vehiculo_id = 1 AND codigo = 'lubricar_cadena');
INSERT INTO plan_base_partes (tipo_vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses, subtipo)
SELECT 1, 'correa_cvt', 'Correa de transmisión (CVT)', 20000, 24, 'automatica' FROM DUAL
 WHERE EXISTS (SELECT 1 FROM plan_base_partes)
   AND NOT EXISTS (SELECT 1 FROM plan_base_partes WHERE tipo_vehiculo_id = 1 AND codigo = 'correa_cvt');
INSERT INTO plan_base_partes (tipo_vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses, subtipo)
SELECT 1, 'rodillos_variador', 'Rodillos del variador', 20000, 24, 'automatica' FROM DUAL
 WHERE EXISTS (SELECT 1 FROM plan_base_partes)
   AND NOT EXISTS (SELECT 1 FROM plan_base_partes WHERE tipo_vehiculo_id = 1 AND codigo = 'rodillos_variador');
INSERT INTO plan_base_partes (tipo_vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses, subtipo)
SELECT 1, 'aceite_transmision', 'Aceite de la transmisión final', 6000, 12, 'automatica' FROM DUAL
 WHERE EXISTS (SELECT 1 FROM plan_base_partes)
   AND NOT EXISTS (SELECT 1 FROM plan_base_partes WHERE tipo_vehiculo_id = 1 AND codigo = 'aceite_transmision');

-- Las partes ya copiadas a los vehículos reciben el código del kit (para RN-11)
UPDATE partes_vehiculo SET codigo = 'kit_arrastre'
 WHERE codigo IS NULL AND nombre = 'Kit de arrastre (cadena, piñón y corona)';
