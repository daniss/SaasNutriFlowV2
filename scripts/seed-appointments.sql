-- Sample seed data for appointments
-- Run this after fixing the appointments table structure
-- Make sure you have clients in your database first

-- Insert sample appointments
-- Note: Replace the client_id values with actual client IDs from your database
-- You can find client IDs with: SELECT id, name FROM clients WHERE dietitian_id = auth.uid();

INSERT INTO appointments (
  dietitian_id, client_id, title, description, appointment_date, appointment_time, 
  duration_minutes, type, status, location, is_virtual, meeting_link, notes
) VALUES 
-- Today's appointments
(
  auth.uid(), 
  (SELECT id FROM clients WHERE dietitian_id = auth.uid() LIMIT 1), 
  'Consultation initiale',
  'Première consultation avec évaluation nutritionnelle complète',
  CURRENT_DATE,
  '09:00:00',
  90,
  'consultation',
  'scheduled',
  'Cabinet de consultation',
  false,
  null,
  'Apporter les dernières analyses sanguines'
),

(
  auth.uid(), 
  (SELECT id FROM clients WHERE dietitian_id = auth.uid() LIMIT 1 OFFSET 1), 
  'Suivi mensuel',
  'Suivi de l\'évolution du plan alimentaire',
  CURRENT_DATE,
  '14:00:00',
  60,
  'follow_up',
  'scheduled',
  null,
  true,
  'https://meet.google.com/abc-defg-hij',
  'Préparer le bilan des 4 dernières semaines'
),

-- Tomorrow's appointments
(
  auth.uid(), 
  (SELECT id FROM clients WHERE dietitian_id = auth.uid() LIMIT 1), 
  'Planification nutritionnelle',
  'Élaboration d\'un nouveau plan alimentaire personnalisé',
  CURRENT_DATE + INTERVAL '1 day',
  '10:30:00',
  75,
  'nutrition_planning',
  'scheduled',
  'Cabinet de consultation',
  false,
  null,
  'Revoir les objectifs à court terme'
),

-- Next week's appointments
(
  auth.uid(), 
  (SELECT id FROM clients WHERE dietitian_id = auth.uid() LIMIT 1 OFFSET 1), 
  'Évaluation des progrès',
  'Évaluation complète des progrès réalisés',
  CURRENT_DATE + INTERVAL '7 days',
  '11:00:00',
  60,
  'assessment',
  'scheduled',
  null,
  true,
  'https://zoom.us/j/123456789',
  'Préparer les photos de progression'
),

-- Past appointment (completed)
(
  auth.uid(), 
  (SELECT id FROM clients WHERE dietitian_id = auth.uid() LIMIT 1), 
  'Consultation de suivi',
  'Suivi hebdomadaire des habitudes alimentaires',
  CURRENT_DATE - INTERVAL '3 days',
  '15:00:00',
  45,
  'follow_up',
  'completed',
  'Cabinet de consultation',
  false,
  null,
  'Très bonne évolution, continuer sur cette voie'
)

-- Only insert if we have clients
ON CONFLICT DO NOTHING;
