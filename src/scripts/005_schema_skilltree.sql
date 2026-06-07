-- src/scripts/005_schema_skilltree.sql

-- 1:1 확장 테이블 전략(Class Table Inheritance) 적용
-- 스킬 트리 게시물도 결국 posts 테이블의 레코드이므로 공통 정보는 posts에 두고, 스킬 트리 고유 속성만 분리 저장합니다.
CREATE TABLE IF NOT EXISTS skilltree (
    post_id UUID PRIMARY KEY REFERENCES posts(post_id) ON DELETE CASCADE,
    domain VARCHAR(100),                -- 기존 category2 (예: Programming Language)
    sub_domain VARCHAR(100),            -- 기존 category3 (열 배치 로직 등에 사용)
    tech_start INTEGER,                 -- techStart 속성에서 파싱된 4자리 연도
    parent_skill TEXT[] DEFAULT '{}',   -- 부모 스킬(parentSkill) 참조 배열
    child_skill TEXT[] DEFAULT '{}',    -- 자식 스킬(childSkill) 참조 배열
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);