-- src/scripts/007_schema_visitors.sql

-- 1. 방문자 이력 기록 테이블 (Unique Visitors 계산 및 봇 차단 목적)
CREATE TABLE IF NOT EXISTS site_visitors (
  visitor_id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- 동일한 브라우저(기기)가 하루에 여러 번 방문하더라도 1번만 기록되도록 복합 고유(Unique) 제약 조건 설정
  CONSTRAINT unique_visitor_per_day UNIQUE (session_id, visited_date)
);

-- 2. 전체 통계 캐싱 테이블 (전체 방문자 수 누적용)
CREATE TABLE IF NOT EXISTS site_stats (
  stat_key VARCHAR(50) PRIMARY KEY,
  stat_value INTEGER DEFAULT 0
);

-- 3. 총 방문자 수 초기 데이터(0) 삽입 (이미 존재하면 무시)
INSERT INTO site_stats (stat_key, stat_value) 
VALUES ('total_visitors', 0) 
ON CONFLICT (stat_key) DO NOTHING;