import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function initDatabase() {
  try {
    console.log('Starting database initialization...');

    const scripts = [
      '001_schema_posts.sql',
      '002_schema_properties.sql',
      '003_schema_templates.sql',
      '004_schema_likes.sql',
      '005_schema_skilltree.sql',
      '006_schema_views.sql', 
      '007_schema_visitors.sql'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(process.cwd(), 'src/scripts', script);
      const query = fs.readFileSync(scriptPath, 'utf8');
      console.log(`Executing ${script}...`);
      await pool.query(query);
    }

    console.log('Database initialized and seeded successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  } finally {
    // Close the database connection pool so the Node process can exit
    await pool.end();
  }
}

initDatabase();
