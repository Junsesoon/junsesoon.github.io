-- src/scripts/004_schema_likes.sql

-- 1. posts 테이블에 역정규화 컬럼 추가 (조회 성능 O(1) 보장)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 2. 좋아요 내역 관리 테이블 (세션 기반 중복/도배 차단)
CREATE TABLE IF NOT EXISTS likes_manage (
  like_id SERIAL PRIMARY KEY,
  post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, session_id)
);