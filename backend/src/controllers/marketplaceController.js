/**
 * Controlador del marketplace.
 * Gestiona listados de publicaciones, compras, pagos y valoraciones.
 */
import { categories } from '../config/appConfig.js';
import { pool } from '../config/db.js';
import { hasErrors, validate } from '../utils/validation.js';
import { nowSql } from '../utils/dates.js';
import { clonePublicationToUser, getPublication, getPublicationDetail, recalculateRating } from '../services/publicationService.js';

/**
 * Lista las publicaciones disponibles en el marketplace.
 * - Query: { search, categoria, precio, orden }
 * - Consulta `Publicacion`, `Mazo`, `Usuario` y `Compra` para el usuario.
 * - Responde con publicaciones filtradas y los ids de compras del usuario.
 */
export const listMarketplace = async (req, res, next) => {
  try {
    const params = [];
    const where = ['p.publico = 1', 'm.enColeccion = 1', 'u.activo = 1', 'dueno.activo = 1'];
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
         JOIN Usuario dueno ON dueno.IDUsuario = m.IDUsuario
        WHERE ${where.join(' AND ')}
        ORDER BY ${order}`,
      params,
    );
    const [compras] = await pool.query('SELECT fk_id_publicacion FROM Compra WHERE fk_id_usuario = ?', [req.usuario.IDUsuario]);
    return res.json({ publicaciones, mazosAdquiridos: compras.map((row) => row.fk_id_publicacion), categorias: categories });
  } catch (error) {
    return next(error);
  }
};

/**
 * Devuelve el detalle completo de una publicación del marketplace.
 * - Params: { id }
 * - Usa `getPublicationDetail` para obtener datos del mazo, creador, tarjetas y valoraciones.
 * - Responde con la información de la publicación o 404 si no existe.
 */
export const getMarketplaceDetail = async (req, res, next) => {
  try {
    const detail = await getPublicationDetail(req.params.id, req.usuario.IDUsuario);
    if (!detail) return res.status(404).json({ message: 'Publicacion no encontrada.' });
    return res.json(detail);
  } catch (error) {
    return next(error);
  }
};

/**
 * Adquiere un mazo gratuito desde marketplace.
 * - Params: { id }
 * - Valida que la publicación sea gratis y no esté comprada.
 * - Clona el mazo y crea la compra en transacción.
 * - Responde con el nuevo id de mazo.
 */
export const acquireFreeDeck = async (req, res, next) => {
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
};

/**
 * Confirma un pago por tarjeta para una publicación de pago.
 * - Params: { id }
 * - Body: { nombre_titular, numero_tarjeta, vencimiento, cvv }
 * - Valida tarjeta y crea la compra/clonación en transacción.
 * - Responde con success y el id del nuevo mazo.
 */
export const confirmPayment = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const isPaypalPayment = req.body.provider === 'paypal' || Boolean(req.body.paypal_order_id);
    if (isPaypalPayment) {
      const errors = validate({
        paypal_order_id: ['required', 'max:100'],
        paypal_payer_id: ['required', 'max:100'],
      }, req.body);
      if (hasErrors(res, errors)) return;

      const publicacion = await getPublication(req.params.id);
      if (!publicacion) return res.status(404).json({ message: 'Publicacion no encontrada.' });
      if (Number(publicacion.pago) !== 1) return res.status(409).json({ message: 'Esta publicacion no requiere pago.' });

      const [exists] = await pool.query('SELECT id_Compra FROM Compra WHERE fk_id_usuario = ? AND fk_id_publicacion = ? LIMIT 1', [req.usuario.IDUsuario, req.params.id]);
      if (exists[0]) return res.status(409).json({ message: 'Ya tienes este mazo.' });

      await connection.beginTransaction();
      const newDeckId = await clonePublicationToUser(connection, publicacion, req.usuario.IDUsuario, {
        precioPagado: publicacion.precio,
        nombre_titular: `PayPal ${String(req.body.paypal_payer_id).slice(0, 80)}`,
        ultimos_digitos: String(req.body.paypal_order_id).slice(-4),
      });
      await connection.commit();
      return res.status(201).json({
        success: true,
        IDMazo: newDeckId,
        paypal: {
          orderId: req.body.paypal_order_id,
          payerId: req.body.paypal_payer_id,
          captureId: req.body.paypal_capture_id || null,
        },
      });
    }

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
};

/**
 * Permite al usuario puntuar una publicación.
 * - Params: { id }
 * - Body: { puntuacion, comentario? }
 * - Inserta o actualiza el registro en `Valoracion` y recalcula la media.
 * - Responde con success verdadero.
 */
export const ratePublication = async (req, res, next) => {
  try {
    const errors = validate({ comentario: ['max:250'] }, req.body);
    if (hasErrors(res, errors)) return;

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
};
