INSERT INTO users (id, name, email, password_hash, role)
VALUES (
  'usr_seed_admin',
  'Platform Admin',
  'admin@networklab.local',
  '$2b$12$vJj/ctej3ukv/lQx5HWz9.6Whi5/r7MaqV8A4iAHM8vQjxlf2a5G6',
  'Admin'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO activities (id, type, message, actor)
VALUES
  ('act_seed_1', 'system', 'Seeded NetworkLab baseline data', 'system'),
  ('act_seed_2', 'auth', 'Admin bootstrap account available', 'system')
ON CONFLICT (id) DO NOTHING;
