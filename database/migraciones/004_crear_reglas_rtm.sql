-- =====================================================================
--  Migración 004: crea la tabla reglas_rtm
-- =====================================================================
--  Cuándo toca la primera revisión técnico-mecánica (RN-14).

-- Cuándo toca la primera revisión técnico-mecánica (RN-14).
CREATE TABLE reglas_rtm (
  tipo_vehiculo_id  INT PRIMARY KEY,
  anios_primera     INT NOT NULL,     -- años desde la matrícula
  CONSTRAINT fk_rtm_tipo FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id) ON DELETE CASCADE
);
