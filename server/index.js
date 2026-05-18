import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertKnownTable,
  databaseName,
  getPrimaryKey,
  getSchema,
  pool,
  quoteIdentifier,
} from './db.js';

const app = express();
const port = Number(process.env.API_PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || 'learningcards-local-secret';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storagePath = path.resolve(__dirname, '..', 'public', 'storage');

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/storage', express.static(storagePath));

const categories = [
  'Test Prep',
  'Science',
  'Medical',
  'Languages',
  'Technology',
  'Mathematics',
  'History',
  'Other',
];

const nowSql = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const todaySql = () => new Date().toISOString().slice(0, 10);
const tokenCookie = 'lc_session';

const cleanUser = (user) => {
  if (!user) return null;
  const copy = { ...user };
  delete copy.contrasena;

  if (copy.ultDiaEst) {
    const today = new Date(todaySql());
    const ultimoStr = typeof copy.ultDiaEst === 'string' ? copy.ultDiaEst.slice(0, 10) : copy.ultDiaEst.toISOString().slice(0, 10);
    const ultimo = new Date(ultimoStr);
    const diff = Math.floor((today.getTime() - ultimo.getTime()) / 86400000);
    if (diff > 1) {
      copy.rachaActual = 0;
    }
  } else {
    copy.rachaActual = 0;
  }

  return copy;
};

const saveDataUrlImage = async (dataUrl, originalName = 'perfil.png') => {
  if (!dataUrl || !String(dataUrl).startsWith('data:image/')) return null;
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const ext = mime.includes('jpeg') ? 'jpg' : mime.split('/')[1].replace(/[^a-z0-9]/gi, '').toLowerCase();
  const safeName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '');
  const filename = `${Date.now()}_${safeName || 'perfil'}.${ext || 'png'}`;
  const relative = path.posix.join('perfiles', filename);
  const targetDir = path.join(storagePath, 'perfiles');
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, filename), Buffer.from(match[2], 'base64'));
  return relative;
};

