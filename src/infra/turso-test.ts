import 'dotenv/config';
import { client } from './turso';

async function testTursoConnection() {
  const dbEnv = process.env.DB_ENV || 'local';

  try {
    console.log(`🛠️  Turso (${dbEnv.toUpperCase()}) DB 연결을 시도합니다...`);
    
    // SQLite/Turso의 현재 시간 조회
    const res = await client.execute("SELECT datetime('now', '+9 hours') as now");
    console.log(`✅ Turso (${dbEnv.toUpperCase()}) DB 연결 성공!`);
    console.log("데이터베이스 서버 시간 (KST):", res.rows[0].now);

    // 생성된 테이블 리스트 조회
    const tablesRes = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%';
    `);
    
    console.log("DB 테이블 목록:");
    if (tablesRes.rows.length === 0) {
      console.log("  (존재하는 테이블이 없습니다. 스키마를 먼저 등록해주세요.)");
    } else {
      tablesRes.rows.forEach(row => {
        console.log(`  - ${row.name}`);
      });
    }
  } catch (err) {
    console.error(`❌ Turso (${dbEnv.toUpperCase()}) DB 연결 실패:`, err);
  } finally {
    client.close();
  }
}

testTursoConnection();
