/**
 * Controlador de usuario.
 * Expone datos de dashboard, reportes, perfil y estadísticas de creador.
 */
import { categories } from '../config/appConfig.js';
import { pool } from '../config/db.js';
import { todaySql } from '../utils/dates.js';
import { saveDataUrlImage } from '../utils/fileUpload.js';
import { cleanUser } from '../utils/userUtils.js';
import { hasErrors, validate } from '../utils/validation.js';

/**
 * Devuelve el dashboard del usuario con sus mazos y estadísticas del día.
 * - Query: { search, origin, cards_count }
 * - Consulta `Mazo`, `Publicacion`, `SesionEstudio` y publicaciones populares.
 * - Responde con usuario, mazos, métricas de estudio y categorías.
 */
export const dashboard = async (req, res, next) => {
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
};

/**
 * Devuelve estadísticas del creador para el usuario autenticado.
 * - Query: { search, tipo, categoria, ingresos_min, fecha_desde, fecha_hasta }
 * - Consulta `Publicacion`, `Compra`, `Valoracion` y `Tarjeta` para calcular ingresos y top mazos.
 * - Responde con estadísticas, top mazos y filtros aplicados.
 */
export const creatorStats = async (req, res, next) => {
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
          WHERE categoria IS NOT NULL AND categoria != ''
          ORDER BY categoria`,
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
};

/**
 * Genera el reporte del usuario con histórico de sesiones de estudio.
 * - Query: { year, month, day }
 * - Consulta `SesionEstudio`, `Mazo` y `NivelRacha`.
 * - Responde con sesiones recientes, totales y filtro aplicado.
 */
export const report = async (req, res, next) => {
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
      sesionParams,
    );

    const sesionesFormateadas = sesionesRecientes.map((s) => ({
      ...s,
      mazo: { titulo: s.mazo_titulo || 'MAZO ELIMINADO' },
    }));

    const [stats] = await pool.query(
      `SELECT COUNT(IDSesion) AS totalSesiones, 
              COALESCE(SUM(totalTarjetas), 0) AS totalTarjetasEstudiadas, 
              COALESCE(SUM(aciertos), 0) AS aciertosTotales 
         FROM SesionEstudio 
        WHERE ${statsWhere.join(' AND ')}`,
      statsParams,
    );

    const totalSesiones = Number(stats[0].totalSesiones || 0);
    const totalTarjetasEstudiadas = Number(stats[0].totalTarjetasEstudiadas || 0);
    const aciertosTotales = Number(stats[0].aciertosTotales || 0);
    const promedioPrecision = totalTarjetasEstudiadas > 0 ? Math.round((aciertosTotales / totalTarjetasEstudiadas) * 100) : 0;

    const [mazosCount] = await pool.query(
      'SELECT COUNT(*) AS totalMazos FROM Mazo WHERE IDUsuario = ? AND enColeccion = 1',
      [userId],
    );
    const totalMazos = Number(mazosCount[0].totalMazos || 0);

    const [niveles] = await pool.query(
      'SELECT nombreNivel FROM NivelRacha WHERE IDNivel = ? LIMIT 1',
      [req.usuario.IDNivel],
    );
    const nombreNivel = niveles[0]?.nombreNivel || 'Novato';

    let filtroEtiqueta = 'TODOS LOS TIEMPOS';
    if (year || month || day) {
      const parts = [];
      if (day) parts.push(`DIA: ${day}`);
      if (month) parts.push(`MES: ${month}`);
      if (year) parts.push(`ANO: ${year}`);
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
      filtroEtiqueta,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Devuelve el perfil del usuario autenticado.
 * - No recibe body.
 * - Responde con los datos del usuario limpio.
 */
export const getProfile = (req, res) => {
  res.json({ usuario: cleanUser(req.usuario) });
};

/**
 * Actualiza el perfil del usuario autenticado.
 * - Body: { UserName, email, NombreCompleto, fechanac, genero, fotorutaData, fotorutaName }
 * - Verifica unicidad de email y username, guarda imagen y actualiza `Usuario`.
 * - Responde con el usuario actualizado.
 */
export const updateProfile = async (req, res, next) => {
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
};
