-- =====================================================================
--  Migración 006: crea la tabla lecturas_km
-- =====================================================================
--  Historial del odómetro, para el promedio diario (RN-04).

-- Historial del odómetro: permite calcular el promedio de km por día (RN-04).
CREATE TABLE lecturas_km (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id  INT NOT NULL,
  km           INT NOT NULL,
  fecha        DATETIME NOT NULL,
  CONSTRAINT fk_lectura_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE INDEX ix_lecturas_vehiculo ON lecturas_km (vehiculo_id, fecha);
