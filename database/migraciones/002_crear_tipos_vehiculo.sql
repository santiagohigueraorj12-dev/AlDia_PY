-- =====================================================================
--  Migración 002: crea la tabla tipos_vehiculo
-- =====================================================================
--  Catálogo de tipos de vehículo (Moto, Carro).

-- ---------------------------------------------------------------------
-- CATÁLOGOS (los administra el Administrador)
-- ---------------------------------------------------------------------
CREATE TABLE tipos_vehiculo (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(50) NOT NULL UNIQUE
);
