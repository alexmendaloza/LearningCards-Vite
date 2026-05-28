/**
 * Controlador de autenticación.
 * Maneja login, registro, cierre de sesión y usuario autenticado.
 */
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { clearSession, signIn } from '../middleware/auth.js';
import { saveDataUrlImage } from '../utils/fileUpload.js';
import { cleanUser } from '../utils/userUtils.js';
import { todaySql } from '../utils/dates.js';
import { hasErrors, validate } from '../utils/validation.js';
import { sendRecoveryEmail } from '../../../server/mailer.js';
import crypto from 'crypto';

/**
 * Devuelve los datos del usuario autenticado en sesión.
 * @param {Object} req - Request de Express con `req.usuario` establecido por el middleware.
 * @param {Object} res - Respuesta de Express.
 */
export const me = (req, res) => {
  res.json({ usuario: cleanUser(req.usuario) });
};

/**
 * Autentica un usuario normal con email o username y contraseña.
 * - Body: { email, password }
 * - Consulta `Usuario` para obtener usuario activo.
 * - Responde con el usuario limpio y redirect a `/dashboard`.
 */
export const login = async (req, res, next) => {
  try {
    const { email: identifier, password } = req.body;
    console.log(`[LOGIN] Intento de acceso: "${identifier}"`);

    const errors = validate({ email: ['required'], password: ['required'] }, req.body);
    if (hasErrors(res, errors)) return;

    const [users] = await pool.query(
      'SELECT * FROM Usuario WHERE email = ? OR UserName = ? LIMIT 1',
      [identifier, identifier],
    );

    const usuario = users[0];
    if (!usuario) {
      console.warn(`[LOGIN] Usuario no encontrado: "${identifier}"`);
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    if (Number(usuario.activo) === 0) {
      console.warn(`[LOGIN] Cuenta desactivada: "${identifier}"`);
      return res.status(403).json({ message: 'Esta cuenta ha sido desactivada por el administrador.' });
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
};

/**
 * Autentica un usuario administrador.
 * - Body: { email, password }
 * - Consulta `Usuario` y valida rol admin.
 * - Responde con el usuario limpio y redirect a `/admin/dashboard`.
 */
export const adminLogin = async (req, res, next) => {
  try {
    const { email: identifier, password } = req.body;
    console.log(`[ADMIN-LOGIN] Intento de acceso: "${identifier}"`);

    const errors = validate({ email: ['required'], password: ['required'] }, req.body);
    if (hasErrors(res, errors)) return;

    const [users] = await pool.query(
      'SELECT * FROM Usuario WHERE email = ? OR UserName = ? LIMIT 1',
      [identifier, identifier],
    );

    const usuario = users[0];
    if (!usuario) {
      console.warn(`[ADMIN-LOGIN] Usuario no encontrado: "${identifier}"`);
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    if (Number(usuario.activo) === 0) {
      console.warn(`[ADMIN-LOGIN] Cuenta desactivada: "${identifier}"`);
      return res.status(403).json({ message: 'Esta cuenta ha sido desactivada por el administrador.' });
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
};

/**
 * Registra un nuevo usuario en la base de datos.
 * - Body: { UserName, NombreCompleto, email, password, fechanac, genero, fotorutaData, fotorutaName }
 * - Valida campos, guarda imagen de perfil y crea el registro en `Usuario`.
 * - Responde con el usuario creado y redirect a `/dashboard`.
 */
export const register = async (req, res, next) => {
  try {
    const errors = validate({
      UserName: ['required', 'max:50', 'username'],
      NombreCompleto: ['required', 'max:100', 'name'],
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
};

/**
 * Finaliza la sesión del usuario eliminando la cookie de sesión.
 * - Responde { success: true }.
 */
export const logout = (_req, res) => {
  clearSession(res);
  res.json({ success: true });
};

/**
 * Finaliza la sesión de administrador eliminando la cookie de sesión.
 * - Responde { success: true }.
 */
export const adminLogout = (_req, res) => {
  clearSession(res);
  res.json({ success: true });
};

/**
 * Solicita el envío de un código de recuperación por correo.
 * Body: { email }
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const errors = validate({ email: ['required', 'email'] }, req.body);
    if (hasErrors(res, errors)) return;

    const [[userRows]] = await pool.query('SELECT * FROM Usuario WHERE email = ? LIMIT 1', [email]);
    const user = userRows && userRows[0] ? userRows[0] : null;

    // Evita enumeración de usuarios: responder siempre éxito.
    if (!user) {
      console.log(`[PASSWORD RESET] Solicitud para email no registrado: ${email}`);
      return res.json({ success: true });
    }

    // Asegurar existencia de tabla para códigos de recuperación
    await pool.query(`
      CREATE TABLE IF NOT EXISTS PasswordReset (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        fk_id_usuario BIGINT UNSIGNED NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_user_code (fk_id_usuario, code),
        CONSTRAINT fk_pr_usuario FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(IDUsuario) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Generar código numérico de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await pool.query(
      'INSERT INTO PasswordReset (fk_id_usuario, code, expires_at) VALUES (?, ?, ?)',
      [user.IDUsuario, code, expiresAt],
    );

    // Enviar correo (simulado si no hay SMTP)
    const sent = await sendRecoveryEmail(user.email, code, user.UserName || user.NombreCompleto || '');
    if (!sent) {
      console.warn('[PASSWORD RESET] No se pudo enviar el correo de recuperación');
      return res.status(500).json({ success: false, message: 'No se pudo enviar el correo de recuperación.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[PASSWORD RESET] Error interno:', error);
    return next(error);
  }
};

/**
 * Verifica código y restablece la contraseña.
 * Body: { email, code, newPassword }
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const errors = validate({ email: ['required', 'email'], code: ['required'], newPassword: ['required', 'min:6'] }, req.body);
    if (hasErrors(res, errors)) return;

    const [[userRows]] = await pool.query('SELECT * FROM Usuario WHERE email = ? LIMIT 1', [email]);
    const user = userRows && userRows[0] ? userRows[0] : null;
    if (!user) return res.status(400).json({ success: false, message: 'Datos inválidos.' });

    const [[rows]] = await pool.query(
      'SELECT * FROM PasswordReset WHERE fk_id_usuario = ? AND code = ? AND used = 0 AND expires_at >= NOW() ORDER BY id DESC LIMIT 1',
      [user.IDUsuario, String(code)],
    );

    const token = rows && rows[0] ? rows[0] : null;
    if (!token) return res.status(400).json({ success: false, message: 'Código inválido o expirado.' });

    // Actualizar contraseña
    const hashed = bcrypt.hashSync(String(newPassword), 10);
    await pool.query('UPDATE Usuario SET contrasena = ? WHERE IDUsuario = ?', [hashed, user.IDUsuario]);

    // Marcar token como usado
    await pool.query('UPDATE PasswordReset SET used = 1 WHERE id = ?', [token.id]);

    return res.json({ success: true });
  } catch (error) {
    console.error('[PASSWORD RESET] Error interno:', error);
    return next(error);
  }
};
