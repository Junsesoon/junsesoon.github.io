-- src/scripts/neon/012_add_property_required.sql

-- 1. property_list 테이블에 입력 필수(is_required) 여부 컬럼 추가
ALTER TABLE property_list 
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;
