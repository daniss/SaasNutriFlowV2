-- Populate professional starter templates for NutriFlow
-- Run this script to add essential meal plan templates for all nutritionists

-- Template 1: Mediterranean 7-Day Plan
INSERT INTO meal_plan_templates (
  id,
  dietitian_id,
  name,
  description,
  category,
  client_type,
  health_condition,
  goal_type,
  duration_days,
  target_calories,
  target_macros,
  meal_structure,
  tags,
  difficulty,
  rating,
  usage_count,
  is_favorite,
  is_public,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'SHARED',  -- This will need to be updated per nutritionist
  'Plan Méditerranéen 7 Jours',
  'Plan équilibré inspiré du régime méditerranéen, riche en légumes, poissons, huile d''olive et légumineuses. Idéal pour la santé cardiovasculaire.',
  'Santé générale',
  'Adulte',
  'Prévention cardiovasculaire',
  'Maintien santé',
  7,
  '1800-2000',
  '{"protein": 20, "carbs": 50, "fat": 30}',
  '{
    "day_1": {
      "breakfast": {"name": "Yaourt grec aux noix et miel", "calories": 320, "prep_time": "5 min"},
      "lunch": {"name": "Salade méditerranéenne au thon", "calories": 450, "prep_time": "10 min"},
      "dinner": {"name": "Saumon grillé aux légumes", "calories": 550, "prep_time": "20 min"},
      "snack": {"name": "Poignée d''amandes", "calories": 180, "prep_time": "0 min"}
    },
    "day_2": {
      "breakfast": {"name": "Toast avocat et tomate", "calories": 340, "prep_time": "8 min"},
      "lunch": {"name": "Taboulé aux légumes frais", "calories": 420, "prep_time": "15 min"},
      "dinner": {"name": "Dorade aux herbes de Provence", "calories": 520, "prep_time": "25 min"},
      "snack": {"name": "Fruits de saison", "calories": 120, "prep_time": "0 min"}
    },
    "daily_tips": ["Privilégier l''huile d''olive", "Consommer 2-3 portions de poisson par semaine", "5 portions de fruits et légumes par jour"]
  }',
  '["méditerranéen", "anti-inflammatoire", "coeur", "équilibré"]',
  'easy',
  4.8,
  0,
  false,
  true,
  NOW(),
  NOW()
);

-- Template 2: Diabetes-Friendly Plan
INSERT INTO meal_plan_templates (
  id,
  dietitian_id,
  name,
  description,
  category,
  client_type,
  health_condition,
  goal_type,
  duration_days,
  target_calories,
  target_macros,
  meal_structure,
  tags,
  difficulty,
  rating,
  usage_count,
  is_favorite,
  is_public,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'SHARED',
  'Plan Diabète Type 2',
  'Plan alimentaire spécialement conçu pour la gestion du diabète de type 2. Contrôle glycémique et portions adaptées.',
  'Médical',
  'Adulte',
  'Diabète type 2',
  'Contrôle glycémique',
  7,
  '1600-1800',
  '{"protein": 25, "carbs": 40, "fat": 35}',
  '{
    "day_1": {
      "breakfast": {"name": "Flocons d''avoine aux baies", "calories": 280, "prep_time": "8 min", "glycemic_index": "bas"},
      "lunch": {"name": "Salade de quinoa aux légumes", "calories": 400, "prep_time": "12 min", "glycemic_index": "bas"},
      "dinner": {"name": "Poulet aux brocolis vapeur", "calories": 480, "prep_time": "18 min", "glycemic_index": "bas"},
      "snack": {"name": "Yaourt nature aux noix", "calories": 150, "prep_time": "2 min"}
    },
    "day_2": {
      "breakfast": {"name": "Omelette aux épinards", "calories": 290, "prep_time": "10 min"},
      "lunch": {"name": "Lentilles aux légumes", "calories": 420, "prep_time": "15 min"},
      "dinner": {"name": "Poisson blanc aux courgettes", "calories": 460, "prep_time": "20 min"},
      "snack": {"name": "Pomme et amandes", "calories": 140, "prep_time": "0 min"}
    },
    "diabetes_notes": ["IG bas privilégié", "Portions contrôlées", "3 repas + 1 collation"]
  }',
  '["diabète", "IG bas", "contrôle glycémique", "médical"]',
  'medium',
  4.9,
  0,
  false,
  true,
  NOW(),
  NOW()
);

