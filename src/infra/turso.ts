import { createClient, Client, ResultSet, InValue } from '@libsql/client';

const dbEnv = (process.env.DB_ENV || 'local').replace(/['"]/g, '').trim();

const getTursoConfig = () => {
  // DB_ENV가 local일 경우, 별도 변수 설정 없이 로컬 파일(Logs.db)로 자동 우회
  if (dbEnv === 'local') {
    return {
      url: 'file:Logs.db',
    };
  }

  // remote일 경우 env 환경 변수를 사용
  return {
    url: process.env.TURSO_DB_URL || 'libsql://dummy-local-db.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
  };
};

const globalForTurso = globalThis as unknown as {
  tursoClient: Client | undefined;
};

export const client: Client = globalForTurso.tursoClient ?? createClient(getTursoConfig());

if (process.env.NODE_ENV !== 'production') {
  globalForTurso.tursoClient = client;
}

/**
 * Turso(Libsql) DB에 단일 쿼리를 실행하는 헬퍼 함수
 * @param sql 실행할 SQL 쿼리문
 * @param args 바인딩할 파라미터 (배열 또는 키-값 객체)
 */
export const query = (
  sql: string,
  args?: InValue[] | Record<string, InValue>
): Promise<ResultSet> => {
  return client.execute({ sql, args: args || [] });
};
