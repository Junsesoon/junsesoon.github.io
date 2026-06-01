-- src/scripts/02_schema_templates.sql
-- src/scripts/002_schema_templates.sql

CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(50) NOT NULL,
  property_key VARCHAR(100) NOT NULL,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (template_name, property_key)
);