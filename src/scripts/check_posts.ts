import 'dotenv/config';
import { query } from '../infra/neon';

async function main() {
  try {
    const res = await query('SELECT slug, title, post_status FROM posts', []);
    console.log('Posts in database:', res.rows);
  } catch (e) {
    console.error('Error running query:', e);
  }
}

main();
