import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';

async function initTursoDatabase() {
  const url = process.env.TURSO_DB_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    console.error('❌ 환경 변수가 설정되지 않았습니다. .env 파일에 TURSO_DB_URL 및 TURSO_AUTH_TOKEN을 설정해주세요.');
    return;
  }

  const client = createClient({
    url: url,
    authToken: token,
  });

  const scriptsDir = path.join(process.cwd(), 'src/scripts/turso');

  try {
    console.log('🏁 Starting Turso database initialization...');

    if (!fs.existsSync(scriptsDir)) {
      console.error(`❌ Turso 스크립트 디렉터리를 찾을 수 없습니다: ${scriptsDir}`);
      return;
    }

    // turso 폴더 아래의 모든 .sql 파일들을 가져와 알파벳(숫자)순 정렬
    const scripts = fs.readdirSync(scriptsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    if (scripts.length === 0) {
      console.log('⚠️ 실행할 Turso SQL 스크립트 파일이 없습니다.');
      return;
    }

    console.log(`Found ${scripts.length} Turso SQL script files to execute.`);

    for (let scriptIdx = 0; scriptIdx < scripts.length; scriptIdx++) {
      const script = scripts[scriptIdx];
      const scriptPath = path.join(scriptsDir, script);
      console.log(`[${scriptIdx + 1}/${scripts.length}] Reading script: ${script}...`);
      const query = fs.readFileSync(scriptPath, 'utf8');
      
      // SQLite/Libsql은 단일 execute에서 세미콜론이 포함된 다중 DDL 명령을 일괄 실행하지 못하므로,
      // 세미콜론 기준으로 분할하여 각각 실행합니다.
      const statements = query
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      console.log(`Executing ${statements.length} SQL statements from ${script}...`);
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const titleLine = stmt.split('\n')[0].replace('CREATE TABLE IF NOT EXISTS', 'Table:').replace('CREATE INDEX IF NOT EXISTS', 'Index:').trim();
        console.log(`  [${i + 1}/${statements.length}] Running: ${titleLine}...`);
        await client.execute(stmt);
      }
    }

    console.log('✅ Turso Database initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize Turso database:', error);
  }
}

initTursoDatabase();
