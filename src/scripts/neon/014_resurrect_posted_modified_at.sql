-- src/scripts/neon/014_resurrect_posted_modified_at.sql

-- 1. property_list 테이블에 posted_at 및 modified_at 속성을 date 타입의 필수 기본 속성으로 등록
INSERT INTO property_list (property_name, property_type, is_essential, is_required)
VALUES 
  ('posted_at', 'date', true, false),
  ('modified_at', 'date', true, false)
ON CONFLICT (property_name) 
DO UPDATE SET 
  property_type = EXCLUDED.property_type,
  is_essential = EXCLUDED.is_essential;
