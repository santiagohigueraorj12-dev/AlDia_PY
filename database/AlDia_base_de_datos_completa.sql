-- =====================================================================
--  AlDía - Base de datos completa (MariaDB 10.6+ / MySQL 8)
--  Simon Higuera y Santiago Higuera - SENA ADSO - 2026
-- =====================================================================
--  Un solo archivo con toda la base: las 16 tablas, los catálogos
--  (tipos de vehículo, plan base de partes, reglas de la RTM), el
--  administrador y el usuario de demostración con una moto y un carro.
--  Es el mismo resultado de database/estructuraBD + database/semillas.
--
--  Cómo importarla en HeidiSQL: Archivo > Ejecutar archivo SQL... y
--  elegir este archivo. Crea la base "aldia".
--  Por consola:  mariadb -u root -p < AlDia_base_de_datos_completa.sql
--
--  OJO: si ya tienes una base "aldia", este archivo reemplaza sus tablas.
--
--  Usuarios: admin@aldia.co / Admin123*   ·   demo@aldia.co / Demo123*
--  (las contraseñas se guardan como hash de bcrypt)
--  No hace falta importarla para usar la app: el backend crea la base
--  solo la primera vez que se enciende.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `aldia` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `aldia`;

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;
DROP TABLE IF EXISTS `archivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `archivos` (
  `id` char(36) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `tamano` int(11) NOT NULL,
  `datos` longblob NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_archivo_usuario` (`usuario_id`),
  CONSTRAINT `fk_archivo_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `archivos` WRITE;
/*!40000 ALTER TABLE `archivos` DISABLE KEYS */;
/*!40000 ALTER TABLE `archivos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `cambios_parte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cambios_parte` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `servicio_id` int(11) NOT NULL,
  `parte_id` int(11) NOT NULL,
  `costo` decimal(12,2) NOT NULL DEFAULT 0.00,
  `marca_referencia` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_cambio_servicio` (`servicio_id`),
  KEY `fk_cambio_parte` (`parte_id`),
  CONSTRAINT `fk_cambio_parte` FOREIGN KEY (`parte_id`) REFERENCES `partes_vehiculo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cambio_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `cambios_parte` WRITE;
