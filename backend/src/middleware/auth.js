/**
 * Middleware de autenticación.
 * Valida tokens JWT, establece sesión y protege rutas de usuario/administrador.
 */
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { jwtSecret, tokenCookie } from '../config/appConfig.js';

/**
 * Genera un token JWT y lo guarda en cookie HttpOnly.
 * @param {Object} res - Respuesta de Express.
 * @param {Object} usuario - Registro del usuario de la BD.
 */
export const signIn = (res, usuario) => {
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

/**
 * Borra la cookie de sesión del usuario.
 * @param {Object} res - Respuesta de Express.
 */
export const clearSession = (res) => {
  res.clearCookie(tokenCookie, { sameSite: 'lax', secure: false });
};

/**
 * Extrae y valida el JWT de la cookie de sesión.
 * @param {Object} req - Request de Express.
 */
export const getAuthPayload = (req) => {
  const token = req.cookies?.[tokenCookie];
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
};

/**
 * Middleware para proteger rutas que requieren usuario autenticado.
 * - Verifica el JWT y busca el usuario en `Usuario`.
 * - Agrega `req.usuario` si es válido.
 */
export const requireUser = async (req, res, next) => {
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

/**
 * Middleware para proteger rutas exclusivas de administrador.
 * - Ejecuta `requireUser` y luego valida `req.usuario.rol`.
 */
export const requireAdmin = async (req, res, next) => {
  await requireUser(req, res, async () => {
    if (req.usuario?.rol !== 'admin') {
      return res.status(403).json({ message: 'Debes iniciar sesion como administrador.' });
    }
    return next();
  });
};
