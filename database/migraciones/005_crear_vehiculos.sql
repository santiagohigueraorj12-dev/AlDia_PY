-- =====================================================================
--  Migración 005: crea la tabla vehiculos
-- =====================================================================
--  Las motos y carros de cada usuario (RF-04, RN-01, RN-02).

-- ---------------------------------------------------------------------
-- VEHÍCULOS Y KILOMETRAJE
-- ---------------------------------------------------------------------
CREATE TABLE vehiculos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id         INT NOT NULL,                  -- dueño del vehículo (RN-01)
  tipo_vehiculo_id   INT NOT NULL,
  marca              VARCHAR(50) NOT NULL,
  modelo             VARCHAR(50) NOT NULL,
  anio               SMALLINT NOT NULL,
  placa              VARCHAR(10) NOT NULL UNIQUE,   -- RN-02
  fecha_matricula    DATE NOT NULL,
  km_inicial         INT NOT NULL,
  km_actual          INT NOT NULL,                  -- último kilometraje REAL registrado
  km_actualizado_en  DATETIME NOT NULL,
  foto_url           VARCHAR(255) NULL,
  creado_en          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehiculo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehiculo_tipo    FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculo(id)
);
