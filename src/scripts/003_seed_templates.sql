-- src/scripts/03_seed_templates.sql
-- src/scripts/003_seed_templates.sql

INSERT INTO templates (template_name, property_key, is_required)
VALUES 
  ('project', 'DB', true),
  ('project', 'IDE', true),
  ('project', 'Library', false)
ON CONFLICT (template_name, property_key) DO NOTHING;