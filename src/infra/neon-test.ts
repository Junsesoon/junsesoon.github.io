import 'dotenv/config';
import { query } from "./neon.js";

// DB 연결 테스트 함수
async function testDBConnection() {
  const dbEnv = process.env.DB_ENV || 'local';

  try {
    console.log(`🛠️  ${dbEnv.toUpperCase()} DB 연결을 시도합니다...`);
    
    // PostgreSQL 서버의 현재 시간을 조회
    const res = await query("SELECT NOW()");
    
    console.log(`✅ ${dbEnv.toUpperCase()} DB 연결 성공!`);
    console.log("데이터베이스 서버 시간:", res.rows[0].now);

    // PostgreSQL 테이블 리스트 조회
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log("DB 테이블 목록:");
    if (tablesRes.rows.length === 0) {
      console.log("  (존재하는 테이블이 없습니다. 스키마를 먼저 등록해주세요.)");
    } else {
      tablesRes.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
  } catch (err) {
    console.error(`❌ ${dbEnv.toUpperCase()} DB 연결 실패:`, err);
  }
}

testDBConnection();