-- Template 3: Weight Management Plan
INSERT INTO meal_plan_templates (
  id,
  dietitian_id,
  name,
  description,
  category,
  client_type,
  health_condition,
  goal_type,
  duration_days,
  target_calories,
  target_macros,
  meal_structure,
  tags,
  difficulty,
  rating,
  usage_count,
  is_favorite,
  is_public,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'SHARED',
  'Gestion du Poids Équilibrée',
  'Plan hypocalorique équilibré pour une perte de poids progressive et durable. Privilégie la satiété et l''équilibre nutritionnel.',
  'Perte de poids',
  'Adulte',
  null,
  'Perte de poids',
  7,
  '1400-1600',
  '{"protein": 30, "carbs": 40, "fat": 30}',
  '{
    "day_1": {
      "breakfast": {"name": "Smoothie protéiné aux fruits", "calories": 250, "prep_time": "5 min", "protein": "25g"},
      "lunch": {"name": "Salade de poulet grillé", "calories": 380, "prep_time": "12 min", "protein": "35g"},
      "dinner": {"name": "Cabillaud aux légumes vapeur", "calories": 420, "prep_time": "15 min", "protein": "40g"},
      "snack": {"name": "Cottage cheese aux concombres", "calories": 120, "prep_time": "3 min"}
    },
    "day_2": {
      "breakfast": {"name": "Oeuf poché sur épinards", "calories": 260, "prep_time": "8 min"},
      "lunch": {"name": "Wrap de dinde aux légumes", "calories": 370, "prep_time": "10 min"},
      "dinner": {"name": "Crevettes sautées aux courgetti", "calories": 400, "prep_time": "12 min"},
      "snack": {"name": "Yaourt grec 0% aux baies", "calories": 110, "prep_time": "2 min"}
    },
    "weight_tips": ["Boire 2L d''eau/jour", "Privilégier les protéines à chaque repas", "Légumes à volonté"]
  }',
  '["perte de poids", "hypocalorique", "satiété", "protéines"]',
  'medium',
  4.7,
  0,
  false,
  true,
  NOW(),
  NOW()
);

-- Template 4: Heart-Healthy Plan
INSERT INTO meal_plan_templates (
  id,
  dietitian_id,
  name,
  description,
  category,
  client_type,
  health_condition,
  goal_type,
  duration_days,
  target_calories,
  target_macros,
  meal_structure,
  tags,
  difficulty,
  rating,
  usage_count,
  is_favorite,
  is_public,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'SHARED',
  'Santé Cardiovasculaire',
  'Plan spécialement conçu pour la santé du cœur. Riche en oméga-3, fibres et antioxydants. Faible en sodium et graisses saturées.',
  'Médical',
  'Adulte',
  'Hypertension',
  'Santé cardiovasculaire',
  7,
  '1800-2000',
  '{"protein": 22, "carbs": 48, "fat": 30}',
  '{
    "day_1": {
      "breakfast": {"name": "Porridge aux graines de chia", "calories": 300, "prep_time": "10 min", "fiber": "12g"},
      "lunch": {"name": "Salade de saumon aux noix", "calories": 450, "prep_time": "8 min", "omega3": "élevé"},
      "dinner": {"name": "Lentilles corail aux épices", "calories": 480, "prep_time": "20 min", "fiber": "15g"},
      "snack": {"name": "Baies mélangées aux amandes", "calories": 160, "prep_time": "2 min"}
    },
    "day_2": {
      "breakfast": {"name": "Toast avocat aux graines", "calories": 320, "prep_time": "6 min"},
      "lunch": {"name": "Quinoa aux légumes grillés", "calories": 430, "prep_time": "15 min"},
      "dinner": {"name": "Maquereau aux haricots verts", "calories": 470, "prep_time": "18 min"},
      "snack": {"name": "Thé vert et noix", "calories": 140, "prep_time": "0 min"}
    },
    "heart_benefits": ["Riche en oméga-3", "Faible en sodium", "Antioxydants naturels"]
  }',
  '["cardiovasculaire", "oméga-3", "anti-inflammatoire", "fibres"]',
  'easy',
  4.8,
  0,
  false,
  true,
  NOW(),
  NOW()
);

-- Template 5: Quick & Easy Meals
INSERT INTO meal_plan_templates (
  id,
  dietitian_id,
  name,
  description,
  category,
  client_type,
  health_condition,
  goal_type,
  duration_days,
  target_calories,
  target_macros,
  meal_structure,
  tags,
  difficulty,
  rating,
  usage_count,
  is_favorite,
  is_public,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'SHARED',
  'Repas Rapides & Équilibrés',
  'Plan parfait pour les personnes actives. Tous les repas se préparent en moins de 15 minutes tout en restant nutritionnellement équilibrés.',
  'Praticité',
  'Actif',
  null,
  'Gain de temps',
  7,
  '1900-2100',
  '{"protein": 25, "carbs": 45, "fat": 30}',
  '{
    "day_1": {
      "breakfast": {"name": "Smoothie bowl 5 minutes", "calories": 340, "prep_time": "5 min"},
      "lunch": {"name": "Wrap express au jambon", "calories": 480, "prep_time": "8 min"},
      "dinner": {"name": "Pâtes au saumon fumé", "calories": 520, "prep_time": "12 min"},
      "snack": {"name": "Mélange trail maison", "calories": 180, "prep_time": "0 min"}
    },
    "day_2": {
      "breakfast": {"name": "Yaourt granola express", "calories": 320, "prep_time": "3 min"},
      "lunch": {"name": "Salade de pois chiches", "calories": 460, "prep_time": "10 min"},
      "dinner": {"name": "Omelette aux légumes surgelés", "calories": 500, "prep_time": "8 min"},
      "snack": {"name": "Fruits et fromage blanc", "calories": 160, "prep_time": "2 min"}
    },
    "time_saving_tips": ["Utiliser des légumes surgelés", "Préparer en batch", "Toujours moins de 15 min"]
  }',
  '["rapide", "pratique", "15 minutes", "actif"]',
  'easy',
  4.6,
  0,
  false,
  true,
  NOW(),
  NOW()
);

-- Note: After running this script, update the dietitian_id values to match actual nutritionist IDs
-- or create a mechanism to copy these templates for each nutritionist signup