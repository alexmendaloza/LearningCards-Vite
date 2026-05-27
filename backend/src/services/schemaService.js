import { databaseName, pool, quoteIdentifier } from '../config/db.js';

const removeLegacyPublicacionConstraints = async () => {
  const [foreignKeys] = await pool.query(
    `SELECT CONSTRAINT_NAME
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'Publicacion'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME IN ('publicacion_mazo_fk', 'publicacion_usuario_fk')`,
    [databaseName],
  );

  for (const key of foreignKeys) {
    await pool.query(`ALTER TABLE Publicacion DROP FOREIGN KEY ${quoteIdentifier(key.CONSTRAINT_NAME)}`);
  }

  const [indexes] = await pool.query(
    `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'Publicacion'
        AND INDEX_NAME = 'publicacion_mazo_unique'
      LIMIT 1`,
    [databaseName],
  );

  if (indexes.length > 0) {
    await pool.query('ALTER TABLE Publicacion DROP INDEX publicacion_mazo_unique');
  }
};

export const initSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS NivelRacha (
      IDNivel BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      nombreNivel VARCHAR(60) NOT NULL,
      diasReq INT NOT NULL DEFAULT 0,
      PRIMARY KEY (IDNivel)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Usuario (
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
      activo TINYINT(1) NOT NULL DEFAULT 1,
      total_estudiadas INT NOT NULL DEFAULT 0,
      aciertos_totales INT NOT NULL DEFAULT 0,
      PRIMARY KEY (IDUsuario),
      CONSTRAINT usuario_nivel_fk FOREIGN KEY (IDNivel) REFERENCES NivelRacha(IDNivel)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Mazo (
      IDMazo BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      titulo VARCHAR(100) NOT NULL,
      descripcion VARCHAR(255) NULL,
      limite INT NOT NULL DEFAULT 0,
      IDUsuario BIGINT UNSIGNED NOT NULL,
      original TINYINT(1) NOT NULL DEFAULT 1,
      enColeccion TINYINT(1) NOT NULL DEFAULT 1,
      PRIMARY KEY (IDMazo),
      CONSTRAINT mazo_usuario_fk FOREIGN KEY (IDUsuario) REFERENCES Usuario(IDUsuario) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Tarjeta (
      IDTarjeta BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      frente TEXT NOT NULL,
      reverso TEXT NOT NULL,
      tipo VARCHAR(20) NOT NULL DEFAULT 'basica',
      opciones JSON NULL,
      orden INT NOT NULL DEFAULT 1,
      IDMazo BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY (IDTarjeta),
      CONSTRAINT tarjeta_mazo_fk FOREIGN KEY (IDMazo) REFERENCES Mazo(IDMazo) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await removeLegacyPublicacionConstraints();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Publicacion (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Compra (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS SesionEstudio (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Valoracion (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    INSERT IGNORE INTO NivelRacha (IDNivel, nombreNivel, diasReq) VALUES
    (1, 'Novato', 0),
    (2, 'Constante', 3),
    (3, 'En llamas', 7),
    (4, 'Maestro', 15),
    (5, 'Leyenda', 30)
  `);

  try {
    const [userColumns] = await pool.query('SHOW COLUMNS FROM Usuario');
    const userNames = userColumns.map((c) => c.Field);
    if (!userNames.includes('activo')) {
      await pool.query("ALTER TABLE Usuario ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Activo, 0 = Borrado Logico'");
    }

    const [columns] = await pool.query('SHOW COLUMNS FROM Tarjeta');
    const names = columns.map((c) => c.Field);
    if (!names.includes('tipo')) {
      await pool.query("ALTER TABLE Tarjeta ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'basica'");
    }
    if (!names.includes('opciones')) {
      await pool.query('ALTER TABLE Tarjeta ADD COLUMN opciones JSON NULL');
    }
  } catch (error) {
    console.warn('Error al migrar la tabla Tarjeta:', error.message);
  }
};
