-- =====================================================================
--  AlDía - Datos iniciales (catálogos + usuario administrador)
--  Ejecutar en HeidiSQL DESPUÉS de 01_schema.sql  (Archivo > Cargar archivo SQL > F9)
-- =====================================================================
USE aldia;

INSERT INTO tipos_vehiculo (id, nombre) VALUES
  (1, 'Moto'),
  (2, 'Carro');

-- ---------------------------------------------------------------------
-- Plan base de partes. Valores de referencia: cada usuario los ajusta
-- según el manual de su vehículo. intervalo_km NULL = solo por tiempo.
-- ---------------------------------------------------------------------

-- Moto
INSERT INTO plan_base_partes (tipo_vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses) VALUES
  (1, 'aceite_motor',    'Aceite de motor',                           3000,  3),
  (1, 'filtro_aceite',   'Filtro de aceite',                          6000,  6),
  (1, NULL,              'Filtro de aire',                            6000,  6),
  (1, NULL,              'Bujía',                                     8000, 12),
  (1, 'pastillas_freno', 'Pastillas de freno',                       10000, 12),
  (1, NULL,              'Kit de arrastre (cadena, piñón y corona)', 15000, 24),
  (1, 'llantas',         'Llantas',                                  15000, 36),
  (1, NULL,              'Líquido de frenos',                         NULL, 24),
  (1, NULL,              'Batería',                                   NULL, 24);

-- Carro
INSERT INTO plan_base_partes (tipo_vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses) VALUES
  (2, 'aceite_motor',    'Aceite de motor',         5000,  6),
  (2, 'filtro_aceite',   'Filtro de aceite',        5000,  6),
  (2, NULL,              'Alineación y balanceo',  10000, 12),
  (2, NULL,              'Filtro de aire',         15000, 12),
  (2, NULL,              'Filtro de combustible',  20000, 24),
  (2, 'pastillas_freno', 'Pastillas de freno',     30000, 24),
  (2, NULL,              'Bujías',                 30000, 36),
  (2, NULL,              'Refrigerante',           40000, 24),
  (2, 'llantas',         'Llantas',                50000, 60),
  (2, NULL,              'Correa de distribución', 60000, 60),
  (2, NULL,              'Líquido de frenos',       NULL, 24),
  (2, NULL,              'Batería',                 NULL, 36);

-- Primera revisión técnico-mecánica de vehículos particulares en Colombia:
-- motos a los 2 años de matriculadas, carros a los 5 (RN-14).
INSERT INTO reglas_rtm (tipo_vehiculo_id, anios_primera) VALUES
  (1, 2),
  (2, 5);

-- ---------------------------------------------------------------------
-- Usuario administrador
--   Correo:     admin@aldia.co
--   Contraseña: Admin123*
-- (se guarda el hash de bcrypt, nunca la contraseña real)
-- ---------------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password_hash, rol, acepta_datos_en)
VALUES ('Administrador', 'admin@aldia.co',
        '$2b$10$kimQsnr7RI6J874nhii5Qek.ZsDhPE0dC2mtcAsgMT7HkIxuwaBRu', 'admin', NOW());
