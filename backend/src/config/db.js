import mysql from 'mysql2/promise';
import 'dotenv/config';

/**
 * Configuración base de conexión MySQL usada para crear pools.
 * Valores por defecto compatibles con una instalación local XAMPP.
 */
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

/**
 * Configuración completa que incluye el nombre de la base de datos.
 * `DB_NAME` puede establecerse en el `.env`, por defecto `learning_cards_react`.
 */
const config = {
  ...baseConfig,
  database: process.env.DB_NAME || 'learning_cards_react',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

/**
 * Nombre de la base de datos utilizada por la aplicación.
 * Exportado para permitir utilidades y middlewares que necesiten el nombre.
 */
export const databaseName = config.database;

/**
 * Pool temporal para crear/asegurar la existencia de la base de datos.
 * Este bloque ejecuta un `CREATE DATABASE IF NOT EXISTS` de forma segura
 * y cierra el pool bootstrap una vez completado.
 */
const bootstrapPool = mysql.createPool(baseConfig);
console.log(`[DB] Conectando a MySQL en ${baseConfig.host}:${baseConfig.port} como "${baseConfig.user}"...`);
await bootstrapPool.query(
  `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(databaseName)}
   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
console.log(`[DB] Base de datos "${databaseName}" asegurada.`);
await bootstrapPool.end();

/**
 * Pool principal exportado para uso en controladores y servicios.
 * Usar `pool` para ejecutar consultas preparadas/seguras.
 */
export const pool = mysql.createPool(config);

/**
 * Obtiene el esquema (tablas y columnas) de la base de datos actual.
 * - No recibe parámetros.
 * - Retorna un arreglo de objetos: { name, columns: [{ name, type, nullable, key, defaultValue, ordinal }] }
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
 * Verifica que una tabla exista en la base de datos.
 * - `tableName` (string): nombre de la tabla a verificar.
 * - Lanza un error con `statusCode = 404` si la tabla no existe.
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
 * Escapa un identificador (tabla/columna) para uso seguro en consultas dinámicas.
 * - `identifier` (string): texto a escapar.
 * - Retorna el identificador entre comillas invertidas.
 */
export const quoteIdentifier = (identifier) => `\`${String(identifier).replaceAll('`', '``')}\``;

/**
 * Obtiene el nombre de la clave primaria (si existe) de una tabla representada
 * por el objeto devuelto por `getSchema`.
 * - `table` (object): objeto con `columns`.
 * - Retorna el nombre de la columna PK o `undefined`.
 */
export const getPrimaryKey = (table) => table.columns.find((column) => column.key === 'PRI')?.name;
