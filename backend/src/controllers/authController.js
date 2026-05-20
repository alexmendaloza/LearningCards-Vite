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
