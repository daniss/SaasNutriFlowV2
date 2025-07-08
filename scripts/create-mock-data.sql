-- Mock Data for NutriFlow - User: daniscin@gmail.com
-- This script creates 5 clients and 5 meal plans for testing

-- First, let's get the user ID for daniscin@gmail.com
-- Note: This assumes the user already exists in auth.users and profiles

-- Insert 5 mock clients
INSERT INTO public.clients (
  id,
  dietitian_id,
  name,
  email,
  phone,
  address,
  age,
  height,
  current_weight,
  goal_weight,
  goal,
  plan_type,
  status,
  tags,
  notes,
  emergency_contact,
  join_date,
  last_session,
  next_appointment,
  progress_percentage,
  created_at,
  updated_at
) VALUES
-- Client 1: Marie Dubois
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Marie Dubois',
  'marie.dubois@email.com',
  '+33 6 12 34 56 78',
  '15 Rue de la Paix, 75001 Paris',
  38,
  '1.65m',
  68.5,
  60.0,
  'Perte de poids progressive et maintien d''une alimentation équilibrée',
  'Weight Loss',
  'Active',
  '{"vegetarian", "hypothyroidism"}',
  'Cliente très motivée, suit bien les recommandations. Allergies: Noix, crustacés. Végétarienne.',
  'Paul Dubois - 06 87 65 43 21',
  CURRENT_DATE - INTERVAL '2 weeks',
  NOW() - INTERVAL '1 week',
  NOW() + INTERVAL '3 days',
  25,
  NOW(),
  NOW()
),
-- Client 2: Pierre Martin
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Pierre Martin',
  'pierre.martin@email.com',
  '+33 6 23 45 67 89',
  '42 Avenue du Sport, 69000 Lyon',
  45,
  '1.80m',
  85.2,
  90.0,
  'Prise de masse musculaire et optimisation des performances sportives',
  'Muscle Gain',
  'Active',
  '{"athlete", "high_protein"}',
  'Sportif de haut niveau, entraînement 6x/semaine. Allergies: Lactose.',
  'Sophie Martin - 06 98 76 54 32',
  CURRENT_DATE - INTERVAL '1 month',
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '1 week',
  60,
  NOW(),
  NOW()
),
-- Client 3: Sophie Leroy
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Sophie Leroy',
  'sophie.leroy@email.com',
  '+33 6 34 56 78 90',
  '8 Rue Tranquille, 33000 Bordeaux',
  31,
  '1.58m',
  52.0,
  55.0,
  'Améliorer la digestion et augmenter l''énergie',
  'Medical',
  'Active',
  '{"ibs", "gluten_free", "low_fodmap"}',
  'Travaille en bureau, stress élevé. Syndrome intestin irritable. Allergies: Gluten, œufs.',
  'Marc Leroy - 06 45 32 18 97',
  CURRENT_DATE - INTERVAL '3 weeks',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '2 weeks',
  40,
  NOW(),
  NOW()
),
-- Client 4: Jean Rousseau
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Jean Rousseau',
  'jean.rousseau@email.com',
  '+33 6 45 67 89 01',
  '23 Boulevard Senior, 13000 Marseille',
  58,
  '1.75m',
  92.8,
  80.0,
  'Contrôle du diabète et perte de poids',
  'Medical',
  'Active',
  '{"diabetes", "hypertension", "low_sodium"}',
  'Retraité, mode de vie sédentaire à changer. Diabète type 2, hypertension.',
  'Claire Rousseau - 06 23 45 67 89',
  CURRENT_DATE - INTERVAL '1 month',
  NOW() - INTERVAL '1 week',
  NOW() + INTERVAL '2 weeks',
  15,
  NOW(),
  NOW()
),
-- Client 5: Camille Moreau
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Camille Moreau',
  'camille.moreau@email.com',
  '+33 6 56 78 90 12',
  '56 Rue Famille, 59000 Lille',
  33,
  '1.70m',
  58.3,
  62.0,
  'Préparation grossesse et nutrition optimale',
  'Pregnancy Prep',
  'Active',
  '{"pregnancy_prep", "pescatarian", "iron_deficiency"}',
  'Jeune couple, souhaite concevoir dans 6 mois. Anémie ferriprive. Pescétarienne.',
  'Thomas Moreau - 06 78 90 12 34',
  CURRENT_DATE - INTERVAL '2 weeks',
  NOW() - INTERVAL '4 days',
  NOW() + INTERVAL '1 week',
  30,
  NOW(),
  NOW()
);

