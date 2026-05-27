/**
 * Controlador de administración.
 * Maneja acciones de admin para usuarios, mazos, ventas y reportes.
 */
import { pool } from '../config/db.js';

/**
 * Obtiene las metricas generales del panel administrador.
 *
 * Consulta ganancias, totales del sistema y compras recientes para construir
 * el resumen inicial del dashboard administrativo.
 *
 * @param {Object} _req - Solicitud HTTP de Express. No se utiliza porque el dashboard no requiere parametros.
 * @param {Object} res - Respuesta HTTP de Express usada para devolver el resumen administrativo.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con `totalGanancias`, `stats` y `comprasRecientes`.
 */
export const dashboard = async (_req, res, next) => {
  try {
    // Ejecuta consultas independientes en paralelo para reducir el tiempo de respuesta del dashboard.
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
    // Normaliza el total a Number y agrupa las metricas en el formato que consume el frontend.
    return res.json({ totalGanancias: Number(ganancias[0].totalGanancias || 0), stats: statsRows[0], comprasRecientes });
  } catch (error) {
    // Delega errores SQL o de conexion al middleware centralizado de errores.
    return next(error);
  }
};

/**
 * Lista los usuarios registrados excluyendo al administrador autenticado.
 *
 * Recupera datos basicos para la gestion administrativa y evita incluir al
 * usuario actual en acciones administrativas sobre cuentas.
 *
 * @param {Object} req - Solicitud HTTP con `req.usuario.IDUsuario` cargado por autenticacion.
 * @param {Object} res - Respuesta HTTP usada para devolver la lista de usuarios.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con la propiedad `usuarios`.
 */
export const listUsers = async (req, res, next) => {
  try {
    // Consulta todos los usuarios excepto la cuenta que realiza la accion administrativa.
    const [usuarios] = await pool.query('SELECT IDUsuario, UserName, NombreCompleto, email, rol, activo FROM Usuario WHERE IDUsuario != ? ORDER BY IDUsuario DESC', [req.usuario.IDUsuario]);
    return res.json({ usuarios });
  } catch (error) {
    // Envia errores de consulta o conexion al middleware global.
    return next(error);
  }
};

/**
 * Promueve una cuenta de usuario al rol de administrador.
 *
 * Valida que el usuario exista y que no sea administrador antes de actualizar
 * el campo `rol` en la tabla `Usuario`.
 *
 * @param {Object} req - Solicitud HTTP con `req.params.id` como identificador del usuario.
 * @param {Object} res - Respuesta HTTP usada para informar el resultado de la promocion.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con `{ success: true }` o error HTTP 400/404.
 */
