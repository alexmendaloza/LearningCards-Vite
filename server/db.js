/**
 * @fileoverview Configuración y conexión a la base de datos MySQL.
 * Proporciona el pool de conexiones y funciones de utilidad para la introspección 
 * del esquema de la base de datos.
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

// Configuración base usando variables de entorno
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

// Configuración completa incluyendo el nombre de la base de datos
const config = {
  ...baseConfig,
  database: process.env.DB_NAME || 'learning_cards_react',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

export const databaseName = config.database;

// Pool temporal para crear la base de datos si no existe
const bootstrapPool = mysql.createPool(baseConfig);
console.log(`[DB] Conectando a MySQL en ${baseConfig.host}:${baseConfig.port} como "${baseConfig.user}"...`);
await bootstrapPool.query(
  `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(databaseName)}
   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
console.log(`[DB] Base de datos "${databaseName}" asegurada.`);
await bootstrapPool.end();

/**
 * Pool de conexiones principal para ser exportado y usado en toda la aplicación.
 */
export const pool = mysql.createPool(config);

/**
 * Obtiene la estructura completa (esquema) de todas las tablas en la base de datos actual.
 * @returns {Promise<Array>} Un arreglo con las tablas y sus respectivas columnas.
 */
export const getSchema = async () => {
  const [columns] = await pool.query(
    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, ORDINAL_POSITION
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [databaseName],
  );

  const tables = new Map();

  for (const column of columns) {
    if (!tables.has(column.TABLE_NAME)) {
      tables.set(column.TABLE_NAME, {
        name: column.TABLE_NAME,
        columns: [],
      });
    }

    tables.get(column.TABLE_NAME).columns.push({
      name: column.COLUMN_NAME,
      type: column.COLUMN_TYPE,
      nullable: column.IS_NULLABLE === 'YES',
      key: column.COLUMN_KEY,
      defaultValue: column.COLUMN_DEFAULT,
      ordinal: column.ORDINAL_POSITION,
    });
  }

  return [...tables.values()];
};

/**
 * Verifica de forma asíncrona si una tabla existe en la base de datos.
 * Lanza un error HTTP 404 si la tabla no se encuentra.
 * @param {string} tableName - El nombre de la tabla a verificar.
 * @throws {Error} Si la tabla no existe.
 */
export const assertKnownTable = async (tableName) => {
  const [rows] = await pool.query(
    `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      LIMIT 1`,
    [databaseName, tableName],
  );

  if (rows.length === 0) {
    const error = new Error(`La tabla "${tableName}" no existe en ${databaseName}.`);
    error.statusCode = 404;
    throw error;
  }
};

/**
 * Escapa identificadores (nombres de tablas o columnas) de forma segura para evitar inyecciones SQL.
 * @param {string} identifier - El identificador a escapar.
 * @returns {string} El identificador escapado con comillas invertidas.
 */
export const quoteIdentifier = (identifier) => `\`${String(identifier).replaceAll('\`', '\`\`')}\``;

/**
 * Obtiene el nombre de la columna que es clave primaria (Primary Key) de una tabla.
 * @param {Object} table - Objeto que representa la estructura de la tabla (obtenido con getSchema).
 * @returns {string|undefined} El nombre de la columna PK, o indefinido si no se encuentra.
 */
export const getPrimaryKey = (table) => table.columns.find((column) => column.key === 'PRI')?.name;

/**
 * Busca la primera tabla en el esquema cuyo nombre contenga alguno de los patrones dados (ignorando mayúsculas).
 * @param {Array} schema - El arreglo de tablas (obtenido con getSchema).
 * @param {Array<string>} patterns - Un arreglo de cadenas de texto a buscar.
 * @returns {Object|undefined} La primera tabla coincidente.
 */
export const findFirstTable = (schema, patterns) => {
  const loweredPatterns = patterns.map((pattern) => pattern.toLowerCase());
  return schema.find((table) => loweredPatterns.some((pattern) => table.name.toLowerCase().includes(pattern)));
};

/**
 * Busca la primera columna en una tabla cuyo nombre contenga alguno de los patrones dados (ignorando mayúsculas).
 * @param {Object} table - Objeto de tabla donde buscar.
 * @param {Array<string>} patterns - Un arreglo de cadenas de texto a buscar.
 * @returns {Object|undefined|null} La primera columna coincidente.
 */
export const findFirstColumn = (table, patterns) => {
  if (!table) return null;

  const loweredPatterns = patterns.map((pattern) => pattern.toLowerCase());
  return table.columns.find((column) => loweredPatterns.some((pattern) => column.name.toLowerCase().includes(pattern)));
};
