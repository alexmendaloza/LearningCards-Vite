/**
 * Controlador de mazos y tarjetas.
 * Contiene la lógica para crear, editar, eliminar mazos y tarjetas,
 * así como el flujo de estudio y publicación.
 */
import { categories } from '../config/appConfig.js';
import { pool } from '../config/db.js';
import { nowSql, todaySql } from '../utils/dates.js';
import { hasErrors, isValidUrl, validate } from '../utils/validation.js';

const normalizeCardOptions = (card) => {
  const opcionesRaw = card.opciones;
  if (Array.isArray(opcionesRaw)) return { ...card, opciones: opcionesRaw };
  if (!opcionesRaw) return { ...card, opciones: [] };
  if (typeof opcionesRaw === 'string') {
    try {
      const parsed = JSON.parse(opcionesRaw);
      return { ...card, opciones: Array.isArray(parsed) ? parsed : [] };
    } catch {
      return { ...card, opciones: [] };
    }
  }
  return { ...card, opciones: [] };
};

/**
 * Crea un nuevo mazo para el usuario autenticado.
 * - Body: { titulo, descripcion }
 * - Inserta un registro en `Mazo` con `original=1` y `enColeccion=1`.
 * - Responde con el id del mazo creado.
 */
export const createDeck = async (req, res, next) => {
  try {
    const errors = validate({ titulo: ['required', 'max:100'], descripcion: ['max:250'] }, req.body);
    if (hasErrors(res, errors)) return;

    const [result] = await pool.query(
      'INSERT INTO Mazo (titulo, descripcion, limite, IDUsuario, original, enColeccion) VALUES (?, ?, 0, ?, 1, 1)',
      [req.body.titulo, req.body.descripcion || null, req.usuario.IDUsuario],
    );
    return res.status(201).json({ IDMazo: result.insertId });
  } catch (error) {
    return next(error);
  }
};

/**
 * Obtiene un mazo y sus tarjetas por id.
 * - Params: { id }
 * - Consulta `Mazo` y `Tarjeta` para el mazo solicitado.
 * - Responde con el mazo y sus tarjetas si existe y pertenece al usuario o al admin.
 */
export const getDeck = async (req, res, next) => {
  try {
    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? LIMIT 1', [req.params.id]);
    const mazo = mazos[0];
    if (!mazo) return res.status(404).json({ message: 'Mazo no encontrado.' });
    if (mazo.IDUsuario !== req.usuario.IDUsuario && req.usuario.rol !== 'admin') return res.status(403).json({ message: 'No autorizado.' });
    const [tarjetas] = await pool.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [req.params.id]);
    const sanitizedTarjetas = tarjetas.map(normalizeCardOptions);
    return res.json({ mazo, tarjetas: sanitizedTarjetas });
  } catch (error) {
    return next(error);
  }
};

/**
 * Actualiza los datos de un mazo existente.
 * - Params: { id }
 * - Body: { titulo, descripcion }
 * - Ejecuta UPDATE sobre `Mazo` si el mazo pertenece al usuario.
 * - Responde con success verdadero si se actualizó.
 */
export const updateDeck = async (req, res, next) => {
  try {
    const errors = validate({ titulo: ['required', 'max:100'], descripcion: ['max:250'] }, req.body);
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
};

/**
 * Marca un mazo como eliminado en la colección del usuario.
 * - Params: { id }
 * - Ejecuta UPDATE en `Mazo` y despublica la publicación relacionada.
 * - Responde con success verdadero si el mazo fue encontrado.
 */
export const deleteDeck = async (req, res, next) => {
  try {
    const [result] = await pool.query('UPDATE Mazo SET enColeccion = 0 WHERE IDMazo = ? AND IDUsuario = ?', [req.params.id, req.usuario.IDUsuario]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Mazo no encontrado.' });
    await pool.query('UPDATE Publicacion SET publico = 0 WHERE fk_id_mazo = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

/**
 * Crea o actualiza una tarjeta dentro de un mazo.
 * - Body: { frente, reverso, tipo, opciones, IDMazo, IDTarjeta? }
 * - Verifica que el mazo pertenezca al usuario.
 * - Inserta en `Tarjeta` o actualiza el registro existente.
 * - Responde con el id de la tarjeta o success.
 */
export const saveCard = async (req, res, next) => {
  try {
    const errors = validate({ frente: ['required'], reverso: ['required'], IDMazo: ['required'] }, req.body);
    if (hasErrors(res, errors)) return;
    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? AND IDUsuario = ? LIMIT 1', [req.body.IDMazo, req.usuario.IDUsuario]);
    if (!mazos[0]) return res.status(403).json({ message: 'No autorizado.' });

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
};

/**
 * Elimina una tarjeta del mazo solo si pertenece al usuario autenticado.
 * - Params: { id }
 * - Ejecuta DELETE en `Tarjeta` mediante JOIN con `Mazo`.
 * - Responde con success verdadero.
 */
export const deleteCard = async (req, res, next) => {
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
};

/**
 * Obtiene el mazo y tarjetas necesarias para iniciar una sesión de estudio.
 * - Params: { id }
 * - Consulta `Mazo` y `Tarjeta` con orden ascendente.
 * - Responde con mazo y tarjetas.
 */
export const getStudyDeck = async (req, res, next) => {
  try {
    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? LIMIT 1', [req.params.id]);
    if (!mazos[0]) return res.status(404).json({ message: 'Mazo no encontrado.' });
    const [tarjetas] = await pool.query('SELECT * FROM Tarjeta WHERE IDMazo = ? ORDER BY orden, IDTarjeta', [req.params.id]);
    return res.json({ mazo: mazos[0], tarjetas });
  } catch (error) {
    return next(error);
  }
};

/**
 * Registra el cierre de sesión de estudio y actualiza la racha del usuario.
 * - Params: { id }
 * - Body: { aciertos, fallos, fechaini?, fechafin? }
 * - Inserta en `SesionEstudio` y actualiza `Usuario` con racha y totales.
 * - Responde con la racha actualizada y el nivel calculado.
 */
export const finishStudy = async (req, res, next) => {
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
};

/**
 * Obtiene los datos previos a publicar un mazo.
 * - Params: { id }
 * - Consulta `Mazo`, `Publicacion` y el conteo de tarjetas.
 * - Responde con el mazo, publicación existente, categorías y total de tarjetas.
 */
export const getPublishData = async (req, res, next) => {
  try {
    const [mazos] = await pool.query('SELECT * FROM Mazo WHERE IDMazo = ? AND IDUsuario = ? LIMIT 1', [req.params.id, req.usuario.IDUsuario]);
    if (!mazos[0]) return res.status(403).json({ message: 'No tienes permiso para publicar este mazo.' });
    const [publicacion] = await pool.query('SELECT * FROM Publicacion WHERE fk_id_mazo = ? LIMIT 1', [req.params.id]);
    const [cards] = await pool.query('SELECT COUNT(*) AS total FROM Tarjeta WHERE IDMazo = ?', [req.params.id]);
    return res.json({ mazo: mazos[0], publicacion: publicacion[0] || null, categorias: categories, tarjetas_count: cards[0].total });
  } catch (error) {
    return next(error);
  }
};

/**
 * Publica o actualiza la publicación de un mazo.
 * - Params: { id }
 * - Body: { categoria, descripcion_publica, imagen_url, pago, precio }
 * - Valida contenido y actualiza o inserta en `Publicacion`.
 * - Responde con success y el id de publicación.
 */
export const publishDeck = async (req, res, next) => {
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
};
