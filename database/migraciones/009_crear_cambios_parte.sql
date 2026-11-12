-- =====================================================================
--  Migración 009: crea la tabla cambios_parte
-- =====================================================================
--  Cada parte cambiada dentro de un servicio (RN-09).

-- Cada parte cambiada dentro de un servicio (RN-09).
CREATE TABLE cambios_parte (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  servicio_id       INT NOT NULL,
  parte_id          INT NOT NULL,
  costo             DECIMAL(12,2) NOT NULL DEFAULT 0,
  marca_referencia  VARCHAR(120) NULL,
  CONSTRAINT fk_cambio_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
  CONSTRAINT fk_cambio_parte    FOREIGN KEY (parte_id)    REFERENCES partes_vehiculo(id) ON DELETE CASCADE
);
