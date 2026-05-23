import { Pool, QueryResult, QueryResultRow } from 'pg';

// ⚠️ .env 파일에서 DATABASE_URL 설정 확인
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 외부에서 db.query() 호출 시 사용할 함수
export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
): Promise<QueryResult<T>> => {
  return pool.query(text, params);
};
