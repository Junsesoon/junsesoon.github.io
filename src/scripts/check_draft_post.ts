import 'dotenv/config';
import { query } from '../infra/neon';

async function main() {
  try {
    const res = await query(
      "SELECT post_id, slug, title, content, properties, post_status, draft_title, draft_content, draft_properties FROM posts WHERE slug = $1", 
      ['aaaa/aaaaaa/aaaa/aaa/aaa']
    );
    console.log('Post details:', res.rows[0]);
  } catch (e) {
    console.error('Error running query:', e);
  }
}

main();