-- Insert 5 mock meal plans
INSERT INTO public.meal_plans (
  id,
  client_id,
  dietitian_id,
  name,
  description,
  plan_content,
  calories_range,
  duration_days,
  status,
  created_at,
  updated_at
) VALUES
-- Meal Plan 1: Plan Végétarien Équilibré pour Marie
(
  gen_random_uuid(),
  (SELECT id FROM public.clients WHERE email = 'marie.dubois@email.com' LIMIT 1),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Plan Végétarien Équilibré - Perte de Poids',
  'Plan alimentaire végétarien de 4 semaines conçu pour une perte de poids progressive tout en maintenant un équilibre nutritionnel optimal.',
  '{
    "week1": {
      "monday": {
        "breakfast": {"name": "Porridge à l''avoine et fruits rouges", "calories": 320, "protein": 12, "carbs": 58, "fat": 8},
        "lunch": {"name": "Salade de quinoa aux légumes grillés", "calories": 480, "protein": 18, "carbs": 65, "fat": 16},
        "dinner": {"name": "Curry de lentilles aux épinards", "calories": 420, "protein": 22, "carbs": 52, "fat": 12},
        "snacks": [{"name": "Yaourt grec aux amandes", "calories": 180, "protein": 15, "carbs": 12, "fat": 8}]
      }
    },
    "shopping_list": ["Avoine complète", "Fruits rouges surgelés", "Quinoa", "Courgettes", "Aubergines", "Lentilles corail", "Épinards frais", "Yaourt grec", "Amandes"],
    "nutritional_summary": {"daily_avg": {"calories": 1400, "protein": 67, "carbs": 187, "fat": 44, "fiber": 32}}
  }',
  '1400-1600',
  28,
  'Active',
  NOW(),
  NOW()
),
-- Meal Plan 2: Plan Sportif High-Protein pour Pierre
(
  gen_random_uuid(),
  (SELECT id FROM public.clients WHERE email = 'pierre.martin@email.com' LIMIT 1),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Plan Sportif High-Protein - Prise de Masse',
  'Programme nutritionnel intensif de 6 semaines pour optimiser la prise de masse musculaire et les performances sportives.',
  '{
    "week1": {
      "monday": {
        "breakfast": {"name": "Smoothie protéiné banane-avoine", "calories": 520, "protein": 35, "carbs": 68, "fat": 14},
        "lunch": {"name": "Riz complet au poulet et brocolis", "calories": 680, "protein": 45, "carbs": 78, "fat": 18},
        "dinner": {"name": "Saumon grillé aux patates douces", "calories": 620, "protein": 42, "carbs": 55, "fat": 22},
        "snacks": [
          {"name": "Shaker protéines post-training", "calories": 280, "protein": 30, "carbs": 25, "fat": 3},
          {"name": "Noix et fruits secs", "calories": 320, "protein": 8, "carbs": 28, "fat": 20}
        ]
      }
    },
    "shopping_list": ["Bananes", "Avoine", "Protéine whey", "Riz complet", "Blanc de poulet", "Brocolis", "Saumon", "Patates douces", "Noix mélangées", "Fruits secs"],
    "nutritional_summary": {"daily_avg": {"calories": 2750, "protein": 168, "carbs": 285, "fat": 98, "fiber": 38}}
  }',
  '2700-2900',
  42,
  'Active',
  NOW(),
  NOW()
),
-- Meal Plan 3: Plan Sans Gluten Anti-Inflammatoire pour Sophie
(
  gen_random_uuid(),
  (SELECT id FROM public.clients WHERE email = 'sophie.leroy@email.com' LIMIT 1),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Plan Sans Gluten Anti-Inflammatoire',
  'Programme de 3 semaines sans gluten et pauvre en FODMAP pour améliorer la digestion et réduire l''inflammation.',
  '{
    "week1": {
      "monday": {
        "breakfast": {"name": "Smoothie bowl sans gluten", "calories": 280, "protein": 8, "carbs": 45, "fat": 12},
        "lunch": {"name": "Salade de riz sauvage au thon", "calories": 420, "protein": 28, "carbs": 48, "fat": 14},
        "dinner": {"name": "Poisson blanc aux légumes vapeur", "calories": 380, "protein": 32, "carbs": 35, "fat": 12},
        "snacks": [{"name": "Compote maison et graines", "calories": 150, "protein": 4, "carbs": 28, "fat": 6}]
      }
    },
    "shopping_list": ["Riz sauvage", "Thon en conserve", "Cabillaud", "Courgettes", "Carottes", "Graines de tournesol", "Pommes", "Myrtilles", "Huile d''olive"],
    "nutritional_summary": {"daily_avg": {"calories": 1580, "protein": 78, "carbs": 168, "fat": 48, "fiber": 28}}
  }',
  '1500-1700',
  21,
  'Active',
  NOW(),
  NOW()
),
-- Meal Plan 4: Plan Diabétique Faible Sodium pour Jean
(
  gen_random_uuid(),
  (SELECT id FROM public.clients WHERE email = 'jean.rousseau@email.com' LIMIT 1),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Plan Diabétique Faible en Sodium',
  'Programme de 8 semaines spécialement adapté pour le contrôle du diabète type 2 et la réduction de l''hypertension.',
  '{
    "week1": {
      "monday": {
        "breakfast": {"name": "Flocons d''avoine aux noix", "calories": 320, "protein": 14, "carbs": 45, "fat": 12},
        "lunch": {"name": "Escalope de dinde aux haricots verts", "calories": 450, "protein": 38, "carbs": 32, "fat": 18},
        "dinner": {"name": "Soupe de légumes et pain complet", "calories": 380, "protein": 16, "carbs": 58, "fat": 10},
        "snacks": [{"name": "Pomme et fromage blanc", "calories": 140, "protein": 8, "carbs": 22, "fat": 2}]
      }
    },
    "shopping_list": ["Avoine", "Noix", "Escalope de dinde", "Haricots verts", "Légumes variés", "Pain complet", "Pommes", "Fromage blanc 0%"],
    "nutritional_summary": {"daily_avg": {"calories": 1780, "protein": 88, "carbs": 178, "fat": 52, "fiber": 35, "sodium": 1200}}
  }',
  '1700-1900',
  56,
  'Active',
  NOW(),
  NOW()
),
-- Meal Plan 5: Plan Préconception Pescétarien pour Camille
(
  gen_random_uuid(),
  (SELECT id FROM public.clients WHERE email = 'camille.moreau@email.com' LIMIT 1),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'Plan Préconception Pescétarien',
  'Programme nutritionnel de 12 semaines optimisé pour la préparation à la grossesse avec focus sur les nutriments essentiels.',
  '{
    "week1": {
      "monday": {
        "breakfast": {"name": "Toast avocat et œuf poché", "calories": 380, "protein": 18, "carbs": 32, "fat": 22},
        "lunch": {"name": "Salade de saumon aux épinards", "calories": 520, "protein": 35, "carbs": 25, "fat": 32},
        "dinner": {"name": "Pâtes complètes aux crevettes", "calories": 480, "protein": 28, "carbs": 65, "fat": 14},
        "snacks": [
          {"name": "Smoothie épinards-banane", "calories": 220, "protein": 8, "carbs": 42, "fat": 4},
          {"name": "Yaourt aux graines de chia", "calories": 180, "protein": 12, "carbs": 18, "fat": 8}
        ]
      }
    },
    "shopping_list": ["Avocats", "Œufs bio", "Saumon frais", "Épinards", "Pâtes complètes", "Crevettes", "Bananes", "Graines de chia", "Yaourt nature"],
    "nutritional_summary": {"daily_avg": {"calories": 1980, "protein": 112, "carbs": 198, "fat": 88, "fiber": 32, "folates": 420, "fer": 18}}
  }',
  '1900-2100',
  84,
  'Active',
  NOW(),
  NOW()
);