export const promoteUser = async (req, res, next) => {
  try {
    // Busca el usuario objetivo antes de modificar su rol.
    const [users] = await pool.query('SELECT * FROM Usuario WHERE IDUsuario = ? LIMIT 1', [req.params.id]);

    // Detiene la operacion si el usuario solicitado no existe.
    if (!users[0]) return res.status(404).json({ message: 'Usuario no encontrado.' });

    // Evita aplicar la promocion sobre una cuenta que ya es administradora.
    if (users[0].rol === 'admin') return res.status(400).json({ message: 'No puedes degradar a otro administrador.' });

    // Actualiza solamente el campo de rol y conserva intactos los demas datos del usuario.
    await pool.query("UPDATE Usuario SET rol = 'admin' WHERE IDUsuario = ?", [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    // Propaga fallos SQL al middleware centralizado.
    return next(error);
  }
};

/**
 * Elimina una cuenta de usuario no administrativa.
 *
 * Verifica que el usuario exista y bloquea la eliminacion de cuentas con rol
 * administrador para proteger accesos criticos del sistema.
 *
 * @param {Object} req - Solicitud HTTP con `req.params.id` como identificador del usuario.
 * @param {Object} res - Respuesta HTTP usada para confirmar la eliminacion o informar errores.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con `{ success: true }` o error HTTP 400/404.
 */
export const deleteUser = async (req, res, next) => {
  try {
    // Recupera el usuario para validar existencia y rol antes del borrado.
    const [users] = await pool.query('SELECT * FROM Usuario WHERE IDUsuario = ? LIMIT 1', [req.params.id]);

    // Evita ejecutar DELETE sobre un usuario inexistente.
    if (!users[0]) return res.status(404).json({ message: 'Usuario no encontrado.' });

    // Protege cuentas administrativas contra eliminacion desde el panel.
    if (users[0].rol === 'admin') return res.status(400).json({ message: 'Las cuentas de administrador estan protegidas y no pueden ser eliminadas.' });

    // Desactiva la cuenta sin eliminar sus relaciones historicas.
    await pool.query('UPDATE Usuario SET activo = 0 WHERE IDUsuario = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    // Delega restricciones SQL o fallos de conexion al manejador global.
    return next(error);
  }
};

/**
 * Restaura una cuenta de usuario desactivada por administracion.
 *
 * Conserva todos sus datos historicos y vuelve a permitir el inicio de sesion
 * al fijar la bandera `activo` en 1.
 *
 * @param {Object} req - Solicitud HTTP con `req.params.id` como identificador del usuario.
 * @param {Object} res - Respuesta HTTP usada para confirmar la restauracion.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con `{ success: true }` o error HTTP 404.
 */
export const restoreUser = async (req, res, next) => {
  try {
    const [result] = await pool.query('UPDATE Usuario SET activo = 1 WHERE IDUsuario = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

/**
 * Lista mazos del sistema aplicando filtros administrativos opcionales.
 *
 * Construye condiciones SQL segun busqueda, autor, estado de publicacion y
 * estado de coleccion para alimentar la tabla de administracion.
 *
 * @param {Object} req - Solicitud HTTP con filtros opcionales en `req.query`.
 * @param {Object} res - Respuesta HTTP usada para devolver los mazos filtrados.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con la propiedad `mazos`.
 */
export const listDecks = async (req, res, next) => {
  try {
    const { search, autor, estado, coleccion } = req.query;
    const coleccionFiltro = String(coleccion || '').toLowerCase();
    const where = [];
    const params = [];

    // Agrega filtros parametrizados para evitar concatenar valores de usuario directamente en SQL.
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
    if (['activo', 'activos', '1'].includes(coleccionFiltro)) where.push('m.enColeccion = 1');
    if (['borrado', 'borrados', '0'].includes(coleccionFiltro)) where.push('m.enColeccion = 0');

    // Consulta mazos junto con autor, publicacion y conteo de tarjetas para mostrar contexto completo.
    const [mazos] = await pool.query(
      `SELECT m.*,
              COALESCE(m.enColeccion, 1) AS enColeccion,
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
    // Envia errores de filtrado o consulta al middleware de errores.
    return next(error);
  }
};

/**
 * Elimina un mazo desde la administracion.
 *
 * Ejecuta el borrado del registro identificado por `IDMazo`. La integridad
 * relacional depende de las restricciones definidas en la base de datos.
 *
 * @param {Object} req - Solicitud HTTP con `req.params.id` como identificador del mazo.
 * @param {Object} res - Respuesta HTTP usada para confirmar la eliminacion.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con `{ success: true }`.
 */
export const deleteDeck = async (req, res, next) => {
  try {
    // Marca el mazo como borrado logico para conservarlo visible en auditoria administrativa.
    await pool.query('UPDATE Mazo SET enColeccion = 0 WHERE IDMazo = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    // Propaga errores por restricciones, permisos o conexion.
    return next(error);
  }
};

/**
 * Restaura un mazo marcado como fuera de la coleccion.
 *
 * Cambia `enColeccion` a 1 para que el mazo vuelva a aparecer como activo en
 * listados administrativos y de usuario.
 *
 * @param {Object} req - Solicitud HTTP con `req.params.id` como identificador del mazo.
 * @param {Object} res - Respuesta HTTP usada para confirmar la restauracion.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con `{ success: true }`.
 */
export const restoreDeck = async (req, res, next) => {
  try {
    // Reactiva el mazo sin recrearlo ni alterar su contenido.
    await pool.query('UPDATE Mazo SET enColeccion = 1 WHERE IDMazo = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    // Delega errores de actualizacion al middleware centralizado.
    return next(error);
  }
};

/**
 * Obtiene los datos de un mazo y sus tarjetas para revision administrativa.
 *
 * Primero consulta la informacion general del mazo y su autor. Si existe,
 * recupera sus tarjetas ordenadas para mostrarlas en detalle.
 *
 * @param {Object} req - Solicitud HTTP con `req.params.id` como identificador del mazo.
 * @param {Object} res - Respuesta HTTP usada para devolver el detalle del mazo.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con `mazo` y `tarjetas`, o error HTTP 404.
 */
export const getDeckCards = async (req, res, next) => {
  try {
    // Obtiene el mazo junto con informacion del usuario creador.
    const [mazos] = await pool.query(
      `SELECT m.*, u.UserName, u.NombreCompleto
         FROM Mazo m LEFT JOIN Usuario u ON u.IDUsuario = m.IDUsuario
        WHERE m.IDMazo = ?
        LIMIT 1`,
      [req.params.id],
    );

    // Si el mazo no existe, corta el flujo antes de consultar tarjetas asociadas.
    if (!mazos[0]) return res.status(404).json({ message: 'Mazo no encontrado.' });

    // Recupera tarjetas en el orden definido para representar correctamente el contenido del mazo.
    const [tarjetas] = await pool.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [req.params.id]);
    return res.json({ mazo: mazos[0], tarjetas });
  } catch (error) {
    // Centraliza cualquier error de consulta o conexion.
    return next(error);
  }
};

/**
 * Genera el reporte administrativo de ventas.
 *
 * Aplica filtros opcionales por usuario y rango de fechas, obtiene las ventas
 * ordenadas, calcula totales economicos y devuelve la lista de usuarios para
 * los filtros del frontend.
 *
 * @param {Object} req - Solicitud HTTP con filtros opcionales en `req.query`.
 * @param {Object} res - Respuesta HTTP usada para devolver el reporte de ventas.
 * @param {Function} next - Middleware de Express que recibe errores para el manejador global.
 * @returns {Promise<Object>} Respuesta JSON con `ventas`, `stats` y `filters`.
 */
export const salesReport = async (req, res, next) => {
  try {
    const { usuario, orden = 'desc', fecha_inicio: fechaInicio, fecha_fin: fechaFin } = req.query;
    const where = [];
    const params = [];

    // Construye filtros parametrizados para usuario y rango de fechas.
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

    // Limita el ordenamiento a ASC/DESC para evitar texto libre en ORDER BY.
    const orderDirection = orden === 'asc' ? 'ASC' : 'DESC';

    // Consulta el detalle de ventas con datos de comprador y mazo publicado.
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

    // Calcula totales y carga usuarios en paralelo porque ambos datos alimentan el mismo reporte.
    const [[totals], [users]] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(c.precioPagado), 0) AS total_ganancias
           FROM Compra c
          ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
        params,
      ),
      pool.query('SELECT IDUsuario, UserName FROM Usuario ORDER BY UserName ASC'),
    ]);

    // Devuelve datos, metricas derivadas y filtros aplicados para mantener sincronizada la interfaz.
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
    // Redirige errores de reporte al manejador global de Express.
    return next(error);
  }
};
