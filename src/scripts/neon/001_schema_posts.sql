-- src/scripts/001_schema_posts.sql

-- posts: 시스템 필수 속성과 동적 속성(JSONB)만 포함하는 가장 유연한 형태의 테이블
CREATE TABLE IF NOT EXISTS posts (
    -- 시스템 기본 컬럼
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL 라우팅 및 파일명 기준
    content TEXT NOT NULL, -- 파싱되지 않은 마크다운 본문 

    -- 모든 프론트매터 메타데이터를 담는 단일 JSONB 컬럼 (title, tags 등 모든 속성 포함)
    properties JSONB DEFAULT '{}'::jsonb,

    -- 시스템 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);