const signIn = (res, usuario) => {
  const token = jwt.sign(
    { id: usuario.IDUsuario, role: usuario.rol || 'user', name: usuario.NombreCompleto },
    jwtSecret,
    { expiresIn: '7d' },
  );
  res.cookie(tokenCookie, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearSession = (res) => {
  res.clearCookie(tokenCookie, { sameSite: 'lax', secure: false });
};

const getAuthPayload = (req) => {
  const token = req.cookies?.[tokenCookie];
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
};

const requireUser = async (req, res, next) => {
  try {
    const payload = getAuthPayload(req);
    if (!payload?.id) return res.status(401).json({ message: 'Debes iniciar sesion para acceder a esta seccion.' });

    const [rows] = await pool.query(
      `SELECT u.*, n.nombreNivel, n.diasReq
         FROM Usuario u
         LEFT JOIN NivelRacha n ON n.IDNivel = u.IDNivel
        WHERE u.IDUsuario = ?
        LIMIT 1`,
      [payload.id],
    );

    if (!rows[0]) return res.status(401).json({ message: 'Sesion no valida.' });
    req.usuario = rows[0];
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  await requireUser(req, res, () => {
    if (req.usuario?.rol !== 'admin') {
      return res.status(403).json({ message: 'Debes iniciar sesion como administrador.' });
    }
    return next();
  });
};

const validate = (rules, body) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const [field, checks] of Object.entries(rules)) {
    const value = body[field];
    for (const check of checks) {
      if (check === 'required' && (value === undefined || value === null || value === '')) {
        errors[field] = 'Este campo es obligatorio.';
      }
      if (check === 'email' && value && !emailRegex.test(String(value))) {
        errors[field] = 'Ingresa un correo electronico valido.';
      }
      if (check.startsWith('max:') && value && String(value).length > Number(check.split(':')[1])) {
        errors[field] = `Maximo ${check.split(':')[1]} caracteres.`;
      }
      if (check.startsWith('min:') && value && String(value).length < Number(check.split(':')[1])) {
        errors[field] = `Minimo ${check.split(':')[1]} caracteres.`;
      }
    }
  }

  return errors;
};

const hasErrors = (res, errors) => {
  if (Object.keys(errors).length === 0) return false;
  res.status(422).json({ message: 'Validacion fallida.', errors });
  return true;
};

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

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

const initSchema = async () => {
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
      total_estudiadas BIGINT UNSIGNED NOT NULL DEFAULT 0,
      aciertos_totales BIGINT UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (IDUsuario),
      CONSTRAINT usuario_nivel_fk FOREIGN KEY (IDNivel) REFERENCES NivelRacha(IDNivel)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Mazo (
      IDMazo BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      titulo VARCHAR(100) NOT NULL,
      descripcion TEXT NULL,
      limite INT NOT NULL DEFAULT 0,
      IDUsuario BIGINT UNSIGNED NOT NULL,
      original TINYINT NOT NULL DEFAULT 1,
      enColeccion TINYINT NOT NULL DEFAULT 1,
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
    CREATE TABLE IF NOT EXISTS Publicacion (
      id_Publ BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      publico TINYINT NOT NULL DEFAULT 1,
      pago TINYINT NOT NULL DEFAULT 0,
      precio DECIMAL(8,2) NOT NULL DEFAULT 0.00,
      categoria VARCHAR(60) NULL,
      imagen_url VARCHAR(300) NULL,
      descripcion_publica TEXT NULL,
      fk_id_mazo BIGINT UNSIGNED NOT NULL,
      fk_id_usuario BIGINT UNSIGNED NOT NULL,
      promedio_valoracion DECIMAL(3,2) NOT NULL DEFAULT 0.00,
      num_valoraciones INT UNSIGNED NOT NULL DEFAULT 0,
      num_compras INT UNSIGNED NOT NULL DEFAULT 0,
      fecha_publicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_Publ)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await removeLegacyPublicacionConstraints();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Compra (
      id_Compra BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      fechaCompra DATETIME NOT NULL,
      precioPagado DECIMAL(8,2) NOT NULL DEFAULT 0.00,
      estado ENUM('pendiente','completada','cancelada') NOT NULL DEFAULT 'completada',
      nombre_titular VARCHAR(100) NULL,
      ultimos_digitos VARCHAR(4) NULL,
      fk_id_usuario BIGINT UNSIGNED NOT NULL,
      fk_id_publicacion BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY (id_Compra),
      UNIQUE KEY unique_compra (fk_id_usuario, fk_id_publicacion),
      CONSTRAINT compra_usuario_fk FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(IDUsuario) ON DELETE CASCADE,
      CONSTRAINT compra_publicacion_fk FOREIGN KEY (fk_id_publicacion) REFERENCES Publicacion(id_Publ) ON DELETE CASCADE
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

const recalculateRating = async (publicationId) => {
  const [rows] = await pool.query(
    'SELECT ROUND(AVG(puntuacion), 2) AS promedio, COUNT(*) AS total FROM Valoracion WHERE fk_id_publicacion = ?',
    [publicationId],
  );
  await pool.query(
    'UPDATE Publicacion SET promedio_valoracion = ?, num_valoraciones = ? WHERE id_Publ = ?',
    [rows[0].promedio || 0, rows[0].total || 0, publicationId],
  );
};

const getPublication = async (id) => {
  const [rows] = await pool.query(
    `SELECT p.*, m.titulo, m.descripcion, m.IDUsuario AS mazo_usuario_id, u.UserName, u.NombreCompleto, u.fotoruta
       FROM Publicacion p
       JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
       JOIN Usuario u ON u.IDUsuario = p.fk_id_usuario
      WHERE p.id_Publ = ?
      LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

const getPublicationDetail = async (id, userId) => {
  const publicacion = await getPublication(id);
  if (!publicacion) return null;

  const [[mazo], [tarjetas], [valoraciones], [compra], [miValoracion]] = await Promise.all([
    pool.query(
      `SELECT m.*, u.UserName, u.NombreCompleto, u.fotoruta
         FROM Mazo m JOIN Usuario u ON u.IDUsuario = m.IDUsuario
        WHERE m.IDMazo = ?
        LIMIT 1`,
      [publicacion.fk_id_mazo],
    ),
    pool.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [publicacion.fk_id_mazo]),
    pool.query(
      `SELECT v.*, u.UserName, u.NombreCompleto
         FROM Valoracion v JOIN Usuario u ON u.IDUsuario = v.fk_id_usuario
        WHERE v.fk_id_publicacion = ?
        ORDER BY v.fecha DESC`,
      [id],
    ),
    userId
      ? pool.query('SELECT * FROM Compra WHERE fk_id_usuario = ? AND fk_id_publicacion = ? LIMIT 1', [userId, id])
      : Promise.resolve([[]]),
    userId
      ? pool.query('SELECT * FROM Valoracion WHERE fk_id_usuario = ? AND fk_id_publicacion = ? LIMIT 1', [userId, id])
      : Promise.resolve([[]]),
  ]);

  return {
    publicacion,
    creador: {
      IDUsuario: publicacion.fk_id_usuario,
      UserName: publicacion.UserName,
      NombreCompleto: publicacion.NombreCompleto,
      fotoruta: publicacion.fotoruta,
    },
    mazo: mazo[0],
    tarjetas,
    valoraciones,
    esPropio: Boolean(userId && Number(publicacion.fk_id_usuario) === Number(userId)),
    yaAdquirido: Boolean(compra[0]),
    miValoracion: miValoracion[0] || null,
  };
};

const clonePublicationToUser = async (connection, publicacion, userId, payment = {}) => {
  const [deckRows] = await connection.query('SELECT * FROM Mazo WHERE IDMazo = ? LIMIT 1', [publicacion.fk_id_mazo]);
  const sourceDeck = deckRows[0];
  if (!sourceDeck) throw new Error('Mazo no encontrado.');

  const [newDeck] = await connection.query(
    `INSERT INTO Mazo (titulo, descripcion, limite, IDUsuario, original, enColeccion)
     VALUES (?, ?, ?, ?, 0, 1)`,
    [`${sourceDeck.titulo} (copia)`, sourceDeck.descripcion, sourceDeck.limite || 0, userId],
  );

  const [cards] = await connection.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [sourceDeck.IDMazo]);
  for (const card of cards) {
    await connection.query(
      'INSERT INTO Tarjeta (frente, reverso, tipo, opciones, orden, IDMazo) VALUES (?, ?, ?, ?, ?, ?)',
      [card.frente, card.reverso, card.tipo, card.opciones ? JSON.stringify(card.opciones) : null, card.orden, newDeck.insertId],
    );
  }

  await connection.query(
    `INSERT INTO Compra
      (fechaCompra, precioPagado, estado, nombre_titular, ultimos_digitos, fk_id_usuario, fk_id_publicacion)
     VALUES (?, ?, 'completada', ?, ?, ?, ?)`,
    [
      nowSql(),
      payment.precioPagado ?? 0,
      payment.nombre_titular || null,
      payment.ultimos_digitos || null,
      userId,
      publicacion.id_Publ,
    ],
  );

  await connection.query('UPDATE Publicacion SET num_compras = num_compras + 1 WHERE id_Publ = ?', [publicacion.id_Publ]);
  return newDeck.insertId;
};

app.get('/api/health', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows[0].ok === 1, database: databaseName });
  } catch (error) {
    next(error);
  }
});

app.get('/api/schema', async (_req, res, next) => {
  try {
    res.json({ database: databaseName, tables: await getSchema() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tables/:table', async (req, res, next) => {
  try {
    const tableName = req.params.table;
    await assertKnownTable(tableName);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const [rows] = await pool.query(`SELECT * FROM ${quoteIdentifier(tableName)} LIMIT ?`, [limit]);
    res.json({ table: tableName, rows });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tables/:table/:id', async (req, res, next) => {
  try {
    const schema = await getSchema();
    const table = schema.find((item) => item.name === req.params.table);
    if (!table) return res.status(404).json({ message: `La tabla "${req.params.table}" no existe en ${databaseName}.` });

    const primaryKey = getPrimaryKey(table);
    if (!primaryKey) return res.status(400).json({ message: `La tabla "${table.name}" no tiene llave primaria definida.` });

    const [rows] = await pool.query(
      `SELECT * FROM ${quoteIdentifier(table.name)} WHERE ${quoteIdentifier(primaryKey)} = ? LIMIT 1`,
      [req.params.id],
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Registro no encontrado.' });
    return res.json({ table: table.name, row: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/me', requireUser, (req, res) => {
  res.json({ usuario: cleanUser(req.usuario) });
});

app.post('/api/login', async (req, res, next) => {
  try {
    const { email: identifier, password } = req.body;
    console.log(`[LOGIN] Intento de acceso: "${identifier}"`);

    const errors = validate({ email: ['required'], password: ['required'] }, req.body);
    if (hasErrors(res, errors)) return;

    // Buscamos por email O por UserName
    const [users] = await pool.query(
      'SELECT * FROM Usuario WHERE email = ? OR UserName = ? LIMIT 1',
      [identifier, identifier]
    );

    const usuario = users[0];
    if (!usuario) {
      console.warn(`[LOGIN] Usuario no encontrado: "${identifier}"`);
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const bcryptPassword = String(usuario.contrasena || '').replace(/^\$2y\$/, '$2b$');
    const passwordMatches = bcrypt.compareSync(String(password), bcryptPassword);

    if (!passwordMatches) {
      console.warn(`[LOGIN] Contraseña incorrecta para: "${identifier}"`);
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    if (usuario.rol === 'admin') {
      console.warn(`[LOGIN] Admin intentando entrar por login normal: "${identifier}"`);
      return res.status(403).json({ message: 'Los administradores deben acceder por el panel de administracion.' });
    }

    console.log(`[LOGIN] Éxito: "${usuario.UserName}" (${usuario.email})`);
    signIn(res, usuario);
    return res.json({ usuario: cleanUser(usuario), redirect: '/dashboard' });
  } catch (error) {
    console.error('[LOGIN] Error interno:', error);
    return next(error);
  }
});

app.post('/api/admin/login', async (req, res, next) => {
  try {
    const { email: identifier, password } = req.body;
    console.log(`[ADMIN-LOGIN] Intento de acceso: "${identifier}"`);

    const errors = validate({ email: ['required'], password: ['required'] }, req.body);
    if (hasErrors(res, errors)) return;

    const [users] = await pool.query(
      'SELECT * FROM Usuario WHERE email = ? OR UserName = ? LIMIT 1',
      [identifier, identifier]
    );

    const usuario = users[0];
    if (!usuario) {
      console.warn(`[ADMIN-LOGIN] Usuario no encontrado: "${identifier}"`);
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const bcryptPassword = String(usuario.contrasena || '').replace(/^\$2y\$/, '$2b$');
    const passwordMatches = bcrypt.compareSync(String(password), bcryptPassword);

    if (!passwordMatches) {
      console.warn(`[ADMIN-LOGIN] Contraseña incorrecta para: "${identifier}"`);
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    if (usuario.rol !== 'admin') {
      console.warn(`[ADMIN-LOGIN] Usuario no admin intentando entrar: "${identifier}"`);
      return res.status(403).json({ message: 'No tienes permisos de administrador para acceder a este panel.' });
    }

    console.log(`[ADMIN-LOGIN] Éxito: "${usuario.UserName}" (${usuario.email})`);
    signIn(res, usuario);
    return res.json({ usuario: cleanUser(usuario), redirect: '/admin/dashboard' });
  } catch (error) {
    console.error('[ADMIN-LOGIN] Error interno:', error);
    return next(error);
  }
});

app.post('/api/register', async (req, res, next) => {
  try {
    const errors = validate({
      UserName: ['required', 'max:50'],
      NombreCompleto: ['required', 'max:100'],
      email: ['required', 'email'],
      password: ['required', 'min:6'],
      fechanac: ['required'],
      genero: ['required'],
    }, req.body);
    if (hasErrors(res, errors)) return;

    const [existing] = await pool.query('SELECT IDUsuario FROM Usuario WHERE email = ? OR UserName = ? LIMIT 1', [req.body.email, req.body.UserName]);
    if (existing[0]) return res.status(409).json({ message: 'Ya existe un usuario con ese correo o nombre de usuario.' });

    const fotoPath = await saveDataUrlImage(req.body.fotorutaData, req.body.fotorutaName);

    const [result] = await pool.query(
      `INSERT INTO Usuario
        (UserName, NombreCompleto, email, contrasena, fechanac, genero, fotoruta, rachaActual, ultDiaEst, IDNivel, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 1, 'user')`,
      [
        req.body.UserName,
        req.body.NombreCompleto,
        req.body.email,
        bcrypt.hashSync(String(req.body.password), 10),
        req.body.fechanac,
        req.body.genero,
        fotoPath || req.body.fotoruta || null,
        todaySql(),
      ],
    );

    const [users] = await pool.query('SELECT * FROM Usuario WHERE IDUsuario = ? LIMIT 1', [result.insertId]);
    signIn(res, users[0]);
    return res.status(201).json({ usuario: cleanUser(users[0]), redirect: '/dashboard' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/logout', (_req, res) => {
  clearSession(res);
  res.json({ success: true });
});

app.post('/api/admin/logout', (_req, res) => {
  clearSession(res);
  res.json({ success: true });
});

app.get('/api/user/dashboard', requireUser, async (req, res, next) => {
  try {
    const { search, origin, cards_count: cardsCount } = req.query;
    const params = [req.usuario.IDUsuario];
    const where = ['m.IDUsuario = ?', 'm.enColeccion = 1'];

    if (search) {
      where.push('m.titulo LIKE ?');
      params.push(`%${search}%`);
    }
    if (origin === 'mine') where.push('m.original = 1');
    if (origin === 'marketplace') where.push('m.original = 0');

    const having = [];
    if (cardsCount === 'small') having.push('tarjetas_count < 10');
    if (cardsCount === 'medium') having.push('tarjetas_count >= 10 AND tarjetas_count <= 50');
    if (cardsCount === 'large') having.push('tarjetas_count > 50');

    const [mazos] = await pool.query(
      `SELECT m.*,
              (SELECT COUNT(*) FROM Tarjeta t WHERE t.IDMazo = m.IDMazo) AS tarjetas_count,
              p.id_Publ,
              p.publico
         FROM Mazo m
         LEFT JOIN Publicacion p ON p.fk_id_mazo = m.IDMazo
        WHERE ${where.join(' AND ')}
        ${having.length ? `HAVING ${having.join(' AND ')}` : ''}
        ORDER BY m.IDMazo DESC`,
      params,
    );

    const [populares] = await pool.query(
      `SELECT m.*,
              p.id_Publ,
              (SELECT COUNT(*) FROM Tarjeta t WHERE t.IDMazo = m.IDMazo) AS tarjetas_count,
              u.NombreCompleto,
              u.UserName
         FROM Publicacion p
         JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
         JOIN Usuario u ON u.IDUsuario = m.IDUsuario
        WHERE p.publico = 1 AND m.IDUsuario != ?
        ORDER BY p.num_compras DESC
        LIMIT 3`,
      [req.usuario.IDUsuario],
    );

    const [sesiones] = await pool.query(
      'SELECT COALESCE(SUM(totalTarjetas),0) AS totalEstudiadas, COALESCE(SUM(aciertos),0) AS totalAciertos FROM SesionEstudio WHERE IDUsuario = ? AND DATE(fechaIni) = ?',
      [req.usuario.IDUsuario, todaySql()],
    );
    const totalEstudiadas = Number(sesiones[0].totalEstudiadas || 0);
    const totalAciertos = Number(sesiones[0].totalAciertos || 0);
    const precision = totalEstudiadas > 0 ? Math.round((totalAciertos / totalEstudiadas) * 100) : 0;

    return res.json({
      usuario: cleanUser(req.usuario),
      mazos,
      mazosPopulares: populares,
      totalEstudiadas,
      precision,
      categorias: ['Idiomas', 'Ciencia', 'Tecnologia', 'Historia', 'Medicina', 'Otros'],
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/user/creator/stats', requireUser, async (req, res, next) => {
  try {
    const commissionRate = 0.15;
    const { search, tipo, categoria, ingresos_min: ingresosMin, fecha_desde: fechaDesde, fecha_hasta: fechaHasta } = req.query;
    const userId = req.usuario.IDUsuario;

    const publicationWhere = ['p.fk_id_usuario = ?', 'p.publico = 1'];
    const publicationParams = [userId];
    const addPublicationFilters = (where, params) => {
      if (search) {
        where.push('(m.titulo LIKE ? OR m.descripcion LIKE ? OR p.descripcion_publica LIKE ? OR p.categoria LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (tipo === 'gratis') where.push('p.pago = 0');
      if (tipo === 'pago') where.push('p.pago = 1');
      if (categoria) {
        where.push('p.categoria = ?');
        params.push(categoria);
      }
    };

    const filteredWhere = [...publicationWhere];
    const filteredParams = [...publicationParams];
    addPublicationFilters(filteredWhere, filteredParams);

    const saleJoin = ['c.fk_id_publicacion = p.id_Publ', "c.estado = 'completada'"];
    const saleParams = [];
    if (fechaDesde) {
      saleJoin.push('DATE(c.fechaCompra) >= ?');
      saleParams.push(fechaDesde);
    }
    if (fechaHasta) {
      saleJoin.push('DATE(c.fechaCompra) <= ?');
      saleParams.push(fechaHasta);
    }

    const [allPublications] = await pool.query(
      `SELECT p.*
         FROM Publicacion p
         JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
        WHERE ${publicationWhere.join(' AND ')}`,
      publicationParams,
    );

    const [[salesTotals], [ratingTotals], [topRows], [categoriesRows], [recentSales]] = await Promise.all([
      pool.query(
        `SELECT COUNT(c.id_Compra) AS copias_vendidas,
                COALESCE(SUM(c.precioPagado), 0) AS ingresos_brutos
           FROM Compra c
           JOIN Publicacion p ON p.id_Publ = c.fk_id_publicacion
          WHERE p.fk_id_usuario = ? AND p.publico = 1 AND c.estado = 'completada'`,
        [userId],
      ),
      pool.query(
        `SELECT COUNT(v.id_Val) AS valoraciones,
                COALESCE(AVG(v.puntuacion), 0) AS promedio_estrellas
           FROM Valoracion v
           JOIN Publicacion p ON p.id_Publ = v.fk_id_publicacion
          WHERE p.fk_id_usuario = ? AND p.publico = 1`,
        [userId],
      ),
      pool.query(
        `SELECT p.id_Publ,
                p.pago,
                p.precio,
                p.categoria,
                p.promedio_valoracion,
                p.num_valoraciones,
                m.IDMazo,
                m.titulo,
                m.descripcion,
                COUNT(c.id_Compra) AS copias_vendidas,
                COALESCE(SUM(c.precioPagado), 0) AS ingresos_brutos,
                (SELECT COUNT(*) FROM Tarjeta t WHERE t.IDMazo = m.IDMazo) AS tarjetas_count
           FROM Publicacion p
           JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
           LEFT JOIN Compra c ON ${saleJoin.join(' AND ')}
          WHERE ${filteredWhere.join(' AND ')}
          GROUP BY p.id_Publ, p.pago, p.precio, p.categoria, p.promedio_valoracion, p.num_valoraciones, m.IDMazo, m.titulo, m.descripcion
         HAVING ingresos_brutos >= ?
          ORDER BY ingresos_brutos DESC, copias_vendidas DESC, p.id_Publ DESC
          LIMIT 5`,
        [...saleParams, ...filteredParams, Number(ingresosMin || 0)],
      ),
      pool.query(
        `SELECT DISTINCT categoria
           FROM Publicacion
          WHERE fk_id_usuario = ? AND publico = 1 AND categoria IS NOT NULL AND categoria != ''
          ORDER BY categoria`,
        [userId],
      ),
      pool.query(
        `SELECT c.id_Compra,
                c.fechaCompra,
                c.precioPagado,
                c.estado,
                c.nombre_titular,
                c.ultimos_digitos,
                m.titulo,
                u.UserName,
                u.NombreCompleto
           FROM Compra c
           JOIN Publicacion p ON p.id_Publ = c.fk_id_publicacion
           JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
           JOIN Usuario u ON u.IDUsuario = c.fk_id_usuario
          WHERE p.fk_id_usuario = ? AND p.publico = 1 AND c.estado = 'completada'
          ORDER BY c.fechaCompra DESC
          LIMIT 8`,
        [userId],
      ),
    ]);

    const mazosPublicados = allPublications.length;
    const copiasVendidas = Number(salesTotals[0]?.copias_vendidas || 0);
    const ingresosBrutos = Number(salesTotals[0]?.ingresos_brutos || 0);
    const comisionPlataforma = ingresosBrutos * commissionRate;
    const dineroNeto = ingresosBrutos - comisionPlataforma;
    const topMazos = topRows.map((row) => ({
      ...row,
      copias_vendidas: Number(row.copias_vendidas || 0),
      ingresos_brutos: Number(row.ingresos_brutos || 0),
      comision: Number(row.ingresos_brutos || 0) * commissionRate,
      ingresos_netos: Number(row.ingresos_brutos || 0) * (1 - commissionRate),
      promedio_valoracion: Number(row.promedio_valoracion || 0),
    }));

    return res.json({
      usuario: cleanUser(req.usuario),
      stats: {
        mazos_publicados: mazosPublicados,
        mazos_gratis: allPublications.filter((pub) => Number(pub.pago) === 0).length,
        mazos_pago: allPublications.filter((pub) => Number(pub.pago) === 1).length,
        copias_vendidas: copiasVendidas,
        valoraciones: Number(ratingTotals[0]?.valoraciones || 0),
        promedio_estrellas: Number(ratingTotals[0]?.promedio_estrellas || 0),
        ingresos_brutos: ingresosBrutos,
        comision_plataforma: comisionPlataforma,
        dinero_neto: dineroNeto,
        ticket_promedio: copiasVendidas > 0 ? ingresosBrutos / copiasVendidas : 0,
        porcentaje_comision: commissionRate * 100,
      },
      topMazos,
      categorias: categoriesRows.map((row) => row.categoria),
      ventasRecientes: recentSales,
      filters: { search: search || '', tipo: tipo || '', categoria: categoria || '', ingresos_min: ingresosMin || '', fecha_desde: fechaDesde || '', fecha_hasta: fechaHasta || '' },
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/user/report', requireUser, async (req, res, next) => {
  try {
    const userId = req.usuario.IDUsuario;
    const { year, month, day } = req.query;

    const sesionWhere = ['s.IDUsuario = ?'];
    const sesionParams = [userId];
    const statsWhere = ['IDUsuario = ?'];
    const statsParams = [userId];

    if (year) {
      sesionWhere.push('YEAR(s.fechaIni) = ?');
      sesionParams.push(year);
      statsWhere.push('YEAR(fechaIni) = ?');
      statsParams.push(year);
    }
    if (month) {
      sesionWhere.push('MONTH(s.fechaIni) = ?');
      sesionParams.push(month);
      statsWhere.push('MONTH(fechaIni) = ?');
      statsParams.push(month);
    }
    if (day) {
      sesionWhere.push('DAY(s.fechaIni) = ?');
      sesionParams.push(day);
      statsWhere.push('DAY(fechaIni) = ?');
      statsParams.push(day);
    }

    const [sesionesRecientes] = await pool.query(
      `SELECT s.*, m.titulo AS mazo_titulo 
         FROM SesionEstudio s 
         LEFT JOIN Mazo m ON m.IDMazo = s.IDMazo 
        WHERE ${sesionWhere.join(' AND ')} 
        ORDER BY s.fechaIni DESC 
        LIMIT 50`,
      sesionParams
    );

    const sesionesFormateadas = sesionesRecientes.map(s => ({
      ...s,
      mazo: { titulo: s.mazo_titulo || 'MAZO ELIMINADO' }
    }));

    const [stats] = await pool.query(
      `SELECT COUNT(IDSesion) AS totalSesiones, 
              COALESCE(SUM(totalTarjetas), 0) AS totalTarjetasEstudiadas, 
              COALESCE(SUM(aciertos), 0) AS aciertosTotales 
         FROM SesionEstudio 
        WHERE ${statsWhere.join(' AND ')}`,
      statsParams
    );

    const totalSesiones = Number(stats[0].totalSesiones || 0);
    const totalTarjetasEstudiadas = Number(stats[0].totalTarjetasEstudiadas || 0);
    const aciertosTotales = Number(stats[0].aciertosTotales || 0);
    const promedioPrecision = totalTarjetasEstudiadas > 0 ? Math.round((aciertosTotales / totalTarjetasEstudiadas) * 100) : 0;

    const [mazosCount] = await pool.query(
      `SELECT COUNT(*) AS totalMazos FROM Mazo WHERE IDUsuario = ? AND enColeccion = 1`,
      [userId]
    );
    const totalMazos = Number(mazosCount[0].totalMazos || 0);

    const [niveles] = await pool.query(
      `SELECT nombreNivel FROM NivelRacha WHERE IDNivel = ? LIMIT 1`,
      [req.usuario.IDNivel]
    );
    const nombreNivel = niveles[0]?.nombreNivel || 'Novato';

    let filtroEtiqueta = 'TODOS LOS TIEMPOS';
    if (year || month || day) {
      const parts = [];
      if (day) parts.push(`DÍA: ${day}`);
      if (month) parts.push(`MES: ${month}`);
      if (year) parts.push(`AÑO: ${year}`);
      filtroEtiqueta = parts.join(' | ');
    }

    return res.json({
      usuario: {
        ...cleanUser(req.usuario),
        nivel: { nombreNivel },
        logros: [],
      },
      totalSesiones,
      totalTarjetasEstudiadas,
      promedioPrecision,
      totalMazos,
      sesionesRecientes: sesionesFormateadas,
      filtroEtiqueta
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/user/configuracion', requireUser, (req, res) => {
  res.json({ usuario: cleanUser(req.usuario) });
});

app.put('/api/user/configuracion', requireUser, async (req, res, next) => {
  try {
    const errors = validate({
      UserName: ['required'],
      email: ['required', 'email'],
      NombreCompleto: ['required', 'max:255'],
    }, req.body);
    if (hasErrors(res, errors)) return;

    const [existing] = await pool.query(
      'SELECT IDUsuario FROM Usuario WHERE (UserName = ? OR email = ?) AND IDUsuario != ? LIMIT 1',
      [req.body.UserName, req.body.email, req.usuario.IDUsuario],
    );
    if (existing[0]) return res.status(409).json({ message: 'El usuario o correo ya esta en uso.' });

    const fotoPath = await saveDataUrlImage(req.body.fotorutaData, req.body.fotorutaName);

    await pool.query(
      `UPDATE Usuario
          SET UserName = ?, NombreCompleto = ?, email = ?, fechanac = ?, genero = ?, fotoruta = COALESCE(?, fotoruta)
        WHERE IDUsuario = ?`,
      [
        req.body.UserName,
        req.body.NombreCompleto,
        req.body.email,
        req.body.fechanac || req.usuario.fechanac,
        req.body.genero || req.usuario.genero,
        fotoPath || req.body.fotoruta || null,
        req.usuario.IDUsuario,
      ],
    );
    const [users] = await pool.query('SELECT * FROM Usuario WHERE IDUsuario = ? LIMIT 1', [req.usuario.IDUsuario]);
    return res.json({ success: true, usuario: cleanUser(users[0]) });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/mazos', requireUser, async (req, res, next) => {
  try {
    const errors = validate({ titulo: ['required', 'max:100'], descripcion: ['max:255'] }, req.body);
    if (hasErrors(res, errors)) return;

    const [result] = await pool.query(
      'INSERT INTO Mazo (titulo, descripcion, limite, IDUsuario, original, enColeccion) VALUES (?, ?, 0, ?, 1, 1)',
      [req.body.titulo, req.body.descripcion || null, req.usuario.IDUsuario],
    );
    return res.status(201).json({ IDMazo: result.insertId });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/mazos/:id', requireUser, async (req, res, next) => {
  try {
    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? LIMIT 1', [req.params.id]);
    const mazo = mazos[0];
    if (!mazo) return res.status(404).json({ message: 'Mazo no encontrado.' });
    if (mazo.IDUsuario !== req.usuario.IDUsuario && req.usuario.rol !== 'admin') return res.status(403).json({ message: 'No autorizado.' });
    const [tarjetas] = await pool.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [req.params.id]);
    return res.json({ mazo, tarjetas });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/mazos/:id', requireUser, async (req, res, next) => {
  try {
    const errors = validate({ titulo: ['required', 'max:100'], descripcion: ['max:255'] }, req.body);
    if (hasErrors(res, errors)) return;
    const [result] = await pool.query(
      'UPDATE Mazo SET titulo = ?, descripcion = ? WHERE IDMazo = ? AND IDUsuario = ?',
      [req.body.titulo, req.body.descripcion || null, req.params.id, req.usuario.IDUsuario],
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Mazo no encontrado.' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/mazos/:id', requireUser, async (req, res, next) => {
  try {
    const [result] = await pool.query('UPDATE Mazo SET enColeccion = 0 WHERE IDMazo = ? AND IDUsuario = ?', [req.params.id, req.usuario.IDUsuario]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Mazo no encontrado.' });
    await pool.query('UPDATE Publicacion SET publico = 0 WHERE fk_id_mazo = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/tarjetas', requireUser, async (req, res, next) => {
  try {
    const errors = validate({ frente: ['required'], reverso: ['required'], IDMazo: ['required'] }, req.body);
    if (hasErrors(res, errors)) return;
    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? AND IDUsuario = ? LIMIT 1', [req.body.IDMazo, req.usuario.IDUsuario]);
    if (!mazos[0]) return res.status(403).json({ message: 'No autorizado.' });

    console.log('SERVER RECEIVED:', JSON.stringify(req.body, null, 2));

    if (req.body.IDTarjeta) {
      await pool.query(
        'UPDATE Tarjeta SET frente = ?, reverso = ?, tipo = ?, opciones = ? WHERE IDTarjeta = ? AND IDMazo = ?',
        [req.body.frente, req.body.reverso, req.body.tipo || 'basica', req.body.opciones ? JSON.stringify(req.body.opciones) : null, req.body.IDTarjeta, req.body.IDMazo],
      );
      return res.json({ success: true });
    }

    const [counts] = await pool.query('SELECT COUNT(*) AS total FROM Tarjeta WHERE IDMazo = ?', [req.body.IDMazo]);
    const [result] = await pool.query(
      'INSERT INTO Tarjeta (frente, reverso, tipo, opciones, orden, IDMazo) VALUES (?, ?, ?, ?, ?, ?)',
      [req.body.frente, req.body.reverso, req.body.tipo || 'basica', req.body.opciones ? JSON.stringify(req.body.opciones) : null, Number(counts[0].total || 0) + 1, req.body.IDMazo],
    );
    return res.status(201).json({ IDTarjeta: result.insertId });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/tarjetas/:id', requireUser, async (req, res, next) => {
  try {
    await pool.query(
      `DELETE t FROM Tarjeta t
        JOIN Mazo m ON m.IDMazo = t.IDMazo
       WHERE t.IDTarjeta = ? AND m.IDUsuario = ?`,
      [req.params.id, req.usuario.IDUsuario],
    );
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/estudiar/:id', requireUser, async (req, res, next) => {
  try {
    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? LIMIT 1', [req.params.id]);
    if (!mazos[0]) return res.status(404).json({ message: 'Mazo no encontrado.' });
    const [tarjetas] = await pool.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [req.params.id]);
    return res.json({ mazo: mazos[0], tarjetas });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/estudiar/:id/finalizar', requireUser, async (req, res, next) => {
  try {
    const aciertos = Number(req.body.aciertos || 0);
    const fallos = Number(req.body.fallos || 0);
    const total = aciertos + fallos;

    if (total > 0) {
      const ultimo = req.usuario.ultDiaEst ? new Date(req.usuario.ultDiaEst) : null;
      const today = new Date(todaySql());
      let racha = Number(req.usuario.rachaActual || 0);

      if (!ultimo || racha === 0) {
        racha = 1;
      } else {
        const diff = Math.floor((today - new Date(ultimo.toISOString().slice(0, 10))) / 86400000);
        if (diff === 1) racha += 1;
        else if (diff > 1) racha = 1;
      }

      await pool.query(
        `INSERT INTO SesionEstudio
          (fechaIni, fechafin, aciertos, fallos, totalTarjetas, IDUsuario, IDMazo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.body.fechaini || nowSql(), req.body.fechafin || nowSql(), aciertos, fallos, total, req.usuario.IDUsuario, req.params.id],
      );

      const [nivel] = await pool.query('SELECT * FROM NivelRacha WHERE diasReq <= ? ORDER BY diasReq DESC LIMIT 1', [racha]);
      await pool.query(
        `UPDATE Usuario
            SET rachaActual = ?, ultDiaEst = ?, IDNivel = ?, total_estudiadas = total_estudiadas + ?, aciertos_totales = aciertos_totales + ?
          WHERE IDUsuario = ?`,
        [racha, todaySql(), nivel[0]?.IDNivel || req.usuario.IDNivel, total, aciertos, req.usuario.IDUsuario],
      );

      return res.json({ success: true, racha, nivel_id: nivel[0]?.IDNivel || req.usuario.IDNivel });
    }

    return res.json({ success: true, racha: req.usuario.rachaActual, nivel_id: req.usuario.IDNivel });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/user/marketplace', requireUser, async (req, res, next) => {
  try {
    const params = [];
    const where = ['p.publico = 1'];
    if (req.query.search) {
      where.push('(m.titulo LIKE ? OR m.descripcion LIKE ? OR u.NombreCompleto LIKE ? OR u.UserName LIKE ? OR p.categoria LIKE ?)');
      for (let i = 0; i < 5; i += 1) params.push(`%${req.query.search}%`);
    }
    if (req.query.categoria) {
      where.push('p.categoria = ?');
      params.push(req.query.categoria);
    }
    if (req.query.precio === 'gratis') where.push('p.pago = 0');
    if (req.query.precio === 'pago') where.push('p.pago = 1');

    const order = {
      valorados: 'p.promedio_valoracion DESC',
      precio_asc: 'p.precio ASC',
      precio_desc: 'p.precio DESC',
      popular: 'p.num_compras DESC',
    }[req.query.orden || 'popular'] || 'p.num_compras DESC';

    const [publicaciones] = await pool.query(
      `SELECT p.*,
              m.titulo,
              m.descripcion,
              u.NombreCompleto,
              u.UserName,
              (SELECT COUNT(*) FROM Tarjeta t WHERE t.IDMazo = m.IDMazo) AS tarjetas_count
         FROM Publicacion p
         JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
         JOIN Usuario u ON u.IDUsuario = p.fk_id_usuario
        WHERE ${where.join(' AND ')}
        ORDER BY ${order}`,
      params,
    );
    const [compras] = await pool.query('SELECT fk_id_publicacion FROM Compra WHERE fk_id_usuario = ?', [req.usuario.IDUsuario]);
    return res.json({ publicaciones, mazosAdquiridos: compras.map((row) => row.fk_id_publicacion), categorias: categories });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/user/marketplace/:id', requireUser, async (req, res, next) => {
  try {
    const detail = await getPublicationDetail(req.params.id, req.usuario.IDUsuario);
    if (!detail) return res.status(404).json({ message: 'Publicacion no encontrada.' });
    return res.json(detail);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/user/marketplace/:id/adquirir', requireUser, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const publicacion = await getPublication(req.params.id);
    if (!publicacion) return res.status(404).json({ message: 'Publicacion no encontrada.' });
    if (Number(publicacion.pago) === 1) {
      return res.status(409).json({ message: 'Este mazo requiere pago.', redirect: `/marketplace/${req.params.id}/pagar` });
    }

    const [exists] = await pool.query('SELECT id_Compra FROM Compra WHERE fk_id_usuario = ? AND fk_id_publicacion = ? LIMIT 1', [req.usuario.IDUsuario, req.params.id]);
    if (exists[0]) return res.status(409).json({ message: 'Ya tienes este mazo en tu coleccion.' });

    await connection.beginTransaction();
    const newDeckId = await clonePublicationToUser(connection, publicacion, req.usuario.IDUsuario, { precioPagado: 0 });
    await connection.commit();
    return res.status(201).json({ success: true, IDMazo: newDeckId });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya tienes este mazo en tu coleccion.' });
    return next(error);
  } finally {
    connection.release();
  }
});

app.post('/api/user/marketplace/:id/confirmar', requireUser, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const cardNumber = String(req.body.numero_tarjeta || '').replaceAll(' ', '');
    const errors = validate({
      nombre_titular: ['required', 'max:100'],
      numero_tarjeta: ['required'],
      vencimiento: ['required', 'max:5'],
      cvv: ['required'],
    }, { ...req.body, numero_tarjeta: cardNumber });
    if (!/^\d{16}$/.test(cardNumber)) errors.numero_tarjeta = 'El numero de tarjeta debe tener 16 digitos.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(req.body.vencimiento || ''))) errors.vencimiento = 'La fecha debe tener formato MM/AA.';
    if (!/^\d{3,4}$/.test(String(req.body.cvv || ''))) errors.cvv = 'El CVV debe tener entre 3 y 4 digitos.';
    if (hasErrors(res, errors)) return;

    const publicacion = await getPublication(req.params.id);
    if (!publicacion) return res.status(404).json({ message: 'Publicacion no encontrada.' });
    const [exists] = await pool.query('SELECT id_Compra FROM Compra WHERE fk_id_usuario = ? AND fk_id_publicacion = ? LIMIT 1', [req.usuario.IDUsuario, req.params.id]);
    if (exists[0]) return res.status(409).json({ message: 'Ya tienes este mazo.' });

    await connection.beginTransaction();
    const newDeckId = await clonePublicationToUser(connection, publicacion, req.usuario.IDUsuario, {
      precioPagado: publicacion.precio,
      nombre_titular: req.body.nombre_titular,
      ultimos_digitos: cardNumber.slice(-4),
    });
    await connection.commit();
    return res.status(201).json({ success: true, IDMazo: newDeckId });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya tienes este mazo.' });
    return next(error);
  } finally {
    connection.release();
  }
});

app.post('/api/user/marketplace/:id/valorar', requireUser, async (req, res, next) => {
  try {
    const puntuacion = Number(req.body.puntuacion);
    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      return res.status(422).json({ message: 'La puntuacion debe estar entre 1 y 5.' });
    }
    await pool.query(
      `INSERT INTO Valoracion (puntuacion, comentario, fecha, fk_id_usuario, fk_id_publicacion)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion), comentario = VALUES(comentario), fecha = VALUES(fecha)`,
      [puntuacion, req.body.comentario || null, nowSql(), req.usuario.IDUsuario, req.params.id],
    );
    await recalculateRating(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/mazos/:id/publicar', requireUser, async (req, res, next) => {
  try {
    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? AND IDUsuario = ? LIMIT 1', [req.params.id, req.usuario.IDUsuario]);
    if (!mazos[0]) return res.status(403).json({ message: 'No tienes permiso para publicar este mazo.' });
    const [publicacion] = await pool.query('SELECT * FROM Publicacion WHERE fk_id_mazo = ? LIMIT 1', [req.params.id]);
    const [cards] = await pool.query('SELECT COUNT(*) AS total FROM Tarjeta WHERE IDMazo = ?', [req.params.id]);
    return res.json({ mazo: mazos[0], publicacion: publicacion[0] || null, categorias: categories, tarjetas_count: cards[0].total });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/mazos/:id/publicar', requireUser, async (req, res, next) => {
  try {
    const errors = validate({
      categoria: ['required', 'max:60'],
      descripcion_publica: ['max:500'],
      imagen_url: ['max:300'],
      pago: ['required'],
    }, req.body);

    const pago = String(req.body.pago);
    const precio = req.body.precio === '' || req.body.precio === null || req.body.precio === undefined
      ? null
      : Number(req.body.precio);

    if (!['0', '1'].includes(pago)) {
      errors.pago = 'El tipo de pago debe ser 0 o 1.';
    }

    if (req.body.imagen_url && !isValidUrl(req.body.imagen_url)) {
      errors.imagen_url = 'La URL de imagen no es valida.';
    }

    if (pago === '1' && (precio === null || Number.isNaN(precio) || precio < 0.01 || precio > 999.99)) {
      errors.precio = 'El precio es obligatorio para publicaciones de pago y debe estar entre 0.01 y 999.99.';
    }

    if (pago === '0' && precio !== null && (Number.isNaN(precio) || precio < 0.01 || precio > 999.99)) {
      errors.precio = 'El precio debe ser numerico y estar entre 0.01 y 999.99.';
    }

    if (hasErrors(res, errors)) return;

    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? AND IDUsuario = ? LIMIT 1', [req.params.id, req.usuario.IDUsuario]);
    if (!mazos[0]) return res.status(403).json({ message: 'No autorizado.' });

    const datos = {
      publico: 1,
      pago: Number(pago),
      precio: pago === '1' ? precio : 0.00,
      categoria: req.body.categoria,
      descripcion_publica: req.body.descripcion_publica || null,
      imagen_url: req.body.imagen_url || null,
      fk_id_mazo: Number(req.params.id),
      fk_id_usuario: req.usuario.IDUsuario,
      fecha_publicacion: nowSql(),
    };

    const [existing] = await pool.query('SELECT id_Publ FROM Publicacion WHERE fk_id_mazo = ? LIMIT 1', [req.params.id]);

    if (existing[0]) {
      await pool.query(
        `UPDATE Publicacion
            SET publico = ?,
                pago = ?,
                precio = ?,
                categoria = ?,
                descripcion_publica = ?,
                imagen_url = ?,
                fk_id_mazo = ?,
                fk_id_usuario = ?,
                fecha_publicacion = ?
          WHERE id_Publ = ?`,
        [
          datos.publico,
          datos.pago,
          datos.precio,
          datos.categoria,
          datos.descripcion_publica,
          datos.imagen_url,
          datos.fk_id_mazo,
          datos.fk_id_usuario,
          datos.fecha_publicacion,
          existing[0].id_Publ,
        ],
      );
      return res.json({ success: true, id_Publ: existing[0].id_Publ, action: 'updated' });
    }

    const [result] = await pool.query(
      `INSERT INTO Publicacion
        (publico, pago, precio, categoria, descripcion_publica, imagen_url, fk_id_mazo, fk_id_usuario, fecha_publicacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.publico,
        datos.pago,
        datos.precio,
        datos.categoria,
        datos.descripcion_publica,
        datos.imagen_url,
        datos.fk_id_mazo,
        datos.fk_id_usuario,
        datos.fecha_publicacion,
      ],
    );
    return res.json({ success: true, id_Publ: result.insertId, action: 'created' });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/dashboard', requireAdmin, async (_req, res, next) => {
  try {
    const [[ganancias], [statsRows], [comprasRecientes]] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(precioPagado),0) AS totalGanancias FROM Compra'),
      pool.query(`SELECT
        (SELECT COUNT(*) FROM Usuario) AS usuarios,
        (SELECT COUNT(*) FROM Mazo) AS mazos,
        (SELECT COUNT(*) FROM Compra) AS ventas`),
      pool.query(
        `SELECT c.*, u.UserName, p.id_Publ, m.titulo
           FROM Compra c
           LEFT JOIN Usuario u ON u.IDUsuario = c.fk_id_usuario
           LEFT JOIN Publicacion p ON p.id_Publ = c.fk_id_publicacion
           LEFT JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
          ORDER BY c.fechaCompra DESC
          LIMIT 8`,
      ),
    ]);
    return res.json({ totalGanancias: Number(ganancias[0].totalGanancias || 0), stats: statsRows[0], comprasRecientes });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res, next) => {
  try {
    const [usuarios] = await pool.query('SELECT IDUsuario, UserName, NombreCompleto, email, rol FROM Usuario WHERE IDUsuario != ? ORDER BY IDUsuario DESC', [req.usuario.IDUsuario]);
    return res.json({ usuarios });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/users/:id/toggle', requireAdmin, async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT * FROM Usuario WHERE IDUsuario = ? LIMIT 1', [req.params.id]);
    if (!users[0]) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (users[0].rol === 'admin') return res.status(400).json({ message: 'No puedes degradar a otro administrador.' });
    await pool.query("UPDATE Usuario SET rol = 'admin' WHERE IDUsuario = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT * FROM Usuario WHERE IDUsuario = ? LIMIT 1', [req.params.id]);
    if (!users[0]) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (users[0].rol === 'admin') return res.status(400).json({ message: 'Las cuentas de administrador estan protegidas y no pueden ser eliminadas.' });
    await pool.query('DELETE FROM Usuario WHERE IDUsuario = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/mazos', requireAdmin, async (req, res, next) => {
  try {
    const { search, autor, estado, coleccion } = req.query;
    const where = [];
    const params = [];

    if (search) {
      where.push('m.titulo LIKE ?');
      params.push(`%${search}%`);
    }
    if (autor) {
      where.push('u.UserName LIKE ?');
      params.push(`%${autor}%`);
    }
    if (estado === 'publicado') where.push('p.publico = 1');
    if (estado === 'privado') where.push('(p.publico IS NULL OR p.publico = 0)');
    if (coleccion === 'activo') where.push('m.enColeccion = 1');
    if (coleccion === 'borrado') where.push('m.enColeccion = 0');

    const [mazos] = await pool.query(
      `SELECT m.*,
              u.UserName,
              p.id_Publ,
              p.publico,
              (SELECT COUNT(*) FROM Tarjeta t WHERE t.IDMazo = m.IDMazo) AS tarjetas_count
         FROM Mazo m
         LEFT JOIN Usuario u ON u.IDUsuario = m.IDUsuario
         LEFT JOIN Publicacion p ON p.fk_id_mazo = m.IDMazo
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY m.IDMazo DESC`,
      params,
    );
    return res.json({ mazos });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/mazos/:id', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM Mazo WHERE IDMazo = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/admin/mazos/:id/restore', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('UPDATE Mazo SET enColeccion = 1 WHERE IDMazo = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/mazos/:id/tarjetas', requireAdmin, async (req, res, next) => {
  try {
    const [mazos] = await pool.query(
      `SELECT m.*, u.UserName, u.NombreCompleto
         FROM Mazo m LEFT JOIN Usuario u ON u.IDUsuario = m.IDUsuario
        WHERE m.IDMazo = ?
        LIMIT 1`,
      [req.params.id],
    );
    if (!mazos[0]) return res.status(404).json({ message: 'Mazo no encontrado.' });
    const [tarjetas] = await pool.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [req.params.id]);
    return res.json({ mazo: mazos[0], tarjetas });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/ventas', requireAdmin, async (req, res, next) => {
  try {
    const { usuario, orden = 'desc', fecha_inicio: fechaInicio, fecha_fin: fechaFin } = req.query;
    const where = [];
    const params = [];

    if (usuario) {
      where.push('c.fk_id_usuario = ?');
      params.push(usuario);
    }
    if (fechaInicio) {
      where.push('DATE(c.fechaCompra) >= ?');
      params.push(fechaInicio);
    }
    if (fechaFin) {
      where.push('DATE(c.fechaCompra) <= ?');
      params.push(fechaFin);
    }

    const orderDirection = orden === 'asc' ? 'ASC' : 'DESC';
    const [ventas] = await pool.query(
      `SELECT c.*, u.UserName, m.titulo
         FROM Compra c
         LEFT JOIN Usuario u ON u.IDUsuario = c.fk_id_usuario
         LEFT JOIN Publicacion p ON p.id_Publ = c.fk_id_publicacion
         LEFT JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY c.fechaCompra ${orderDirection}`,
      params,
    );

    const [[totals], [users]] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(c.precioPagado), 0) AS total_ganancias
           FROM Compra c
          ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
        params,
      ),
      pool.query('SELECT IDUsuario, UserName FROM Usuario ORDER BY UserName ASC'),
    ]);

    return res.json({
      ventas,
      stats: {
        total_ganancias: Number(totals[0]?.total_ganancias || 0),
        total_usuarios: users.length,
        lista_usuarios: users,
        utilidad_novalearn: Number(totals[0]?.total_ganancias || 0) * 0.15,
      },
      filters: { usuario: usuario || '', orden: orderDirection.toLowerCase(), fecha_inicio: fechaInicio || '', fecha_fin: fechaFin || '' },
    });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.message || 'Error interno del servidor.',
    database: databaseName,
  });
});

await initSchema();

app.listen(port, () => {
  console.log(`API LearningCards escuchando en http://localhost:${port}/api`);
});
