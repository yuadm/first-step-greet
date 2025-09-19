-- Insert default job positions into job_application_settings
INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
VALUES 
  ('position', 'position', 'position_Care Assistant', '{"title": "Care Assistant", "is_active": true, "display_order": 1}', 1, true, now(), now()),
  ('position', 'position', 'position_Senior Care Assistant', '{"title": "Senior Care Assistant", "is_active": true, "display_order": 2}', 2, true, now(), now()),
  ('position', 'position', 'position_Care Coordinator', '{"title": "Care Coordinator", "is_active": true, "display_order": 3}', 3, true, now(), now()),
  ('position', 'position', 'position_Registered Nurse', '{"title": "Registered Nurse", "is_active": true, "display_order": 4}', 4, true, now(), now()),
  ('position', 'position', 'position_Activities Coordinator', '{"title": "Activities Coordinator", "is_active": true, "display_order": 5}', 5, true, now(), now()),
  ('position', 'position', 'position_Kitchen Assistant', '{"title": "Kitchen Assistant", "is_active": true, "display_order": 6}', 6, true, now(), now()),
  ('position', 'position', 'position_Domestic Assistant', '{"title": "Domestic Assistant", "is_active": true, "display_order": 7}', 7, true, now(), now()),
  ('position', 'position', 'position_Night Care Assistant', '{"title": "Night Care Assistant", "is_active": true, "display_order": 8}', 8, true, now(), now()),
  ('position', 'position', 'position_Team Leader', '{"title": "Team Leader", "is_active": true, "display_order": 9}', 9, true, now(), now()),
  ('position', 'position', 'position_Other', '{"title": "Other", "is_active": true, "display_order": 10}', 10, true, now(), now());