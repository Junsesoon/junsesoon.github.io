import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

const dbEnv = process.env.DB_ENV || 'local';

const getPoolConfig = (): PoolConfig => {
  if (dbEnv === 'local') {
    return {
      host: process.env.LOCAL_DB_HOST,
      port: Number(process.env.LOCAL_DB_PORT),
      user: process.env.LOCAL_DB_USER,
      password: process.env.LOCAL_DB_PASSWORD,
      database: process.env.LOCAL_DB_DATABASE,
      ssl: process.env.LOCAL_DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    host: process.env.REMOTE_DB_HOST,
    port: Number(process.env.REMOTE_DB_PORT),
    user: process.env.REMOTE_DB_USER,
    password: process.env.REMOTE_DB_PASSWORD,
    database: process.env.REMOTE_DB_DATABASE,
    ssl: process.env.REMOTE_DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
};

const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

export const pool = globalForPg.pgPool ?? new Pool(getPoolConfig());

if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool;
}

// 외부에서 db.query() 호출 시 사용할 함수
export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
): Promise<QueryResult<T>> => {
  return pool.query(text, params);
};
