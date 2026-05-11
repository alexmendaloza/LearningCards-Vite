import { pool } from '../server/db.js';
async function run() {
  try {
    console.log('Checking columns...');
    const [columns] = await pool.query('SHOW COLUMNS FROM Tarjeta');
    const names = columns.map((c) => c.Field);
    
    if (!names.includes('tipo')) {
      console.log('Adding tipo column...');
      await pool.query("ALTER TABLE Tarjeta ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'basica'");
    } else {
      console.log('tipo column already exists.');
    }
    
    if (!names.includes('opciones')) {
      console.log('Adding opciones column...');
      await pool.query('ALTER TABLE Tarjeta ADD COLUMN opciones JSON NULL');
    } else {
      console.log('opciones column already exists.');
    }
    
    console.log('Migration finished successfully.');
  } catch (e) {
    console.error('Migration failed:', e.message);
  }
  process.exit(0);
}
run();
