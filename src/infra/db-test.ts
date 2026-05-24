import 'dotenv/config';
import { query } from "./db.js";

// DB 연결 테스트 함수
async function testDBConnection() {
  const dbEnv = process.env.DB_ENV || 'local';

  try {
    console.log(`🛠️  ${dbEnv.toUpperCase()} DB 연결을 시도합니다...`);
    
    // PostgreSQL 서버의 현재 시간을 조회
    const res = await query("SELECT NOW()");
    
    console.log(`✅ ${dbEnv.toUpperCase()} DB 연결 성공!`);
    console.log("데이터베이스 서버 시간:", res.rows[0].now);
  } catch (err) {
    console.error(`❌ ${dbEnv.toUpperCase()} DB 연결 실패:`, err);
  }
}

testDBConnection();