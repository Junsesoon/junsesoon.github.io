-- src/scripts/010_schema_post_drafts.sql

BEGIN;

-- 1. 임시저장 및 발행 여부 관리를 위한 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS post_status VARCHAR(20) DEFAULT 'published', -- 발행(공개) 상태 ('published', 'draft' 등)
ADD COLUMN IF NOT EXISTS draft_title VARCHAR(255),               -- 임시저장된 제목
ADD COLUMN IF NOT EXISTS draft_content TEXT,                     -- 임시저장된 본문
ADD COLUMN IF NOT EXISTS draft_properties JSONB;                 -- 임시저장된 메타데이터(프론트매터)

COMMIT;