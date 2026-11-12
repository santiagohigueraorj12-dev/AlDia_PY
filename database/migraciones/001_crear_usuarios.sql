-- =====================================================================
--  Migración 001: crea la tabla usuarios
-- =====================================================================
--  Las cuentas de AlDía (RF-01, RF-02, RNF-01).
--  Los datos del perfil (documento, dirección, licencia...) se agregan
--  en la migración 013.

CREATE TABLE usuarios (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL,
  correo              VARCHAR(150) NOT NULL UNIQUE,
  telefono            VARCHAR(20)  NULL,
  password_hash       VARCHAR(100) NOT NULL,              -- contraseña cifrada con bcrypt
  rol                 ENUM('usuario','admin') NOT NULL DEFAULT 'usuario',
  activo              BOOLEAN NOT NULL DEFAULT TRUE,      -- el admin puede desactivar cuentas
  acepta_datos_en     DATETIME NOT NULL,                  -- autorización Ley 1581 de 2012
  token_recuperacion  VARCHAR(64) NULL,                   -- para "olvidé mi contraseña"
  token_expira_en     DATETIME NULL,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
