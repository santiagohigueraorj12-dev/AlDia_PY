-- =====================================================================
--  Semilla 02: usuario administrador
-- =====================================================================

-- ---------------------------------------------------------------------
-- Usuario administrador
--   Correo:     admin@aldia.co
--   Contraseña: Admin123*
-- (se guarda el hash de bcrypt, nunca la contraseña real)
-- ---------------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password_hash, rol, acepta_datos_en)
VALUES ('Administrador', 'admin@aldia.co',
        '$2b$10$kimQsnr7RI6J874nhii5Qek.ZsDhPE0dC2mtcAsgMT7HkIxuwaBRu', 'admin', NOW());
