import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { client } from './turso';

async function initTursoDatabase() {
  const dbEnv = process.env.DB_ENV || 'local';
  const scriptsDir = path.join(process.cwd(), 'src/scripts/turso');

  try {
    console.log(`🏁 Starting Turso (${dbEnv.toUpperCase()}) database initialization...`);

    if (!fs.existsSync(scriptsDir)) {
      console.error(`❌ Turso 스크립트 디렉터리를 찾을 수 없습니다: ${scriptsDir}`);
      return;
    }

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

    console.log(`✅ Turso (${dbEnv.toUpperCase()}) Database initialized successfully!`);
  } catch (error) {
    console.error(`❌ Failed to initialize Turso (${dbEnv.toUpperCase()}) database:`, error);
  } finally {
    client.close();
  }
}

initTursoDatabase();
