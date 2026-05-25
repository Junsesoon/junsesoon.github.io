import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function initDatabase() {
  try {
    console.log('Starting database initialization...');

    // Construct the path to the seed SQL file
    const sqlFilePath = path.join(process.cwd(), 'src/scripts', 'seed-001.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the queries
    await pool.query(sqlQuery);
    
    console.log('Database initialized and seeded successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  } finally {
    // Close the database connection pool so the Node process can exit
    await pool.end();
  }
}

initDatabase();
