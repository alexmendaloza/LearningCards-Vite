-- =========================================================
-- LearningCards / NovaLearn
-- Script completo de base de datos para phpMyAdmin
-- =========================================================
-- Este script:
--   - Borra y recrea la base de datos completa.
--   - Crea todas las tablas necesarias.
--   - Inserta usuarios demo reales en la tabla Usuario.
--   - Inserta mazos completos con 3-4 tarjetas.
--   - Inserta publicaciones, compras, sesiones de estudio y valoraciones.
--   - Incluye usuarios activos y desactivados por borrado logico (activo = 0).
--   - Incluye mazos activos y mazos con borrado logico (enColeccion = 0).
--   - Recrea copias adquiridas desde Marketplace con sus tarjetas y opciones JSON.
--
-- IMPORTANTE:
--   Ejecutar en phpMyAdmin desde la pestana SQL.
--   Si quieres otro nombre de BD, cambia learning_cards_react en las lineas DROP/CREATE/USE.
--
-- Credenciales demo:
--   Password para todos los usuarios: 123456
--   Admin: admin@gmail.com
--   Usuarios: eva@gmail.com, camila@gmail.com, max@gmail.com,
--             pedro@gmail.com, zalo@gmail.com
--   Nota: pedro se inserta desactivado para probar la restauracion desde Administracion.
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS learning_cards_react;
CREATE DATABASE learning_cards_react
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE learning_cards_react;

-- =========================================================
-- TABLAS
-- =========================================================

