-- =====================================================================
--  Migración 008: crea la tabla servicios
-- =====================================================================
--  Cada visita al taller (RF-08).

-- Un servicio es una visita al taller donde se cambian una o varias partes.
CREATE TABLE servicios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id  INT NOT NULL,
  fecha        DATE NOT NULL,
  km           INT NOT NULL,
  lugar        VARCHAR(120) NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_servicio_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);
