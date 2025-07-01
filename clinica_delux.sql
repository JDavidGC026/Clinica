-- Adminer 4.8.1 MySQL 8.0.42-0ubuntu0.24.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `patient_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `professional_id` int DEFAULT NULL,
  `professional_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `status` enum('programada','en-progreso','completada','cancelada') COLLATE utf8mb4_unicode_ci DEFAULT 'programada',
  `payment_status` enum('pendiente','pagado','cancelado_sin_costo') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `cost` decimal(10,2) DEFAULT NULL,
  `folio` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `folio` (`folio`),
  KEY `idx_date_time` (`date`,`time`),
  KEY `idx_professional_date` (`professional_id`,`date`),
  KEY `idx_patient_date` (`patient_id`,`date`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_folio` (`folio`),
  KEY `idx_appointments_prof_date_status` (`professional_id`,`date`,`status`),
  KEY `idx_appointments_patient_date_status` (`patient_id`,`date`,`status`),
  KEY `idx_appointments_payment_date` (`payment_status`,`date`,`cost`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`professional_id`) REFERENCES `professionals` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `appointments` (`id`, `patient_id`, `patient_name`, `patient_email`, `patient_phone`, `professional_id`, `professional_name`, `date`, `time`, `type`, `notes`, `status`, `payment_status`, `cost`, `folio`, `created_at`, `updated_at`) VALUES
(1,	1,	'Juan Pérez González',	'juan.perez@email.com',	'+52 55 1111 2222',	1,	'Dr. Ana García Martínez',	'2025-06-20',	'10:00:00',	'consulta-inicial',	'Primera consulta psicológica',	'programada',	'pendiente',	800.00,	'GMD-250619-7156',	'2025-06-19 22:02:11',	'2025-06-19 22:02:11'),
(2,	2,	'Ana Martínez Silva',	'ana.martinez@email.com',	'+52 55 5555 6666',	2,	'Dr. Carlos Ruiz López',	'2025-06-21',	'14:30:00',	'consulta-inicial',	'Consulta general de rutina',	'programada',	'pendiente',	600.00,	'GMD-250619-B68F',	'2025-06-19 22:02:11',	'2025-06-19 22:02:11'),
(3,	3,	'Roberto García Mendoza',	'roberto.garcia@email.com',	'+52 55 9999 0000',	3,	'Dra. María Elena Fernández',	'2025-06-22',	'09:00:00',	'seguimiento',	'Control de diabetes',	'programada',	'pendiente',	700.00,	'GMD-250619-A0DF',	'2025-06-19 22:02:11',	'2025-06-19 22:02:11'),
(4,	1,	'Juan Pérez González',	'juan.perez@email.com',	'+52 55 1111 2222',	1,	'Dr. Ana García Martínez',	'2025-06-20',	'10:00:00',	'consulta-inicial',	'Primera consulta psicológica',	'programada',	'pendiente',	800.00,	'GMD-250619-6C68',	'2025-06-19 22:06:03',	'2025-06-19 22:06:03'),
(5,	2,	'Ana Martínez Silva',	'ana.martinez@email.com',	'+52 55 5555 6666',	2,	'Dr. Carlos Ruiz López',	'2025-06-21',	'14:30:00',	'consulta-inicial',	'Consulta general de rutina',	'programada',	'pendiente',	600.00,	'GMD-250619-492C',	'2025-06-19 22:06:03',	'2025-06-19 22:06:03'),
(6,	3,	'Roberto García Mendoza',	'roberto.garcia@email.com',	'+52 55 9999 0000',	3,	'Dra. María Elena Fernández',	'2025-06-22',	'09:00:00',	'seguimiento',	'Control de diabetes',	'programada',	'pendiente',	700.00,	'GMD-250619-D2A0',	'2025-06-19 22:06:03',	'2025-06-19 22:06:03'),
(7,	1,	'Juan Pérez González',	'juan.perez@email.com',	'+52 55 1111 2222',	1,	'Dr. Ana García Martínez',	'2025-06-20',	'10:00:00',	'consulta-inicial',	'Primera consulta psicológica',	'programada',	'pendiente',	800.00,	'GMD-250619-48B0',	'2025-06-19 22:06:49',	'2025-06-19 22:06:49'),
(8,	2,	'Ana Martínez Silva',	'ana.martinez@email.com',	'+52 55 5555 6666',	2,	'Dr. Carlos Ruiz López',	'2025-06-21',	'14:30:00',	'consulta-inicial',	'Consulta general de rutina',	'programada',	'pendiente',	600.00,	'GMD-250619-599F',	'2025-06-19 22:06:49',	'2025-06-19 22:06:49'),
(9,	3,	'Roberto García Mendoza',	'roberto.garcia@email.com',	'+52 55 9999 0000',	3,	'Dra. María Elena Fernández',	'2025-06-22',	'09:00:00',	'seguimiento',	'Control de diabetes',	'programada',	'pendiente',	700.00,	'GMD-250619-C5DD',	'2025-06-19 22:06:49',	'2025-06-19 22:06:49'),
(10,	1,	'Juan Pérez González',	'juan.perez@email.com',	'+52 55 1111 2222',	1,	'Dr. Ana García Martínez',	'2025-06-20',	'10:00:00',	'consulta-inicial',	'Primera consulta psicológica',	'programada',	'pendiente',	800.00,	'GMD-250619-A9AF',	'2025-06-19 22:08:58',	'2025-06-19 22:08:58'),
(11,	2,	'Ana Martínez Silva',	'ana.martinez@email.com',	'+52 55 5555 6666',	2,	'Dr. Carlos Ruiz López',	'2025-06-21',	'14:30:00',	'consulta-inicial',	'Consulta general de rutina',	'programada',	'pendiente',	600.00,	'GMD-250619-C174',	'2025-06-19 22:08:58',	'2025-06-19 22:08:58'),
(12,	3,	'Roberto García Mendoza',	'roberto.garcia@email.com',	'+52 55 9999 0000',	3,	'Dra. María Elena Fernández',	'2025-06-22',	'09:00:00',	'seguimiento',	'Control de diabetes',	'programada',	'pendiente',	700.00,	'GMD-250619-9DED',	'2025-06-19 22:08:58',	'2025-06-19 22:08:58'),
(13,	1,	'Juan Pérez González',	'juan.perez@email.com',	'+52 55 1111 2222',	1,	'Dr. Ana García Martínez',	'2025-06-20',	'10:00:00',	'consulta-inicial',	'Primera consulta psicológica',	'programada',	'pendiente',	800.00,	'GMD-250619-BB35',	'2025-06-19 23:05:06',	'2025-06-19 23:05:06'),
(14,	2,	'Ana Martínez Silva',	'ana.martinez@email.com',	'+52 55 5555 6666',	2,	'Dr. Carlos Ruiz López',	'2025-06-21',	'14:30:00',	'consulta-inicial',	'Consulta general de rutina',	'programada',	'pendiente',	600.00,	'GMD-250619-A529',	'2025-06-19 23:05:06',	'2025-06-19 23:05:06'),
(15,	3,	'Roberto García Mendoza',	'roberto.garcia@email.com',	'+52 55 9999 0000',	3,	'Dra. María Elena Fernández',	'2025-06-22',	'09:00:00',	'seguimiento',	'Control de diabetes',	'programada',	'pendiente',	700.00,	'GMD-250619-2AF4',	'2025-06-19 23:05:06',	'2025-06-19 23:05:06'),
(16,	1,	'Juan Pérez González',	'juan.perez@email.com',	'+52 55 1111 2222',	1,	'Dr. Ana García Martínez',	'2025-06-20',	'10:00:00',	'consulta-inicial',	'Primera consulta psicológica',	'programada',	'pendiente',	800.00,	'GMD-250619-3EA1',	'2025-06-19 23:05:35',	'2025-06-19 23:05:35'),
(17,	2,	'Ana Martínez Silva',	'ana.martinez@email.com',	'+52 55 5555 6666',	2,	'Dr. Carlos Ruiz López',	'2025-06-21',	'14:30:00',	'consulta-inicial',	'Consulta general de rutina',	'programada',	'pendiente',	600.00,	'GMD-250619-ECD8',	'2025-06-19 23:05:35',	'2025-06-19 23:05:35'),
(18,	3,	'Roberto García Mendoza',	'roberto.garcia@email.com',	'+52 55 9999 0000',	3,	'Dra. María Elena Fernández',	'2025-06-22',	'09:00:00',	'seguimiento',	'Control de diabetes',	'programada',	'pendiente',	700.00,	'GMD-250619-B407',	'2025-06-19 23:05:35',	'2025-06-19 23:05:35'),
(19,	1,	'Juan Pérez González',	'juan.perez@email.com',	'+52 55 1111 2222',	1,	'Dr. Ana García Martínez',	'2025-06-20',	'10:00:00',	'consulta-inicial',	'Primera consulta psicológica',	'programada',	'pendiente',	800.00,	'GMD-250619-A2BE',	'2025-06-19 23:16:11',	'2025-06-19 23:16:11'),
(20,	2,	'Ana Martínez Silva',	'ana.martinez@email.com',	'+52 55 5555 6666',	2,	'Dr. Carlos Ruiz López',	'2025-06-21',	'14:30:00',	'consulta-inicial',	'Consulta general de rutina',	'programada',	'pendiente',	600.00,	'GMD-250619-BB68',	'2025-06-19 23:16:11',	'2025-06-19 23:16:11'),
(21,	3,	'Roberto García Mendoza',	'roberto.garcia@email.com',	'+52 55 9999 0000',	3,	'Dra. María Elena Fernández',	'2025-06-22',	'09:00:00',	'seguimiento',	'Control de diabetes',	'programada',	'pendiente',	700.00,	'GMD-250619-9C4E',	'2025-06-19 23:16:11',	'2025-06-19 23:16:11'),
(22,	NULL,	'Maria Marquez',	'mmarquex@gmail.com',	'5566778899',	27,	'Dr. Alejandro Montesinos Garcia',	'2025-07-05',	'08:00:00',	'consulta-inicial',	'',	'programada',	'pendiente',	650.00,	'GMD-250701-66AA',	'2025-07-01 16:38:38',	'2025-07-01 16:43:21');

DROP TABLE IF EXISTS `clinical_notes`;
CREATE TABLE `clinical_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `professional_id` int NOT NULL,
  `patient_id` int NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_professional_patient` (`professional_id`,`patient_id`),
  KEY `idx_professional` (`professional_id`),
  KEY `idx_patient` (`patient_id`),
  CONSTRAINT `clinical_notes_ibfk_1` FOREIGN KEY (`professional_id`) REFERENCES `professionals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clinical_notes_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `disciplines`;
CREATE TABLE `disciplines` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `email_history`;
CREATE TABLE `email_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('enviado','pendiente','error') COLLATE utf8mb4_unicode_ci DEFAULT 'enviado',
  PRIMARY KEY (`id`),
  KEY `idx_sent_at` (`sent_at`),
  KEY `idx_recipient` (`recipient`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_email_history_date_type` (`sent_at`,`type`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('egreso') COLLATE utf8mb4_unicode_ci DEFAULT 'egreso',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`date`),
  KEY `idx_category` (`category`),
  KEY `idx_amount` (`amount`),
  KEY `idx_expenses_date_category` (`date`,`category`,`amount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `patients`;
CREATE TABLE `patients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` enum('masculino','femenino','otro','prefiero-no-decir') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `emergency_contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medical_history` text COLLATE utf8mb4_unicode_ci,
  `allergies` text COLLATE utf8mb4_unicode_ci,
  `medications` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_name` (`name`),
  KEY `idx_phone` (`phone`),
  KEY `idx_patients_name_email` (`name`,`email`),
  KEY `idx_patients_name_search` (`name`(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `patients` (`id`, `name`, `email`, `phone`, `age`, `gender`, `address`, `emergency_contact`, `emergency_phone`, `medical_history`, `allergies`, `medications`, `notes`, `created_at`, `updated_at`) VALUES
(1,	'Juan Pérez González',	'juan.perez@email.com',	'+52 55 1111 2222',	35,	'masculino',	'Av. Reforma 123, Col. Centro, CDMX',	'María Pérez (Esposa)',	'+52 55 3333 4444',	'Hipertensión controlada',	'Penicilina',	'Losartán 50mg',	'Paciente colaborativo, puntual en citas',	'2025-06-19 22:02:11',	'2025-06-19 22:02:11'),
(2,	'Ana Martínez Silva',	'ana.martinez@email.com',	'+52 55 5555 6666',	28,	'femenino',	'Calle Insurgentes 456, Col. Roma Norte, CDMX',	'Carlos Martínez (Hermano)',	'+52 55 7777 8888',	'Sin antecedentes relevantes',	'Ninguna conocida',	'Ninguna',	'Primera consulta, derivada por medicina general',	'2025-06-19 22:02:11',	'2025-06-19 22:02:11'),
(3,	'Roberto García Mendoza',	'roberto.garcia@email.com',	'+52 55 9999 0000',	42,	'masculino',	'Av. Universidad 789, Col. Del Valle, CDMX',	'Laura García (Esposa)',	'+52 55 1234 9876',	'Diabetes tipo 2, diagnosticada hace 3 años',	'Sulfonamidas',	'Metformina 850mg, Glibenclamida 5mg',	'Requiere seguimiento nutricional',	'2025-06-19 22:02:11',	'2025-06-19 22:02:11'),
(22,	'Carlos Rodríguez Sánchez',	'carlos.rodriguez@email.com',	'+52 55 9999 0000',	42,	'masculino',	'Av. Universidad 789, Col. Del Valle, CDMX',	'Laura Rodríguez',	'+52 55 1234 5678',	'Diabetes tipo 2',	'Penicilina',	'Metformina 850mg',	'Control mensual',	'2025-06-30 16:00:51',	'2025-06-30 16:00:51'),
(23,	'María González Hernández',	'maria.gonzalez@email.com',	'+52 55 2468 1357',	31,	'femenino',	'Calle Madero 321, Col. Centro, CDMX',	'José González',	'+52 55 9876 5432',	'Ninguna',	'Mariscos',	'Vitaminas prenatales',	'Embarazo de 20 semanas',	'2025-06-30 16:00:51',	'2025-06-30 16:00:51'),
(24,	'Pedro Jiménez Morales',	'pedro.jimenez@email.com',	'+52 55 1357 2468',	55,	'masculino',	'Av. Patriotismo 654, Col. San Pedro, CDMX',	'Carmen Jiménez',	'+52 55 5432 1098',	'Artritis reumatoide',	'Aspirina',	'Metotrexato',	'Seguimiento reumatológico',	'2025-06-30 16:00:51',	'2025-06-30 16:00:51'),
(26,	'Ana Dalay Hernandez Hernandez',	'anadalay@gmail.com',	'5678543256',	22,	'femenino',	'sdnjdaka',	'jdakdajdn',	'5676545676',	' jadbhdasbhasabj',	'768',	'yughjh',	'jhjhj',	'2025-07-01 16:39:41',	'2025-07-01 16:39:41');

DROP TABLE IF EXISTS `professionals`;
CREATE TABLE `professionals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discipline_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule` json DEFAULT NULL,
  `status` enum('activo','inactivo') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_discipline` (`discipline_id`),
  KEY `idx_status` (`status`),
  KEY `idx_professionals_status_discipline` (`status`,`discipline_id`),
  KEY `idx_professionals_name_search` (`name`(50)),
  CONSTRAINT `professionals_ibfk_1` FOREIGN KEY (`discipline_id`) REFERENCES `disciplines` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2025-07-01 16:47:22
