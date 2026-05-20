import { databaseName } from '../config/db.js';

/**
 * Handler global de errores de Express.
 * - Captura errores lanzados por rutas y controladores.
 * - Responde con status y mensaje.
 */
export const errorHandler = (error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.message || 'Error interno del servidor.',
    database: databaseName,
  });
};