/*!40000 ALTER TABLE `cambios_parte` DISABLE KEYS */;
INSERT INTO `cambios_parte` VALUES (1,1,1,38000.00,'Yamalube 10W-40');
INSERT INTO `cambios_parte` VALUES (2,1,3,25000.00,'Original Yamaha');
/*!40000 ALTER TABLE `cambios_parte` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int(11) NOT NULL,
  `tipo` enum('soat','rtm','impuesto') NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `archivo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_documento_tipo` (`vehiculo_id`,`tipo`),
  CONSTRAINT `fk_documento_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `documentos` WRITE;
/*!40000 ALTER TABLE `documentos` DISABLE KEYS */;
INSERT INTO `documentos` VALUES (1,1,'soat','2027-04-26',NULL);
INSERT INTO `documentos` VALUES (2,1,'rtm','2027-03-26',NULL);
INSERT INTO `documentos` VALUES (3,2,'soat','2026-12-16',NULL);
INSERT INTO `documentos` VALUES (4,2,'rtm','2026-11-23',NULL);
/*!40000 ALTER TABLE `documentos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `lecturas_km`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lecturas_km` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int(11) NOT NULL,
  `km` int(11) NOT NULL,
  `fecha` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_lecturas_vehiculo` (`vehiculo_id`,`fecha`),
  CONSTRAINT `fk_lectura_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `lecturas_km` WRITE;
/*!40000 ALTER TABLE `lecturas_km` DISABLE KEYS */;
INSERT INTO `lecturas_km` VALUES (1,1,12000,'2026-05-26 00:00:00');
INSERT INTO `lecturas_km` VALUES (2,1,13300,'2026-07-26 06:59:48');
INSERT INTO `lecturas_km` VALUES (3,1,14500,'2026-09-26 06:59:48');
INSERT INTO `lecturas_km` VALUES (4,1,15400,'2026-11-23 06:59:48');
INSERT INTO `lecturas_km` VALUES (5,2,68000,'2026-05-26 00:00:00');
INSERT INTO `lecturas_km` VALUES (6,2,71200,'2026-08-26 06:59:48');
INSERT INTO `lecturas_km` VALUES (7,2,74500,'2026-11-06 06:59:48');
/*!40000 ALTER TABLE `lecturas_km` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `migraciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migraciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `archivo` varchar(150) NOT NULL,
  `ejecutada_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `archivo` (`archivo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `migraciones` WRITE;
/*!40000 ALTER TABLE `migraciones` DISABLE KEYS */;
INSERT INTO `migraciones` VALUES (1,'001_crear_tablas.sql','2026-11-26 06:59:48');
INSERT INTO `migraciones` VALUES (2,'002_actualizar_tablas.sql','2026-11-26 06:59:48');
INSERT INTO `migraciones` VALUES (3,'003_archivos_y_correos.sql','2026-11-26 06:59:48');
INSERT INTO `migraciones` VALUES (4,'004_revisiones_y_novedades.sql','2026-11-26 06:59:48');
INSERT INTO `migraciones` VALUES (5,'005_tipo_moto_y_cilindraje.sql','2026-11-26 06:59:48');
INSERT INTO `migraciones` VALUES (6,'006_factura_de_servicios.sql','2026-11-26 06:59:48');
/*!40000 ALTER TABLE `migraciones` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo` enum('parte','documento','kilometraje') NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensaje` varchar(500) NOT NULL,
  `enlace` varchar(150) DEFAULT NULL,
  `clave` varchar(150) NOT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `correo_enviado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notificacion_clave` (`usuario_id`,`clave`),
  KEY `ix_notif_usuario` (`usuario_id`,`leida`),
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `novedades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `novedades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int(11) NOT NULL,
  `parte_id` int(11) DEFAULT NULL,
  `tipo` enum('dano','accidente','otro') NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `descripcion` varchar(1000) DEFAULT NULL,
  `fecha` date NOT NULL,
  `km` int(11) NOT NULL,
  `estado` enum('pendiente','arreglada') NOT NULL DEFAULT 'pendiente',
  `foto_url` varchar(255) DEFAULT NULL,
  `arreglada_en` date DEFAULT NULL,
  `arreglada_km` int(11) DEFAULT NULL,
  `lugar` varchar(120) DEFAULT NULL,
  `costo` decimal(12,2) DEFAULT NULL,
  `servicio_id` int(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `impide_circular` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_novedad_vehiculo` (`vehiculo_id`),
  KEY `fk_novedad_parte` (`parte_id`),
  KEY `fk_novedad_servicio` (`servicio_id`),
  CONSTRAINT `fk_novedad_parte` FOREIGN KEY (`parte_id`) REFERENCES `partes_vehiculo` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_novedad_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_novedad_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `novedades` WRITE;
/*!40000 ALTER TABLE `novedades` DISABLE KEYS */;
/*!40000 ALTER TABLE `novedades` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `partes_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `partes_vehiculo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int(11) NOT NULL,
  `codigo` varchar(30) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `intervalo_km` int(11) DEFAULT NULL,
  `intervalo_meses` int(11) NOT NULL,
  `ultimo_cambio_km` int(11) NOT NULL,
  `ultimo_cambio_fecha` date NOT NULL,
  `ultimo_cambio_conocido` tinyint(1) NOT NULL DEFAULT 1,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `ultima_revision_fecha` date DEFAULT NULL,
  `ultima_revision_km` int(11) DEFAULT NULL,
  `revisar_en` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_parte_vehiculo` (`vehiculo_id`),
  CONSTRAINT `fk_parte_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_parte_km` CHECK (`intervalo_km` is null or `intervalo_km` > 0),
  CONSTRAINT `ck_parte_meses` CHECK (`intervalo_meses` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `partes_vehiculo` WRITE;
/*!40000 ALTER TABLE `partes_vehiculo` DISABLE KEYS */;
INSERT INTO `partes_vehiculo` VALUES (1,1,'aceite_motor','Aceite de motor',3000,3,14500,'2026-09-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (2,1,'filtro_aceite','Filtro de aceite',6000,6,12000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (3,1,NULL,'Filtro de aire',6000,6,14500,'2026-09-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (4,1,NULL,'Bujía',8000,12,12000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (5,1,'pastillas_freno','Pastillas de freno',10000,12,5300,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (6,1,'correa_cvt','Correa de transmisión (CVT)',20000,24,12000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (7,1,'rodillos_variador','Rodillos del variador',20000,24,12000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (8,1,'aceite_transmision','Aceite de la transmisión final',6000,12,12000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (9,1,'llantas','Llantas',15000,36,12000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (10,1,NULL,'Líquido de frenos',NULL,24,12000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (11,1,NULL,'Batería',NULL,24,12000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (16,2,'aceite_motor','Aceite de motor',5000,6,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (17,2,'filtro_aceite','Filtro de aceite',5000,6,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (18,2,NULL,'Alineación y balanceo',10000,12,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (19,2,NULL,'Filtro de aire',15000,12,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (20,2,NULL,'Filtro de combustible',20000,24,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (21,2,'pastillas_freno','Pastillas de freno',30000,24,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (22,2,NULL,'Bujías',40000,36,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (23,2,NULL,'Refrigerante',40000,24,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (24,2,'llantas','Llantas',50000,60,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (25,2,NULL,'Correa de distribución',60000,60,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (26,2,NULL,'Líquido de frenos',NULL,24,68000,'2026-05-26',1,1,NULL,NULL,NULL);
INSERT INTO `partes_vehiculo` VALUES (27,2,NULL,'Batería',NULL,36,68000,'2026-05-26',1,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `partes_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `plan_base_partes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_base_partes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_vehiculo_id` int(11) NOT NULL,
  `codigo` varchar(30) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `intervalo_km` int(11) DEFAULT NULL,
  `intervalo_meses` int(11) NOT NULL,
  `subtipo` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_plan_tipo` (`tipo_vehiculo_id`),
  CONSTRAINT `fk_plan_tipo` FOREIGN KEY (`tipo_vehiculo_id`) REFERENCES `tipos_vehiculo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_plan_km` CHECK (`intervalo_km` is null or `intervalo_km` > 0),
  CONSTRAINT `ck_plan_meses` CHECK (`intervalo_meses` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `plan_base_partes` WRITE;
/*!40000 ALTER TABLE `plan_base_partes` DISABLE KEYS */;
INSERT INTO `plan_base_partes` VALUES (1,1,'aceite_motor','Aceite de motor',3000,3,NULL);
INSERT INTO `plan_base_partes` VALUES (2,1,'filtro_aceite','Filtro de aceite',6000,6,NULL);
INSERT INTO `plan_base_partes` VALUES (3,1,NULL,'Filtro de aire',6000,6,NULL);
INSERT INTO `plan_base_partes` VALUES (4,1,NULL,'Bujía',8000,12,NULL);
INSERT INTO `plan_base_partes` VALUES (5,1,'pastillas_freno','Pastillas de freno',10000,12,NULL);
INSERT INTO `plan_base_partes` VALUES (6,1,'kit_arrastre','Kit de arrastre (cadena, piñón y corona)',20000,24,'cambios');
INSERT INTO `plan_base_partes` VALUES (7,1,'lubricar_cadena','Lubricar y ajustar la cadena',1000,2,'cambios');
INSERT INTO `plan_base_partes` VALUES (8,1,'correa_cvt','Correa de transmisión (CVT)',20000,24,'automatica');
INSERT INTO `plan_base_partes` VALUES (9,1,'rodillos_variador','Rodillos del variador',20000,24,'automatica');
INSERT INTO `plan_base_partes` VALUES (10,1,'aceite_transmision','Aceite de la transmisión final',6000,12,'automatica');
INSERT INTO `plan_base_partes` VALUES (11,1,'llantas','Llantas',15000,36,NULL);
INSERT INTO `plan_base_partes` VALUES (12,1,NULL,'Líquido de frenos',NULL,24,NULL);
INSERT INTO `plan_base_partes` VALUES (13,1,NULL,'Batería',NULL,24,NULL);
INSERT INTO `plan_base_partes` VALUES (14,2,'aceite_motor','Aceite de motor',5000,6,NULL);
INSERT INTO `plan_base_partes` VALUES (15,2,'filtro_aceite','Filtro de aceite',5000,6,NULL);
INSERT INTO `plan_base_partes` VALUES (16,2,NULL,'Alineación y balanceo',10000,12,NULL);
INSERT INTO `plan_base_partes` VALUES (17,2,NULL,'Filtro de aire',15000,12,NULL);
INSERT INTO `plan_base_partes` VALUES (18,2,NULL,'Filtro de combustible',20000,24,NULL);
INSERT INTO `plan_base_partes` VALUES (19,2,'pastillas_freno','Pastillas de freno',30000,24,NULL);
INSERT INTO `plan_base_partes` VALUES (20,2,NULL,'Bujías',40000,36,NULL);
INSERT INTO `plan_base_partes` VALUES (21,2,NULL,'Refrigerante',40000,24,NULL);
INSERT INTO `plan_base_partes` VALUES (22,2,'llantas','Llantas',50000,60,NULL);
INSERT INTO `plan_base_partes` VALUES (23,2,NULL,'Correa de distribución',60000,60,NULL);
INSERT INTO `plan_base_partes` VALUES (24,2,NULL,'Líquido de frenos',NULL,24,NULL);
INSERT INTO `plan_base_partes` VALUES (25,2,NULL,'Batería',NULL,36,NULL);
/*!40000 ALTER TABLE `plan_base_partes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `reglas_rtm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reglas_rtm` (
  `tipo_vehiculo_id` int(11) NOT NULL,
  `anios_primera` int(11) NOT NULL,
  PRIMARY KEY (`tipo_vehiculo_id`),
  CONSTRAINT `fk_rtm_tipo` FOREIGN KEY (`tipo_vehiculo_id`) REFERENCES `tipos_vehiculo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `reglas_rtm` WRITE;
/*!40000 ALTER TABLE `reglas_rtm` DISABLE KEYS */;
INSERT INTO `reglas_rtm` VALUES (1,2);
INSERT INTO `reglas_rtm` VALUES (2,5);
/*!40000 ALTER TABLE `reglas_rtm` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `renovaciones_documento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `renovaciones_documento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `documento_id` int(11) NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `fecha_pago` date NOT NULL,
  `valor` decimal(12,2) NOT NULL DEFAULT 0.00,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_renovacion_documento` (`documento_id`),
  CONSTRAINT `fk_renovacion_documento` FOREIGN KEY (`documento_id`) REFERENCES `documentos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `renovaciones_documento` WRITE;
/*!40000 ALTER TABLE `renovaciones_documento` DISABLE KEYS */;
INSERT INTO `renovaciones_documento` VALUES (1,1,'2027-04-26','2026-04-26',420000.00,'2026-11-26 06:59:48');
INSERT INTO `renovaciones_documento` VALUES (2,3,'2026-12-16','2025-12-16',680000.00,'2026-11-26 06:59:48');
INSERT INTO `renovaciones_documento` VALUES (3,4,'2026-11-23','2025-11-23',290000.00,'2026-11-26 06:59:48');
/*!40000 ALTER TABLE `renovaciones_documento` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `revisiones_parte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `revisiones_parte` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parte_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `km` int(11) NOT NULL,
  `revisar_en` date NOT NULL,
  `nota` varchar(255) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_revision_parte` (`parte_id`),
  CONSTRAINT `fk_revision_parte` FOREIGN KEY (`parte_id`) REFERENCES `partes_vehiculo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `revisiones_parte` WRITE;
/*!40000 ALTER TABLE `revisiones_parte` DISABLE KEYS */;
/*!40000 ALTER TABLE `revisiones_parte` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehiculo_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `km` int(11) NOT NULL,
  `lugar` varchar(120) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `archivo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_servicio_vehiculo` (`vehiculo_id`),
  CONSTRAINT `fk_servicio_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
INSERT INTO `servicios` VALUES (1,1,'2026-09-26',14500,'Taller MotoExpress','2026-11-26 06:59:48',NULL);
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `tipos_vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_vehiculo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `tipos_vehiculo` WRITE;
/*!40000 ALTER TABLE `tipos_vehiculo` DISABLE KEYS */;
INSERT INTO `tipos_vehiculo` VALUES (2,'Carro');
INSERT INTO `tipos_vehiculo` VALUES (1,'Moto');
/*!40000 ALTER TABLE `tipos_vehiculo` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `tipo_documento` enum('CC','CE','TI','PA','PPT') DEFAULT NULL,
  `numero_documento` varchar(15) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `departamento` varchar(60) DEFAULT NULL,
  `ciudad` varchar(80) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `licencia_categoria` enum('A1','A2','B1','B2','B3','C1','C2','C3') DEFAULT NULL,
  `licencia_vence` date DEFAULT NULL,
  `password_hash` varchar(100) NOT NULL,
  `rol` enum('usuario','admin') NOT NULL DEFAULT 'usuario',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `acepta_datos_en` datetime NOT NULL,
  `token_recuperacion` varchar(64) DEFAULT NULL,
  `token_expira_en` datetime DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','admin@aldia.co',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'$2b$10$kimQsnr7RI6J874nhii5Qek.ZsDhPE0dC2mtcAsgMT7HkIxuwaBRu','admin',1,'2026-11-26 06:59:48',NULL,NULL,'2026-11-26 06:59:48');
INSERT INTO `usuarios` VALUES (2,'Usuario Demo','demo@aldia.co','3001234567',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'$2b$10$XbV030oiBD5OworowtETeeDCD5G69wR8.1F3EK4/zsy//kCNhpXWm','usuario',1,'2026-11-26 06:59:48',NULL,NULL,'2026-11-26 06:59:48');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo_vehiculo_id` int(11) NOT NULL,
  `marca` varchar(50) NOT NULL,
  `linea` varchar(50) NOT NULL,
  `modelo` smallint(6) NOT NULL,
  `placa` varchar(10) NOT NULL,
  `fecha_matricula` date NOT NULL,
  `km_inicial` int(11) NOT NULL,
  `km_actual` int(11) NOT NULL,
  `km_actualizado_en` datetime NOT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `subtipo` varchar(20) DEFAULT NULL,
  `cilindraje` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `placa` (`placa`),
  KEY `fk_vehiculo_usuario` (`usuario_id`),
  KEY `fk_vehiculo_tipo` (`tipo_vehiculo_id`),
  CONSTRAINT `fk_vehiculo_tipo` FOREIGN KEY (`tipo_vehiculo_id`) REFERENCES `tipos_vehiculo` (`id`),
  CONSTRAINT `fk_vehiculo_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `vehiculos` WRITE;
/*!40000 ALTER TABLE `vehiculos` DISABLE KEYS */;
INSERT INTO `vehiculos` VALUES (1,2,1,'Yamaha','NMAX 155',2024,'ABC12D','2025-03-26',12000,15400,'2026-11-23 06:59:48',NULL,'2026-05-26 00:00:00','automatica',155);
INSERT INTO `vehiculos` VALUES (2,2,2,'Renault','Logan',2019,'JKL345','2019-03-15',68000,74500,'2026-11-06 06:59:48',NULL,'2026-05-26 00:00:00',NULL,1600);
/*!40000 ALTER TABLE `vehiculos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

