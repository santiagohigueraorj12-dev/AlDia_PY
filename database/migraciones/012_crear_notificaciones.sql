-- =====================================================================
--  Migración 012: crea la tabla notificaciones
-- =====================================================================
--  Alertas dentro de la aplicación (RF-16).

-- ---------------------------------------------------------------------
-- NOTIFICACIONES (alertas dentro de la aplicación)
-- ---------------------------------------------------------------------
CREATE TABLE notificaciones (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  tipo        ENUM('parte','documento','kilometraje') NOT NULL,
  titulo      VARCHAR(150) NOT NULL,
  mensaje     VARCHAR(500) NOT NULL,
  enlace      VARCHAR(150) NULL,        -- pantalla de la app a la que lleva la alerta
  clave       VARCHAR(150) NOT NULL,    -- identifica la alerta para no enviarla dos veces
  leida       BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notificacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uq_notificacion_clave UNIQUE (usuario_id, clave)
);

CREATE INDEX ix_notif_usuario ON notificaciones (usuario_id, leida);
