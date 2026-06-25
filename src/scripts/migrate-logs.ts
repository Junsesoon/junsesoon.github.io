import 'dotenv/config';
import { pool } from '../infra/neon';
import { client } from '../infra/turso';

// Helper to format Date objects safely for SQLite compatibility
const formatTimestamp = (val: any): string | null => {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  return String(val);
};

const formatDate = (val: any): string | null => {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split('T')[0];
};

// Batch insert helper for Libsql (Turso/SQLite) to ensure speed and bypass parameter limits
async function chunkedInsert(
  tableName: string,
  columns: string[],
  rows: any[][],
  conflictClause: string = 'ON CONFLICT DO NOTHING'
) {
  if (rows.length === 0) return;

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders} ${conflictClause}`;
    const flatArgs = chunk.flat();
    await client.execute({ sql, args: flatArgs });
  }
}

async function migrate() {
  const dbEnv = (process.env.DB_ENV || 'local').trim().toUpperCase();
  console.log(`🏁 Starting migration of logs and stats [DB_ENV: ${dbEnv}]`);
  
  if (dbEnv === 'LOCAL') {
    console.log('🔗 Source: Local PostgreSQL  ==>  Target: Local SQLite (Logs.db)');
  } else {
    console.log('🔗 Source: Remote Neon PostgreSQL  ==>  Target: Remote Turso Cloud DB');
  }

  try {
    // -------------------------------------------------------------
    // 1. Migrate site_stats
    // -------------------------------------------------------------
    console.log('\n🔄 1. Migrating site_stats...');
    const statsResult = await pool.query('SELECT stat_key, stat_value FROM site_stats').catch(e => {
      console.log('⚠️ site_stats table does not exist or failed to query on PostgreSQL. Skipping.');
      return { rows: [] };
    });
    
    if (statsResult.rows.length > 0) {
      const statsRows = statsResult.rows.map(row => [row.stat_key, row.stat_value]);
      await chunkedInsert(
        'site_stats',
        ['stat_key', 'stat_value'],
        statsRows,
        'ON CONFLICT(stat_key) DO UPDATE SET stat_value = excluded.stat_value'
      );
      console.log(`✅ site_stats migrated: ${statsRows.length} rows.`);
    } else {
      console.log('ℹ️ No stats to migrate.');
    }

    // -------------------------------------------------------------
    // 2. Migrate site_visitors -> visitors_manage
    // -------------------------------------------------------------
    console.log('\n🔄 2. Migrating site_visitors -> visitors_manage...');
    const visitorsResult = await pool.query('SELECT visitor_id, ip_address, session_id, visited_date FROM site_visitors').catch(e => {
      console.log('⚠️ site_visitors table does not exist or failed to query on PostgreSQL. Skipping.');
      return { rows: [] };
    });

    if (visitorsResult.rows.length > 0) {
      const visitorsRows = visitorsResult.rows.map(row => [
        row.visitor_id,
        row.ip_address,
        row.session_id,
        formatDate(row.visited_date)
      ]);
      await chunkedInsert(
        'visitors_manage',
        ['visitor_id', 'ip_address', 'session_id', 'visited_date'],
        visitorsRows,
        'ON CONFLICT(session_id, visited_date) DO NOTHING'
      );
      console.log(`✅ visitors_manage migrated: ${visitorsRows.length} rows.`);
    } else {
      console.log('ℹ️ No visitor logs to migrate.');
    }

    // -------------------------------------------------------------
    // 3. Migrate likes_manage
    // -------------------------------------------------------------
    console.log('\n🔄 3. Migrating likes_manage...');
    const likesResult = await pool.query('SELECT like_id, post_id, session_id, created_at FROM likes_manage').catch(e => {
      console.log('⚠️ likes_manage table does not exist or failed to query on PostgreSQL. Skipping.');
      return { rows: [] };
    });

    if (likesResult.rows.length > 0) {
      const likesRows = likesResult.rows.map(row => [
        row.like_id,
        row.post_id,
        row.session_id,
        formatTimestamp(row.created_at)
      ]);
      await chunkedInsert(
        'likes_manage',
        ['like_id', 'post_id', 'session_id', 'created_at'],
        likesRows,
        'ON CONFLICT(post_id, session_id) DO NOTHING'
      );
      console.log(`✅ likes_manage migrated: ${likesRows.length} rows.`);
    } else {
      console.log('ℹ️ No like logs to migrate.');
    }

    // -------------------------------------------------------------
    // 4. Migrate views_manage (JOIN with posts to populate post_title and post_slug)
    // -------------------------------------------------------------
    console.log('\n🔄 4. Migrating views_manage...');
    const viewsResult = await pool.query(`
      SELECT 
        v.view_id, 
        v.post_id, 
        COALESCE(p.title, 'Untitled') AS post_title, 
        COALESCE(p.slug, '') AS post_slug, 
        v.ip_address, 
        v.session_id, 
        v.viewed_at 
      FROM views_manage v
      LEFT JOIN posts p ON v.post_id = p.post_id
    `).catch(e => {
      console.log('⚠️ views_manage table does not exist or failed to query on PostgreSQL. Skipping.');
      return { rows: [] };
    });

    if (viewsResult.rows.length > 0) {
      const viewsRows = viewsResult.rows.map(row => [
        row.view_id,
        row.post_id,
        row.post_title,
        row.post_slug,
        row.ip_address,
        row.session_id,
        formatTimestamp(row.viewed_at)
      ]);
      await chunkedInsert(
        'views_manage',
        ['view_id', 'post_id', 'post_title', 'post_slug', 'ip_address', 'session_id', 'viewed_at'],
        viewsRows,
        'ON CONFLICT(view_id) DO NOTHING'
      );
      console.log(`✅ views_manage migrated: ${viewsRows.length} rows.`);
    } else {
      console.log('ℹ️ No view logs to migrate.');
    }

    console.log('\n🎉 Migration process completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed with error:', error);
  } finally {
    // Clean up connections
    await pool.end();
    client.close();
  }
}

migrate();
