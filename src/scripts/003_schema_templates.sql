-- src/scripts/003_schema_templates.sql

-- 템플릿 카테고리(목록)를 관리하는 테이블
CREATE TABLE IF NOT EXISTS template_list (
  template_id SERIAL PRIMARY KEY,
  template_name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 템플릿과 개별 커스텀 속성을 매핑해주는 중간(Join) 테이블 (M:N 관계)
CREATE TABLE IF NOT EXISTS template_property (
  template_id INTEGER REFERENCES template_list(template_id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES property_list(property_id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (template_id, property_id)
);