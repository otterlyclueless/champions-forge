-- Drop I.3 — Social Achievements
-- Run this in the Supabase SQL Editor (Champions Forge project)
-- Adds 7 new achievements: 4 likes-received milestones + 3 friends-count milestones
-- All use category='social' (already rendered in Profile achievements section)

INSERT INTO achievements (name, icon, description, check_type, threshold, category, sort_order)
VALUES
  -- Likes received milestones
  ('Fan Favourite',         '🌟', 'Receive your first like on a build or team',              'likes_received_count',  1,   'social', 90),
  ('Rising Star',           '⭐', 'Receive 25 likes across your builds and teams',           'likes_received_count',  25,  'social', 91),
  ('Community Star',        '💫', 'Receive 50 likes across your builds and teams',           'likes_received_count',  50,  'social', 92),
  ('Champion of Champions', '🌠', 'Receive 100 likes — a true community legend',             'likes_received_count',  100, 'social', 93),
  -- Friends count milestones
  ('Social Butterfly',      '🤝', 'Make your first friend in Champions Forge',               'friends_count',         1,   'social', 94),
  ('Elite Four',            '👑', 'Connect with 10 fellow trainers',                         'friends_count',         10,  'social', 95),
  ('Champion''s Circle',    '🏆', 'Surround yourself with 25 fellow trainers',               'friends_count',         25,  'social', 96)
ON CONFLICT (name) DO NOTHING;
-- Note: if your achievements table does not have a UNIQUE constraint on name,
-- remove the ON CONFLICT clause and run as a plain INSERT.
