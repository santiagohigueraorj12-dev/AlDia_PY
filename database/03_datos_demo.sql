-- =====================================================================
--  AlDía - Datos de DEMOSTRACIÓN (opcional, útil para la sustentación)
--  Ejecutar en HeidiSQL después de 02_datos_iniciales.sql.
--  Las fechas se calculan desde HOY (CURDATE()), así siempre hay partes
--  y documentos en distintos estados.
--
--  Usuario: demo@aldia.co   Contraseña: Demo123*
-- =====================================================================
USE aldia;

SET @hace6meses = CURDATE() - INTERVAL 6 MONTH;

INSERT INTO usuarios (nombre, correo, telefono, password_hash, acepta_datos_en)
VALUES ('Usuario Demo', 'demo@aldia.co', '3001234567',
        '$2b$10$XbV030oiBD5OworowtETeeDCD5G69wR8.1F3EK4/zsy//kCNhpXWm', NOW());
SET @usuario = LAST_INSERT_ID();

-- ---------------------------------------------------------------------
-- MOTO: registrada hace 6 meses con 12.000 km; hoy tiene 15.400 km.
-- ---------------------------------------------------------------------
INSERT INTO vehiculos (usuario_id, tipo_vehiculo_id, marca, modelo, anio, placa, fecha_matricula,
                       km_inicial, km_actual, km_actualizado_en, creado_en)
VALUES (@usuario, 1, 'Yamaha', 'NMAX 155', 2024, 'ABC12D', CURDATE() - INTERVAL 20 MONTH,
        12000, 15400, NOW() - INTERVAL 3 DAY, @hace6meses);
SET @moto = LAST_INSERT_ID();

INSERT INTO lecturas_km (vehiculo_id, km, fecha) VALUES
  (@moto, 12000, @hace6meses),
  (@moto, 13300, NOW() - INTERVAL 4 MONTH),
  (@moto, 14500, NOW() - INTERVAL 2 MONTH),
  (@moto, 15400, NOW() - INTERVAL 3 DAY);

-- Se copia el plan base de motos (RN-05)
INSERT INTO partes_vehiculo (vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses, ultimo_cambio_km, ultimo_cambio_fecha)
SELECT @moto, codigo, nombre, intervalo_km, intervalo_meses, 12000, @hace6meses
FROM plan_base_partes WHERE tipo_vehiculo_id = 1;

-- Las pastillas se cambiaron mucho antes -> quedan VENCIDAS ("Requiere atención", RN-11)
UPDATE partes_vehiculo SET ultimo_cambio_km = 5300 WHERE vehiculo_id = @moto AND codigo = 'pastillas_freno';

-- Servicio de hace 2 meses: aceite + filtro de aire
INSERT INTO servicios (vehiculo_id, fecha, km, lugar)
VALUES (@moto, CURDATE() - INTERVAL 2 MONTH, 14500, 'Taller MotoExpress');
SET @servicio = LAST_INSERT_ID();

INSERT INTO cambios_parte (servicio_id, parte_id, costo, marca_referencia)
SELECT @servicio, id, 38000, 'Yamalube 10W-40' FROM partes_vehiculo WHERE vehiculo_id = @moto AND codigo = 'aceite_motor';
INSERT INTO cambios_parte (servicio_id, parte_id, costo, marca_referencia)
SELECT @servicio, id, 25000, 'Original Yamaha' FROM partes_vehiculo WHERE vehiculo_id = @moto AND nombre = 'Filtro de aire';

UPDATE partes_vehiculo SET ultimo_cambio_km = 14500, ultimo_cambio_fecha = CURDATE() - INTERVAL 2 MONTH
WHERE vehiculo_id = @moto AND (codigo = 'aceite_motor' OR nombre = 'Filtro de aire');

-- Documentos de la moto: SOAT vigente (vence en 5 meses) y primera RTM en 4 meses
INSERT INTO documentos (vehiculo_id, tipo, fecha_vencimiento) VALUES (@moto, 'soat', CURDATE() + INTERVAL 5 MONTH);
INSERT INTO renovaciones_documento (documento_id, fecha_vencimiento, fecha_pago, valor)
VALUES (LAST_INSERT_ID(), CURDATE() + INTERVAL 5 MONTH, CURDATE() - INTERVAL 7 MONTH, 420000);
INSERT INTO documentos (vehiculo_id, tipo, fecha_vencimiento) VALUES (@moto, 'rtm', CURDATE() + INTERVAL 4 MONTH);

-- ---------------------------------------------------------------------
-- CARRO: kilometraje sin actualizar hace 20 días -> se estima (RN-04)
-- ---------------------------------------------------------------------
INSERT INTO vehiculos (usuario_id, tipo_vehiculo_id, marca, modelo, anio, placa, fecha_matricula,
                       km_inicial, km_actual, km_actualizado_en, creado_en)
VALUES (@usuario, 2, 'Renault', 'Logan', 2019, 'JKL345', '2019-03-15',
        68000, 74500, NOW() - INTERVAL 20 DAY, @hace6meses);
SET @carro = LAST_INSERT_ID();

INSERT INTO lecturas_km (vehiculo_id, km, fecha) VALUES
  (@carro, 68000, @hace6meses),
  (@carro, 71200, NOW() - INTERVAL 3 MONTH),
  (@carro, 74500, NOW() - INTERVAL 20 DAY);

INSERT INTO partes_vehiculo (vehiculo_id, codigo, nombre, intervalo_km, intervalo_meses, ultimo_cambio_km, ultimo_cambio_fecha)
SELECT @carro, codigo, nombre, intervalo_km, intervalo_meses, 68000, @hace6meses
FROM plan_base_partes WHERE tipo_vehiculo_id = 2;

-- SOAT vence en 20 días (alerta de 30 días) y RTM VENCIDA hace 3 días -> "No apto para circular" (RN-11)
INSERT INTO documentos (vehiculo_id, tipo, fecha_vencimiento) VALUES (@carro, 'soat', CURDATE() + INTERVAL 20 DAY);
INSERT INTO renovaciones_documento (documento_id, fecha_vencimiento, fecha_pago, valor)
VALUES (LAST_INSERT_ID(), CURDATE() + INTERVAL 20 DAY, CURDATE() - INTERVAL 345 DAY, 680000);

INSERT INTO documentos (vehiculo_id, tipo, fecha_vencimiento) VALUES (@carro, 'rtm', CURDATE() - INTERVAL 3 DAY);
INSERT INTO renovaciones_documento (documento_id, fecha_vencimiento, fecha_pago, valor)
VALUES (LAST_INSERT_ID(), CURDATE() - INTERVAL 3 DAY, CURDATE() - INTERVAL 368 DAY, 290000);
