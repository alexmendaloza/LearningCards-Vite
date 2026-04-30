import mysql from 'mysql2/promise';
import 'dotenv/config';

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

const config = {
  ...baseConfig,
  database: process.env.DB_NAME || 'learning_cards_react',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
};

export const databaseName = config.database;

const bootstrapPool = mysql.createPool(baseConfig);
await bootstrapPool.query(
  `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(databaseName)}
   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
);
await bootstrapPool.end();

export const pool = mysql.createPool(config);

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

export const quoteIdentifier = (identifier) => `\`${String(identifier).replaceAll('`', '``')}\``;

export const getPrimaryKey = (table) => table.columns.find((column) => column.key === 'PRI')?.name;

export const findFirstTable = (schema, patterns) => {
  const loweredPatterns = patterns.map((pattern) => pattern.toLowerCase());
  return schema.find((table) => loweredPatterns.some((pattern) => table.name.toLowerCase().includes(pattern)));
};

export const findFirstColumn = (table, patterns) => {
  if (!table) return null;

  const loweredPatterns = patterns.map((pattern) => pattern.toLowerCase());
  return table.columns.find((column) => loweredPatterns.some((pattern) => column.name.toLowerCase().includes(pattern)));
};