-- Update clients with their meal plan references (optional, for easier querying)
UPDATE public.clients 
SET notes = CONCAT(notes, ' - Plan assigné: ', (
  SELECT name FROM public.meal_plans 
  WHERE client_id = clients.id 
  LIMIT 1
))
WHERE dietitian_id = (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com');

-- Create some sample appointments for the clients
INSERT INTO public.appointments (
  id,
  dietitian_id,
  client_id,
  title,
  description,
  appointment_date,
  appointment_time,
  duration_minutes,
  type,
  status,
  notes,
  created_at,
  updated_at
) VALUES
-- Rendez-vous avec Marie
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  (SELECT id FROM public.clients WHERE email = 'marie.dubois@email.com' LIMIT 1),
  'Consultation de suivi - Marie Dubois',
  'Suivi du plan végétarien et ajustements si nécessaires',
  CURRENT_DATE + INTERVAL '3 days',
  '14:00:00',
  60,
  'follow_up',
  'scheduled',
  'Vérifier la perte de poids et l''adaptation au régime végétarien',
  NOW(),
  NOW()
),
-- Rendez-vous avec Pierre
(
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  (SELECT id FROM public.clients WHERE email = 'pierre.martin@email.com' LIMIT 1),
  'Consultation sportive - Pierre Martin',
  'Optimisation du plan pour la prise de masse',
  CURRENT_DATE + INTERVAL '1 week',
  '10:00:00',
  90,
  'consultation',
  'scheduled',
  'Analyser les performances et ajuster les macros',
  NOW(),
  NOW()
);

