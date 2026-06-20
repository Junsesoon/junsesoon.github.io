import 'dotenv/config';
import { createClient } from '@libsql/client';

async function testTursoConnection() {
  const url = process.env.TURSO_DB_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    console.error('❌ 환경 변수가 설정되지 않았습니다. .env 파일에 TURSO_DB_URL 및 TURSO_AUTH_TOKEN을 설정해주세요.');
    return;
  }

  try {
    console.log(`🛠️  Turso DB 연결을 시도합니다... (URL: ${url})`);
    
    const client = createClient({
      url: url,
      authToken: token,
    });

    // SQLite/Turso의 현재 시간 조회
    const res = await client.execute("SELECT datetime('now', '+9 hours') as now");
    console.log(`✅ Turso DB 연결 성공!`);
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
    console.error(`❌ Turso DB 연결 실패:`, err);
  }
}

testTursoConnection();
