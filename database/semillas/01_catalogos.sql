-- =====================================================================
--  Semilla 01: catálogos: tipos de vehículo, plan base de partes y reglas RTM
-- =====================================================================

INSERT INTO tipos_vehiculo (id, nombre) VALUES
  (1, 'Moto'),
  (2, 'Carro');

-- ---------------------------------------------------------------------
-- Plan base de partes. Valores de referencia: cada usuario los ajusta
-- según el manual de su vehículo. intervalo_km NULL = solo por tiempo.
-- ---------------------------------------------------------------------

-- Moto. subtipo NULL = todas las motos; 'cambios' = con cadena; 'automatica' = scooter con correa CVT
INSERT INTO plan_base_partes (tipo_vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses, subtipo) VALUES
  (1, 'aceite_motor',       'Aceite de motor',                           3000,  3, NULL),
  (1, 'filtro_aceite',      'Filtro de aceite',                          6000,  6, NULL),
  (1, NULL,                 'Filtro de aire',                            6000,  6, NULL),
  (1, NULL,                 'Bujía',                                     8000, 12, NULL),
  (1, 'pastillas_freno',    'Pastillas de freno',                       10000, 12, NULL),
  (1, 'kit_arrastre',       'Kit de arrastre (cadena, piñón y corona)', 20000, 24, 'cambios'),
  (1, 'lubricar_cadena',    'Lubricar y ajustar la cadena',              1000,  2, 'cambios'),
  (1, 'correa_cvt',         'Correa de transmisión (CVT)',              20000, 24, 'automatica'),
  (1, 'rodillos_variador',  'Rodillos del variador',                    20000, 24, 'automatica'),
  (1, 'aceite_transmision', 'Aceite de la transmisión final',            6000, 12, 'automatica'),
  (1, 'llantas',            'Llantas',                                  15000, 36, NULL),
  (1, NULL,                 'Líquido de frenos',                         NULL, 24, NULL),
  (1, NULL,                 'Batería',                                   NULL, 24, NULL);

-- Carro
INSERT INTO plan_base_partes (tipo_vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses) VALUES
  (2, 'aceite_motor',    'Aceite de motor',         5000,  6),
  (2, 'filtro_aceite',   'Filtro de aceite',        5000,  6),
  (2, NULL,              'Alineación y balanceo',  10000, 12),
  (2, NULL,              'Filtro de aire',         15000, 12),
  (2, NULL,              'Filtro de combustible',  20000, 24),
  (2, 'pastillas_freno', 'Pastillas de freno',     30000, 24),
  (2, NULL,              'Bujías',                 40000, 36),
  (2, NULL,              'Refrigerante',           40000, 24),
  (2, 'llantas',         'Llantas',                50000, 60),
  (2, NULL,              'Correa de distribución', 60000, 60),
  (2, NULL,              'Líquido de frenos',       NULL, 24),
  (2, NULL,              'Batería',                 NULL, 36);

-- Primera revisión técnico-mecánica de vehículos particulares en Colombia
-- (Ley 769 de 2002, art. 52, modificado por la Ley 2294 de 2023):
-- motos a los 2 años de matriculadas, carros a los 5 (RN-14).
-- Excepción en domain/vehiculo.js: carros matriculados del 20/05/2017 al 19/05/2018, a los 6.
INSERT INTO reglas_rtm (tipo_vehiculo_id, anios_primera) VALUES
  (1, 2),
  (2, 5);