CREATE TABLE NivelRacha (
  IDNivel BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombreNivel VARCHAR(60) NOT NULL,
  diasReq INT NOT NULL DEFAULT 0,
  PRIMARY KEY (IDNivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Usuario (
  IDUsuario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  UserName VARCHAR(50) NOT NULL UNIQUE,
  NombreCompleto VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  fechanac DATE NOT NULL,
  genero ENUM('M','F','O') NOT NULL,
  fotoruta VARCHAR(255) NULL,
  rachaActual INT NOT NULL DEFAULT 0,
  ultDiaEst DATE NULL,
  IDNivel BIGINT UNSIGNED NOT NULL DEFAULT 1,
  rol ENUM('user','admin') NOT NULL DEFAULT 'user',
  activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Activo, 0 = Borrado Logico',
  total_estudiadas INT NOT NULL DEFAULT 0,
  aciertos_totales INT NOT NULL DEFAULT 0,
  PRIMARY KEY (IDUsuario),
  CONSTRAINT usuario_nivel_fk FOREIGN KEY (IDNivel) REFERENCES NivelRacha(IDNivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Mazo (
  IDMazo BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  limite INT NOT NULL DEFAULT 0,
  IDUsuario BIGINT UNSIGNED NOT NULL,
  original TINYINT(1) NOT NULL DEFAULT 1,
  enColeccion TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (IDMazo),
  CONSTRAINT mazo_usuario_fk FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Tarjeta (
  IDTarjeta BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  frente TEXT NOT NULL,
  reverso TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'basica',
  opciones JSON NULL,
  orden INT NOT NULL DEFAULT 1,
  IDMazo BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (IDTarjeta),
  CONSTRAINT tarjeta_mazo_fk FOREIGN KEY (IDMazo) REFERENCES Mazo(IDMazo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Publicacion (
  id_Publ BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  publico TINYINT(1) NOT NULL DEFAULT 1,
  pago TINYINT(1) NOT NULL DEFAULT 0,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  categoria VARCHAR(60) NULL,
  descripcion_publica TEXT NULL,
  imagen_url VARCHAR(300) NULL,
  fecha_publicacion DATETIME NOT NULL,
  fk_id_mazo BIGINT UNSIGNED NOT NULL,
  fk_id_usuario BIGINT UNSIGNED NOT NULL,
  promedio_valoracion DECIMAL(4,2) NOT NULL DEFAULT 0,
  num_valoraciones INT NOT NULL DEFAULT 0,
  num_compras INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id_Publ),
  KEY publicacion_mazo_idx (fk_id_mazo),
  KEY publicacion_usuario_idx (fk_id_usuario),
  CONSTRAINT publicacion_mazo_fk FOREIGN KEY (fk_id_mazo) REFERENCES Mazo(IDMazo) ON DELETE CASCADE,
  CONSTRAINT publicacion_usuario_fk FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(IDUsuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Compra (
  id_Compra BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fechaCompra DATETIME NOT NULL,
  precioPagado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estado VARCHAR(20) NOT NULL DEFAULT 'completada',
  nombre_titular VARCHAR(100) NULL,
  ultimos_digitos VARCHAR(4) NULL,
  fk_id_usuario BIGINT UNSIGNED NOT NULL,
  fk_id_publicacion BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_Compra),
  UNIQUE KEY unique_compra_usuario_publicacion (fk_id_usuario, fk_id_publicacion),
  CONSTRAINT compra_usuario_fk FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(IDUsuario) ON DELETE CASCADE,
  CONSTRAINT compra_publicacion_fk FOREIGN KEY (fk_id_publicacion) REFERENCES Publicacion(id_Publ) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE SesionEstudio (
  IDSesion BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fechaIni DATETIME NOT NULL,
  fechafin DATETIME NOT NULL,
  aciertos INT NOT NULL DEFAULT 0,
  fallos INT NOT NULL DEFAULT 0,
  totalTarjetas INT NOT NULL DEFAULT 0,
  IDUsuario BIGINT UNSIGNED NOT NULL,
  IDMazo BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (IDSesion),
  CONSTRAINT sesion_usuario_fk FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario) ON DELETE CASCADE,
  CONSTRAINT sesion_mazo_fk FOREIGN KEY (IDMazo) REFERENCES Mazo(IDMazo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE Valoracion (
  id_Val BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  puntuacion TINYINT NOT NULL,
  comentario TEXT NULL,
  fecha DATETIME NOT NULL,
  fk_id_usuario BIGINT UNSIGNED NOT NULL,
  fk_id_publicacion BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_Val),
  UNIQUE KEY unique_valoracion (fk_id_usuario, fk_id_publicacion),
  CONSTRAINT valoracion_usuario_fk FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(IDUsuario) ON DELETE CASCADE,
  CONSTRAINT valoracion_publicacion_fk FOREIGN KEY (fk_id_publicacion) REFERENCES Publicacion(id_Publ) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- DATOS BASE
-- =========================================================

INSERT INTO NivelRacha (IDNivel, nombreNivel, diasReq) VALUES
(1, 'Novato', 0),
(2, 'Constante', 3),
(3, 'En llamas', 7),
(4, 'Maestro', 15),
(5, 'Leyenda', 30);

-- Password bcrypt para todos: 123456
INSERT INTO Usuario
  (IDUsuario, UserName, NombreCompleto, email, contrasena, fechanac, genero, fotoruta, rachaActual, ultDiaEst, IDNivel, rol, activo, total_estudiadas, aciertos_totales)
VALUES
(1, 'admin', 'Administrador NovaLearn', 'admin@gmail.com', '$2b$10$vFD9fWB1cK81YMpZYOKleeKkhOK/77aZqCMYNaYpbAtou/l8lpzlS', '1990-01-01', 'O', NULL, 0, CURDATE(), 1, 'admin', 1, 0, 0),
(2, 'eva', 'Eva Evangeli Evelia', 'eva@gmail.com', '$2b$10$vFD9fWB1cK81YMpZYOKleeKkhOK/77aZqCMYNaYpbAtou/l8lpzlS', '2001-04-12', 'F', NULL, 6, CURDATE(), 2, 'user', 1, 34, 27),
(3, 'camila', 'Camila Torres', 'camila@gmail.com', '$2b$10$vFD9fWB1cK81YMpZYOKleeKkhOK/77aZqCMYNaYpbAtou/l8lpzlS', '2000-08-22', 'F', NULL, 9, CURDATE(), 3, 'user', 1, 42, 35),
(4, 'max', 'Max Rodriguez', 'max@gmail.com', '$2b$10$vFD9fWB1cK81YMpZYOKleeKkhOK/77aZqCMYNaYpbAtou/l8lpzlS', '1999-11-05', 'M', NULL, 3, CURDATE(), 2, 'user', 1, 19, 14),
(5, 'pedro', 'Pedro Castillo', 'pedro@gmail.com', '$2b$10$vFD9fWB1cK81YMpZYOKleeKkhOK/77aZqCMYNaYpbAtou/l8lpzlS', '2002-02-18', 'M', NULL, 1, CURDATE(), 1, 'user', 0, 12, 8),
(6, 'zalo', 'Zalo Mendoza', 'zalo@gmail.com', '$2b$10$vFD9fWB1cK81YMpZYOKleeKkhOK/77aZqCMYNaYpbAtou/l8lpzlS', '1998-06-30', 'M', NULL, 16, CURDATE(), 4, 'user', 1, 58, 49);

-- =========================================================
-- MAZOS
-- =========================================================

INSERT INTO Mazo (IDMazo, titulo, descripcion, limite, IDUsuario, original, enColeccion) VALUES
(1, 'Estructuras de Datos en JavaScript', 'Listas, pilas, colas y complejidad basica para desarrollo web.', 0, 4, 1, 1),
(2, 'Anatomia Humana - Sistema Oseo', 'Repaso esencial del sistema oseo humano.', 0, 3, 1, 1),
(3, 'Ingles de Negocios - Phrasal Verbs', 'Phrasal verbs utiles para ambientes profesionales.', 0, 2, 1, 1),
(4, 'Algebra Lineal y Matrices', 'Conceptos de matrices, vectores y determinantes.', 0, 6, 1, 1),
(5, 'Conceptos Esenciales de React', 'Hooks, componentes y estado en aplicaciones React.', 0, 5, 1, 1),
(6, 'Vocabulario TOEFL Avanzado', 'Sinonimos, antonimos y vocabulario academico.', 0, 2, 1, 1),
(7, 'Historia Universal - Revoluciones', 'Eventos historicos y procesos sociales clave.', 0, 6, 1, 1),
(8, 'Biologia Celular', 'Organelos, membrana y procesos celulares.', 0, 3, 1, 1),
(9, 'Mazo Eliminado - Auditoria Admin', 'Mazo marcado como borrado logico para probar recuperacion.', 0, 5, 1, 0),
(10, 'Quimica General Basica', 'Elementos, enlaces y reacciones introductorias.', 0, 4, 1, 1);

-- =========================================================
-- TARJETAS
-- =========================================================

INSERT INTO Tarjeta (IDTarjeta, frente, reverso, tipo, opciones, orden, IDMazo) VALUES
(1, 'Estructura LIFO usada para insertar y retirar elementos por el mismo extremo.', 'Pila', 'basica', NULL, 1, 1),
(2, 'Estructura FIFO usada para atender elementos en orden de llegada.', 'Cola', 'opcion_multiple', JSON_ARRAY('Pila', 'Cola', 'Arbol', 'Grafo'), 2, 1),
(3, 'Complejidad de acceder por indice en un arreglo.', 'O(1)', 'escritura', NULL, 3, 1),
(4, 'Estructura compuesta por nodos y aristas.', 'Grafo', 'basica', NULL, 4, 1),

(5, 'Cuantos huesos tiene aproximadamente el cuerpo humano adulto?', '206', 'opcion_multiple', JSON_ARRAY('106', '206', '306', '406'), 1, 2),
(6, 'Hueso mas largo del cuerpo humano.', 'Femur', 'escritura', NULL, 2, 2),
(7, 'Parte del esqueleto que protege el cerebro.', 'Craneo', 'basica', NULL, 3, 2),
(8, 'Huesos que protegen los pulmones y el corazon.', 'Costillas', 'basica', NULL, 4, 2),

(9, 'Meaning of "carry out".', 'Perform', 'opcion_multiple', JSON_ARRAY('Cancel', 'Perform', 'Delay', 'Forget'), 1, 3),
(10, 'Meaning of "set up".', 'Establish', 'basica', NULL, 2, 3),
(11, 'Opposite of "amplify".', 'Reduce', 'escritura', NULL, 3, 3),

(12, 'Una matriz cuadrada tiene el mismo numero de:', 'Filas y columnas', 'basica', NULL, 1, 4),
(13, 'El determinante solo se calcula en matrices:', 'Cuadradas', 'opcion_multiple', JSON_ARRAY('Rectangulares', 'Cuadradas', 'Nulas', 'Aumentadas'), 2, 4),
(14, 'Vector con magnitud igual a cero.', 'Vector nulo', 'escritura', NULL, 3, 4),
(15, 'Matriz que tiene unos en la diagonal principal y ceros en el resto.', 'Matriz identidad', 'basica', NULL, 4, 4),

(16, 'Hook usado para manejar estado local en React.', 'useState', 'basica', NULL, 1, 5),
(17, 'Hook usado para ejecutar efectos secundarios.', 'useEffect', 'opcion_multiple', JSON_ARRAY('useState', 'useEffect', 'useMemo', 'useRef'), 2, 5),
(18, 'Archivo principal comun en un proyecto Vite React.', 'main.jsx', 'escritura', NULL, 3, 5),

(19, 'Synonym of "abundant".', 'Plentiful', 'opcion_multiple', JSON_ARRAY('Rare', 'Plentiful', 'Weak', 'Brief'), 1, 6),
(20, 'Opposite of "expand".', 'Contract', 'escritura', NULL, 2, 6),
(21, 'Synonym of "reliable".', 'Trustworthy', 'basica', NULL, 3, 6),
(22, 'Synonym of "brief".', 'Short', 'opcion_multiple', JSON_ARRAY('Long', 'Short', 'Heavy', 'Complex'), 4, 6),

(23, 'Ano en que inicio la Revolucion Francesa.', '1789', 'escritura', NULL, 1, 7),
(24, 'Documento asociado con derechos ciudadanos en la Revolucion Francesa.', 'Declaracion de los Derechos del Hombre y del Ciudadano', 'basica', NULL, 2, 7),
(25, 'Imperio gobernado por Napoleon Bonaparte.', 'Francia', 'opcion_multiple', JSON_ARRAY('Espana', 'Francia', 'Italia', 'Portugal'), 3, 7),

(26, 'Organelo encargado de producir energia en la celula.', 'Mitocondria', 'basica', NULL, 1, 8),
(27, 'La membrana celular esta formada principalmente por:', 'Fosfolipidos', 'opcion_multiple', JSON_ARRAY('Proteinas', 'Fosfolipidos', 'Glucosa', 'ADN'), 2, 8),
(28, 'Proceso por el cual una celula se divide en dos celulas hijas identicas.', 'Mitosis', 'escritura', NULL, 3, 8),
(29, 'Estructura que contiene la informacion genetica en celulas eucariotas.', 'Nucleo', 'basica', NULL, 4, 8),

(30, 'Valor de enColeccion para que un mazo aparezca como borrado.', '0', 'opcion_multiple', JSON_ARRAY('0', '1', '2', 'NULL'), 1, 9),
(31, 'Accion administrativa para volver a activar un mazo borrado.', 'Recuperar', 'escritura', NULL, 2, 9),
(32, 'El borrado logico conserva el registro en la tabla Mazo.', 'Verdadero', 'basica', NULL, 3, 9),

(33, 'Particula con carga negativa.', 'Electron', 'basica', NULL, 1, 10),
(34, 'Tipo de enlace donde se comparten electrones.', 'Covalente', 'opcion_multiple', JSON_ARRAY('Ionico', 'Covalente', 'Metalico', 'Nuclear'), 2, 10),
(35, 'Simbolo quimico del sodio.', 'Na', 'escritura', NULL, 3, 10);

-- =========================================================
-- PUBLICACIONES
-- =========================================================

INSERT INTO Publicacion
  (id_Publ, publico, pago, precio, categoria, descripcion_publica, imagen_url, fecha_publicacion, fk_id_mazo, fk_id_usuario, promedio_valoracion, num_valoraciones, num_compras)
VALUES
(1, 1, 0, 0.00, 'Technology', 'Mazo gratuito para repasar estructuras de datos en JavaScript.', NULL, '2026-05-01 09:00:00', 1, 4, 4.50, 2, 2),
(2, 1, 1, 9.99, 'Medical', 'Tarjetas practicas para estudiar anatomia y sistema oseo.', NULL, '2026-05-02 10:30:00', 2, 3, 4.67, 3, 3),
(3, 1, 1, 14.99, 'Languages', 'Phrasal verbs utiles para entrevistas y reuniones de trabajo.', NULL, '2026-05-03 12:00:00', 3, 2, 4.00, 2, 1),
(4, 1, 1, 19.99, 'Mathematics', 'Conceptos clave de algebra lineal con tarjetas mixtas.', NULL, '2026-05-04 08:45:00', 4, 6, 5.00, 2, 2),
(5, 1, 0, 0.00, 'Technology', 'Introduccion a React con hooks y flujo de componentes.', NULL, '2026-05-05 11:15:00', 5, 5, 4.00, 1, 1),
(6, 1, 1, 24.99, 'Test Prep', 'Vocabulario TOEFL avanzado con sinonimos y antonimos.', NULL, '2026-05-06 14:20:00', 6, 2, 4.50, 2, 2),
(7, 1, 0, 0.00, 'History', 'Repaso general de revoluciones y procesos historicos.', NULL, '2026-05-07 16:00:00', 7, 6, 0.00, 0, 1),
(8, 1, 1, 12.99, 'Science', 'Biologia celular para sesiones cortas de estudio.', NULL, '2026-05-08 18:10:00', 8, 3, 5.00, 1, 2),
(9, 0, 0, 0.00, 'Other', 'Publicacion no visible de un mazo borrado logicamente.', NULL, '2026-05-09 08:00:00', 9, 5, 0.00, 0, 0),
(10, 1, 0, 0.00, 'Science', 'Conceptos introductorios de quimica general.', NULL, '2026-05-10 13:30:00', 10, 4, 0.00, 0, 1);

-- =========================================================
-- COMPRAS / TRANSACCIONES
-- =========================================================

INSERT INTO Compra
  (id_Compra, fechaCompra, precioPagado, estado, nombre_titular, ultimos_digitos, fk_id_usuario, fk_id_publicacion)
VALUES
(1, '2026-05-11 09:10:00', 0.00, 'completada', 'Eva Evangeli Evelia', '0000', 2, 1),
(2, '2026-05-11 10:20:00', 9.99, 'completada', 'Max Rodriguez', '4242', 4, 2),
(3, '2026-05-12 11:35:00', 9.99, 'completada', 'Pedro Castillo', '1111', 5, 2),
(4, '2026-05-12 12:45:00', 14.99, 'completada', 'Camila Torres', '2222', 3, 3),
(5, '2026-05-13 08:25:00', 19.99, 'completada', 'Eva Evangeli Evelia', '3333', 2, 4),
(6, '2026-05-13 15:40:00', 0.00, 'completada', 'Zalo Mendoza', '0000', 6, 5),
(7, '2026-05-14 09:05:00', 24.99, 'completada', 'Camila Torres', '4444', 3, 6),
(8, '2026-05-14 17:50:00', 12.99, 'completada', 'Max Rodriguez', '5555', 4, 8),
(9, '2026-05-15 10:00:00', 0.00, 'completada', 'Pedro Castillo', '0000', 5, 7),
(10, '2026-05-15 18:30:00', 0.00, 'completada', 'Camila Torres', '0000', 3, 10),
(11, '2026-05-16 11:20:00', 19.99, 'completada', 'Pedro Castillo', '6666', 5, 4),
(12, '2026-05-16 19:10:00', 24.99, 'completada', 'Zalo Mendoza', '7777', 6, 6),
(13, '2026-05-17 08:55:00', 12.99, 'completada', 'Eva Evangeli Evelia', '8888', 2, 8),
(14, '2026-05-17 20:00:00', 9.99, 'completada', 'Zalo Mendoza', '9999', 6, 2),
(15, '2026-05-18 09:15:00', 0.00, 'completada', 'Camila Torres', '0000', 3, 1);

-- =========================================================
-- COPIAS ADQUIRIDAS DESDE MARKETPLACE
-- =========================================================
-- La aplicacion crea un mazo nuevo por cada compra/descarga.
-- Estas copias permiten que el dashboard demo muestre mazos adquiridos
-- y que el modo estudio conserve las opciones JSON de opcion multiple.

INSERT INTO Mazo (IDMazo, titulo, descripcion, limite, IDUsuario, original, enColeccion) VALUES
(11, 'Estructuras de Datos en JavaScript (copia)', 'Listas, pilas, colas y complejidad basica para desarrollo web.', 0, 2, 0, 1),
(12, 'Anatomia Humana - Sistema Oseo (copia)', 'Repaso esencial del sistema oseo humano.', 0, 4, 0, 1),
(13, 'Anatomia Humana - Sistema Oseo (copia)', 'Repaso esencial del sistema oseo humano.', 0, 5, 0, 1),
(14, 'Ingles de Negocios - Phrasal Verbs (copia)', 'Phrasal verbs utiles para ambientes profesionales.', 0, 3, 0, 1),
(15, 'Algebra Lineal y Matrices (copia)', 'Conceptos de matrices, vectores y determinantes.', 0, 2, 0, 1),
(16, 'Conceptos Esenciales de React (copia)', 'Hooks, componentes y estado en aplicaciones React.', 0, 6, 0, 1),
(17, 'Vocabulario TOEFL Avanzado (copia)', 'Sinonimos, antonimos y vocabulario academico.', 0, 3, 0, 1),
(18, 'Biologia Celular (copia)', 'Organelos, membrana y procesos celulares.', 0, 4, 0, 1),
(19, 'Historia Universal - Revoluciones (copia)', 'Eventos historicos y procesos sociales clave.', 0, 5, 0, 1),
(20, 'Quimica General Basica (copia)', 'Elementos, enlaces y reacciones introductorias.', 0, 3, 0, 1),
(21, 'Algebra Lineal y Matrices (copia)', 'Conceptos de matrices, vectores y determinantes.', 0, 5, 0, 1),
(22, 'Vocabulario TOEFL Avanzado (copia)', 'Sinonimos, antonimos y vocabulario academico.', 0, 6, 0, 1),
(23, 'Biologia Celular (copia)', 'Organelos, membrana y procesos celulares.', 0, 2, 0, 1),
(24, 'Anatomia Humana - Sistema Oseo (copia)', 'Repaso esencial del sistema oseo humano.', 0, 6, 0, 1),
(25, 'Estructuras de Datos en JavaScript (copia)', 'Listas, pilas, colas y complejidad basica para desarrollo web.', 0, 3, 0, 1);

INSERT INTO Tarjeta (frente, reverso, tipo, opciones, orden, IDMazo)
SELECT t.frente,
       t.reverso,
       t.tipo,
       t.opciones,
       t.orden,
       copias.IDMazoCopia
FROM Tarjeta t
JOIN (
  SELECT 1 AS IDMazoOriginal, 11 AS IDMazoCopia
  UNION ALL SELECT 2, 12
  UNION ALL SELECT 2, 13
  UNION ALL SELECT 3, 14
  UNION ALL SELECT 4, 15
  UNION ALL SELECT 5, 16
  UNION ALL SELECT 6, 17
  UNION ALL SELECT 8, 18
  UNION ALL SELECT 7, 19
  UNION ALL SELECT 10, 20
  UNION ALL SELECT 4, 21
  UNION ALL SELECT 6, 22
  UNION ALL SELECT 8, 23
  UNION ALL SELECT 2, 24
  UNION ALL SELECT 1, 25
) copias ON copias.IDMazoOriginal = t.IDMazo;

-- =========================================================
-- VALORACIONES
-- =========================================================

INSERT INTO Valoracion
  (id_Val, puntuacion, comentario, fecha, fk_id_usuario, fk_id_publicacion)
VALUES
(1, 5, 'Muy claro para repasar antes de clase.', '2026-05-11 12:00:00', 2, 1),
(2, 4, 'Buen material, ejemplos directos.', '2026-05-18 10:30:00', 3, 1),
(3, 5, 'Excelente para memorizar huesos principales.', '2026-05-12 13:15:00', 4, 2),
(4, 4, 'Me ayudo a practicar rapido.', '2026-05-13 14:10:00', 5, 2),
(5, 5, 'Muy completo para estudio basico.', '2026-05-17 21:00:00', 6, 2),
(6, 4, 'Util para vocabulario profesional.', '2026-05-13 09:30:00', 3, 3),
(7, 4, 'Me gustaron las preguntas de escritura.', '2026-05-15 16:20:00', 5, 3),
(8, 5, 'Muy buen repaso de matrices.', '2026-05-14 18:00:00', 2, 4),
(9, 5, 'Perfecto para algebra lineal.', '2026-05-16 20:20:00', 5, 4),
(10, 4, 'Buen inicio para hooks.', '2026-05-14 11:00:00', 6, 5),
(11, 5, 'Excelente para TOEFL.', '2026-05-15 11:30:00', 3, 6),
(12, 4, 'Vocabulario bien seleccionado.', '2026-05-17 11:50:00', 6, 6),
(13, 5, 'Explicaciones simples y utiles.', '2026-05-18 09:40:00', 2, 8);

-- =========================================================
-- SESIONES DE ESTUDIO
-- =========================================================

INSERT INTO SesionEstudio
  (IDSesion, fechaIni, fechafin, aciertos, fallos, totalTarjetas, IDUsuario, IDMazo)
VALUES
(1, '2026-05-18 08:00:00', '2026-05-18 08:08:00', 3, 1, 4, 2, 1),
(2, '2026-05-18 09:00:00', '2026-05-18 09:06:00', 3, 0, 3, 2, 3),
(3, '2026-05-18 10:00:00', '2026-05-18 10:07:00', 2, 1, 3, 3, 2),
(4, '2026-05-18 11:00:00', '2026-05-18 11:10:00', 4, 0, 4, 3, 8),
(5, '2026-05-19 08:30:00', '2026-05-19 08:37:00', 3, 1, 4, 4, 1),
(6, '2026-05-19 09:30:00', '2026-05-19 09:35:00', 2, 1, 3, 4, 10),
(7, '2026-05-19 12:00:00', '2026-05-19 12:05:00', 2, 1, 3, 5, 5),
(8, '2026-05-19 15:00:00', '2026-05-19 15:09:00', 4, 0, 4, 6, 4),
(9, '2026-05-20 08:15:00', '2026-05-20 08:22:00', 3, 1, 4, 6, 6),
(10, '2026-05-20 16:10:00', '2026-05-20 16:16:00', 3, 0, 3, 5, 7),
(11, '2026-05-21 07:30:00', '2026-05-21 07:37:00', 3, 1, 4, 2, 6),
(12, '2026-05-21 08:20:00', '2026-05-21 08:27:00', 4, 0, 4, 3, 8);

-- =========================================================
-- AJUSTES DE AUTO_INCREMENT
-- =========================================================

ALTER TABLE NivelRacha AUTO_INCREMENT = 6;
ALTER TABLE Usuario AUTO_INCREMENT = 7;
ALTER TABLE Mazo AUTO_INCREMENT = 26;
ALTER TABLE Tarjeta AUTO_INCREMENT = 92;
ALTER TABLE Publicacion AUTO_INCREMENT = 11;
ALTER TABLE Compra AUTO_INCREMENT = 16;
ALTER TABLE SesionEstudio AUTO_INCREMENT = 13;
ALTER TABLE Valoracion AUTO_INCREMENT = 14;

-- =========================================================
-- RESUMEN DE VALIDACION
-- =========================================================

SELECT 'Usuarios' AS tabla, COUNT(*) AS total FROM Usuario
UNION ALL SELECT 'Mazos', COUNT(*) FROM Mazo
UNION ALL SELECT 'Tarjetas', COUNT(*) FROM Tarjeta
UNION ALL SELECT 'Publicaciones', COUNT(*) FROM Publicacion
UNION ALL SELECT 'Compras', COUNT(*) FROM Compra
UNION ALL SELECT 'Copias Marketplace', COUNT(*) FROM Mazo WHERE original = 0
UNION ALL SELECT 'Sesiones', COUNT(*) FROM SesionEstudio
UNION ALL SELECT 'Valoraciones', COUNT(*) FROM Valoracion
UNION ALL SELECT 'Mazos borrados logicos', COUNT(*) FROM Mazo WHERE enColeccion = 0
UNION ALL SELECT 'Usuarios desactivados', COUNT(*) FROM Usuario WHERE activo = 0;

-- Fin del script.
