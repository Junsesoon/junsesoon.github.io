-- src/scripts/006_schema_views.sql

-- 1. posts 테이블에 역정규화 컬럼 추가 (조회 성능 최적화)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 2. 조회수 이력 관리 테이블 (IP 및 세션 기반 중복 어뷰징 차단)
CREATE TABLE IF NOT EXISTS views_manage (
  view_id SERIAL PRIMARY KEY,
  post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL,
  ip_address VARCHAR(45) NOT NULL, -- IPv6 주소 길이까지 고려하여 VARCHAR(45) 할당
  session_id VARCHAR(255) NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 쿨다운 체크 시 검색 성능 최적화를 위한 복합 인덱스 추가
-- "이 게시물을, 이 IP가, 언제 조회했는가?"를 빠르게 찾을 수 있도록 돕습니다.
CREATE INDEX IF NOT EXISTS idx_views_manage_cooldown 
ON views_manage (post_id, ip_address, viewed_at);