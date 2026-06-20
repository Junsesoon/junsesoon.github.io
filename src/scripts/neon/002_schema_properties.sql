-- src/scripts/002_schema_properties.sql

-- 독립적인 Property(속성) 관리 테이블
CREATE TABLE IF NOT EXISTS property_list (
  property_id SERIAL PRIMARY KEY,
  property_name VARCHAR(100) UNIQUE NOT NULL,
  property_type VARCHAR(20) DEFAULT 'string',
  is_essential BOOLEAN DEFAULT false, -- 템플릿 무관하게 모든 게시물이 반드시 가져야 하는 전역 속성 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);