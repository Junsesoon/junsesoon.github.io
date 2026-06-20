import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function initDatabase() {
  try {
    console.log('🏁 Starting PostgreSQL database initialization...');

    const scriptsDir = path.join(process.cwd(), 'src/scripts/neon');
    
    if (!fs.existsSync(scriptsDir)) {
      console.error(`❌ PostgreSQL 스크립트 디렉터리를 찾을 수 없습니다: ${scriptsDir}`);
      return;
    }

    // neon 폴더 아래의 모든 .sql 파일들을 가져와 알파벳(숫자)순 정렬
    const scripts = fs.readdirSync(scriptsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    if (scripts.length === 0) {
      console.log('⚠️ 실행할 PostgreSQL SQL 스크립트 파일이 없습니다.');
      return;
    }

    console.log(`Found ${scripts.length} PostgreSQL SQL script files to execute.`);

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      const scriptPath = path.join(scriptsDir, script);
      const query = fs.readFileSync(scriptPath, 'utf8');
      
      console.log(`[${i + 1}/${scripts.length}] Executing ${script}...`);
      await pool.query(query);
    }

    console.log('✅ PostgreSQL Database initialized and seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL database:', error);
  } finally {
    // Close the database connection pool so the Node process can exit
    await pool.end();
  }
}

initDatabase();
