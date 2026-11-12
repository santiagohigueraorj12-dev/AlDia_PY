-- =====================================================================
--  Migración 007: crea la tabla partes_vehiculo
-- =====================================================================
--  Plan de partes propio de cada vehículo (RN-05, RN-07, RN-16).

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
  ultimo_cambio_conocido BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = no se sabe; se cuenta desde la matrícula (RN-16)
  activa               BOOLEAN NOT NULL DEFAULT TRUE,   -- "quitar" una parte la desactiva y conserva su historial
  CONSTRAINT fk_parte_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  CONSTRAINT ck_parte_km    CHECK (intervalo_km IS NULL OR intervalo_km > 0),
  CONSTRAINT ck_parte_meses CHECK (intervalo_meses > 0)
);
