-- =====================================================================
--  Migración 003: crea la tabla plan_base_partes
-- =====================================================================
--  Partes que se copian a cada vehículo nuevo (RN-05).

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
