-- src/scripts/01_schema_posts.sql
-- src/scripts/001_schema_posts.sql

-- posts: 테이블은 모든 게시물의 공통 속성을 포함하며, 각 게시물은 고유한 slug를 통해 식별됨
CREATE TABLE IF NOT EXISTS posts (
    -- 시스템 기본 컬럼
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL 라우팅 및 파일명 기준
    content TEXT NOT NULL, -- 파싱되지 않은 마크다운 본문 

    -- 공통 속성(Common)
    title VARCHAR(255) NOT NULL,
    posted_at TIMESTAMP,
    modified_at TIMESTAMP,
    summary TEXT,
    tags TEXT[], -- PostgreSQL 네이티브 스칼라 배열 지원
    project_name VARCHAR(255),
    
    category1 VARCHAR(100),
    category2 VARCHAR(100),
    category3 VARCHAR(100),
    category4 VARCHAR(100),

    doc_ver VARCHAR(50),

    -- 시스템 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 트러블 슈팅(Trouble Shooting)
CREATE TABLE IF NOT EXISTS trouble_shooting (
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    completion BOOLEAN DEFAULT false
);

-- 스킬 트리(Skill Tree)
CREATE TABLE IF NOT EXISTS skill_tree (    
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    tech_start TIMESTAMP,
    parent_skill VARCHAR(255),
    child_skill VARCHAR(255)
);

-- 나의 스킬(My Skill)
CREATE TABLE IF NOT EXISTS my_skill (
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    familiar SMALLINT
);

-- 프로젝트(Project)
CREATE TABLE IF NOT EXISTS project (
    post_id UUID REFERENCES posts(post_id) ON DELETE CASCADE,
    contribute TEXT,
    my_role VARCHAR(255),

    -- 사용한 기술 스택(Tech Stack)
    tech_platform VARCHAR(255),
    tech_language VARCHAR(255),
    tech_server VARCHAR(255),
    tech_framework VARCHAR(255),
    tech_db VARCHAR(255),
    tech_ide VARCHAR(255),
    tech_api VARCHAR(255),
    tech_library VARCHAR(255)
);