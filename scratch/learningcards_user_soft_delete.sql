-- LearningCards - Soft delete de usuarios para una BD existente.
-- Ejecutar en phpMyAdmin sobre la base del proyecto antes de usar
-- la restauracion/desactivacion de usuarios del panel administrador.

USE learning_cards_react;

ALTER TABLE Usuario
  ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1
  COMMENT '1 = Activo, 0 = Borrado Logico'
  AFTER rol;

-- Validacion rapida.
SELECT IDUsuario, UserName, email, rol, activo
FROM Usuario
ORDER BY IDUsuario DESC;
