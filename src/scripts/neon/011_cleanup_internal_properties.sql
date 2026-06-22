-- src/scripts/neon/011_cleanup_internal_properties.sql

-- 1. property_list 테이블에서 시스템 내부 속성 삭제
DELETE FROM property_list 
WHERE property_name IN (
  'post_status', 
  'has_draft', 
  'draft_title', 
  'draft_content', 
  'draft_properties', 
  'views_count', 
  'likes_count', 
  'created_at', 
  'updated_at', 
  'posted_at'
);

-- 2. 기존 게시물의 properties JSONB 컬럼에서 시스템 내부 속성 제거
UPDATE posts 
SET properties = COALESCE(properties, '{}'::jsonb) 
  - 'post_status'
  - 'has_draft'
  - 'draft_title'
  - 'draft_content'
  - 'draft_properties'
  - 'views_count'
  - 'likes_count'
  - 'created_at'
  - 'updated_at'
  - 'posted_at';
