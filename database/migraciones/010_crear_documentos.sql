-- =====================================================================
--  Migración 010: crea la tabla documentos
-- =====================================================================
--  SOAT, técnico-mecánica e impuesto de cada vehículo (RN-13, RN-14).

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
