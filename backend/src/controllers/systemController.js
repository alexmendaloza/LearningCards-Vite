/**
 * Controlador técnico del sistema.
 * Proporciona endpoints de salud, exploración de esquema y tablas.
 */
import { assertKnownTable, databaseName, getPrimaryKey, getSchema, pool, quoteIdentifier } from '../config/db.js';

/**
 * Health check del servicio.
 * - No recibe parámetros.
 * - Ejecuta una consulta simple `SELECT 1 AS ok`.
 * - Responde con el estado de la conexión y el nombre de la BD.
 */
export const health = async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: rows[0].ok === 1, database: databaseName });
  } catch (error) {
    next(error);
  }
};

/**
 * Devuelve el esquema de la base de datos actual.
 * - No recibe parámetros.
 * - Usa `getSchema` para listar tablas y columnas.
 * - Responde con la estructura completa de la BD.
 */
export const schema = async (_req, res, next) => {
  try {
    res.json({ database: databaseName, tables: await getSchema() });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista filas de una tabla dada.
 * - Params: { table }
 * - Valida que la tabla exista y ejecuta SELECT * LIMIT.
 * - Responde con filas de la tabla solicitada.
 */
export const listTableRows = async (req, res, next) => {
  try {
    const tableName = req.params.table;
    await assertKnownTable(tableName);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const [rows] = await pool.query(`SELECT * FROM ${quoteIdentifier(tableName)} LIMIT ?`, [limit]);
    res.json({ table: tableName, rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una fila específica de una tabla por id.
 * - Params: { table, id }
 * - Busca la clave primaria de la tabla y ejecuta SELECT WHERE id.
 * - Responde con la fila encontrada o error 404.
 */
export const getTableRow = async (req, res, next) => {
  try {
    const schemaRows = await getSchema();
    const table = schemaRows.find((item) => item.name === req.params.table);
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
};
