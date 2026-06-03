-- src/scripts/02_schema_templates.sql
-- src/scripts/002_schema_templates.sql

-- 템플릿 카테고리(목록)를 관리하는 테이블
CREATE TABLE IF NOT EXISTS template_list (
  template_id SERIAL PRIMARY KEY,
  template_name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 각 템플릿의 속성(Property)들을 관리하는 테이블
CREATE TABLE IF NOT EXISTS template_property (
  template_id INTEGER REFERENCES template_list(template_id) ON DELETE CASCADE,
  property_key VARCHAR(100) NOT NULL,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (template_id, property_key)
);