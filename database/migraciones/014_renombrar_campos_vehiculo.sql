-- Conserva los valores existentes: el antiguo modelo pasa a ser linea,
-- y el anio pasa a almacenarse en el campo modelo.
ALTER TABLE vehiculos
  CHANGE COLUMN modelo linea VARCHAR(50) NOT NULL,
  CHANGE COLUMN anio modelo SMALLINT NOT NULL;
