-- =====================================================================
--  Migración 011: crea la tabla renovaciones_documento
-- =====================================================================
--  Historial de cada documento (RN-15).

-- Historial: cada vez que se registra o renueva un documento queda una fila (RN-15).
CREATE TABLE renovaciones_documento (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  documento_id       INT NOT NULL,
  fecha_vencimiento  DATE NOT NULL,          -- vencimiento que quedó con esta renovación
  fecha_pago         DATE NOT NULL,
  valor              DECIMAL(12,2) NOT NULL DEFAULT 0,
  creado_en          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_renovacion_documento FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE
);
