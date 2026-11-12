-- =====================================================================
--  Migración 013: agrega a usuarios los datos del perfil (RF-03, RN-18)
-- =====================================================================
--  El registro solo pide nombre, correo y contraseña; estos datos se llenan
--  después, dentro de la app, en "Mi perfil". Por eso todos aceptan NULL.
--  IF NOT EXISTS: si alguna columna ya existe, la salta en vez de fallar.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS tipo_documento     ENUM('CC','CE','TI','PA','PPT') NULL AFTER telefono,
  ADD COLUMN IF NOT EXISTS numero_documento   VARCHAR(15)  NULL AFTER tipo_documento,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento   DATE         NULL AFTER numero_documento,
  ADD COLUMN IF NOT EXISTS departamento       VARCHAR(60)  NULL AFTER fecha_nacimiento,
  ADD COLUMN IF NOT EXISTS ciudad             VARCHAR(80)  NULL AFTER departamento,
  ADD COLUMN IF NOT EXISTS direccion          VARCHAR(150) NULL AFTER ciudad,
  ADD COLUMN IF NOT EXISTS licencia_categoria ENUM('A1','A2','B1','B2','B3','C1','C2','C3') NULL AFTER direccion,
  ADD COLUMN IF NOT EXISTS licencia_vence     DATE         NULL AFTER licencia_categoria;
