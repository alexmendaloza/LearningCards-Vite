import { pool } from '../config/db.js';
import { nowSql } from '../utils/dates.js';

export const recalculateRating = async (publicationId) => {
  const [rows] = await pool.query(
    'SELECT ROUND(AVG(puntuacion), 2) AS promedio, COUNT(*) AS total FROM Valoracion WHERE fk_id_publicacion = ?',
    [publicationId],
  );
  await pool.query(
    'UPDATE Publicacion SET promedio_valoracion = ?, num_valoraciones = ? WHERE id_Publ = ?',
    [rows[0].promedio || 0, rows[0].total || 0, publicationId],
  );
};

export const getPublication = async (id) => {
  const [rows] = await pool.query(
    `SELECT p.*, m.titulo, m.descripcion, m.IDUsuario AS mazo_usuario_id, u.UserName, u.NombreCompleto, u.fotoruta
       FROM Publicacion p
       JOIN Mazo m ON m.IDMazo = p.fk_id_mazo
       JOIN Usuario u ON u.IDUsuario = p.fk_id_usuario
       JOIN Usuario dueno ON dueno.IDUsuario = m.IDUsuario
      WHERE p.id_Publ = ?
        AND p.publico = 1
        AND m.enColeccion = 1
        AND u.activo = 1
        AND dueno.activo = 1
      LIMIT 1`,
    [id],
  );
  return rows[0] || null;
};

export const getPublicationDetail = async (id, userId) => {
  const publicacion = await getPublication(id);
  if (!publicacion) return null;

  const [[mazo], [tarjetas], [valoraciones], [compra], [miValoracion]] = await Promise.all([
    pool.query('SELECT * FROM Mazo WHERE IDMazo = ? LIMIT 1', [publicacion.fk_id_mazo]),
    pool.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [publicacion.fk_id_mazo]),
    pool.query(
      `SELECT v.*, u.UserName, u.NombreCompleto, u.fotoruta
         FROM Valoracion v
         JOIN Usuario u ON u.IDUsuario = v.fk_id_usuario
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

export const clonePublicationToUser = async (connection, publicacion, userId, payment = {}) => {
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
    const opciones = typeof card.opciones === 'string'
      ? card.opciones
      : card.opciones
        ? JSON.stringify(card.opciones)
        : null;
    await connection.query(
      'INSERT INTO Tarjeta (frente, reverso, tipo, opciones, orden, IDMazo) VALUES (?, ?, ?, ?, ?, ?)',
      [card.frente, card.reverso, card.tipo, opciones, card.orden, newDeck.insertId],
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
