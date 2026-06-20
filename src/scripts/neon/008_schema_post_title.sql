BEGIN;

-- 1. posts 테이블에 title 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- 2. 기존 properties JSONB에서 title을 추출하여 새 컬럼에 마이그레이션
UPDATE posts SET title = properties->>'title' WHERE title IS NULL AND properties ? 'title';

-- 3. properties에서 기존 title 속성 제거 (중복 데이터 방지)
UPDATE posts SET properties = properties - 'title' WHERE properties ? 'title';

-- 4. 모든 게시물에 title이 채워졌다면 NOT NULL 제약조건 추가
ALTER TABLE posts ALTER COLUMN title SET NOT NULL;

COMMIT;