BEGIN;

-- 1. 스킬 트리 도메인(그리드) 관리를 위한 새로운 테이블 생성
CREATE TABLE IF NOT EXISTS skilltree_domains (
    domain_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    match_category2 VARCHAR(100) UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    display_order INTEGER DEFAULT 0
);

-- 2. 기존 스킬 트리 게시물 확장 테이블의 이름을 skilltree_posts로 변경하여 용도 명확화
ALTER TABLE IF EXISTS skilltree RENAME TO skilltree_posts;

COMMIT;