-- Insert sample reminders
INSERT INTO public.reminders (
  id,
  client_id,
  dietitian_id,
  type,
  title,
  message,
  scheduled_date,
  is_recurring,
  frequency,
  channels,
  status,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM public.clients WHERE email = 'sophie.leroy@email.com' LIMIT 1),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'follow_up',
  'Rappel suivi intestin irritable',
  'Vérifier les symptômes et l''efficacité du régime sans gluten',
  NOW() + INTERVAL '2 weeks',
  false,
  null,
  '{"email"}',
  'Scheduled',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM public.clients WHERE email = 'jean.rousseau@email.com' LIMIT 1),
  (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com'),
  'medical_check',
  'Contrôle glycémie',
  'Demander les résultats de la dernière prise de sang',
  NOW() + INTERVAL '1 month',
  false,
  null,
  '{"email"}',
  'Scheduled',
  NOW(),
  NOW()
);

-- Verify the data was inserted correctly
SELECT 
  'Clients créés:' as type,
  COUNT(*) as count
FROM public.clients 
WHERE dietitian_id = (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com')

UNION ALL

SELECT 
  'Plans alimentaires créés:' as type,
  COUNT(*) as count
FROM public.meal_plans 
WHERE dietitian_id = (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com')

UNION ALL

SELECT 
  'Rendez-vous créés:' as type,
  COUNT(*) as count
FROM public.appointments 
WHERE dietitian_id = (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com')

UNION ALL

SELECT 
  'Rappels créés:' as type,
  COUNT(*) as count
FROM public.reminders 
WHERE dietitian_id = (SELECT id FROM profiles WHERE email = 'daniscin@gmail.com');
