-- Sample seed data for recipe_templates and meal_plan_templates
-- Run this after creating the tables

-- Insert sample recipe templates
INSERT INTO recipe_templates (
  dietitian_id, name, description, category, dietary_type, preparation_time, cooking_time, 
  servings, calories_per_serving, macros, ingredients, instructions, tags, difficulty, source
) VALUES 
-- Breakfast recipes
(
  auth.uid(), 
  'Avocado Toast avec Œuf Poché', 
  'Toast croustillant avec avocat crémeux et œuf poché parfait',
  'breakfast',
  ARRAY['vegetarian']::TEXT[],
  10,
  5,
  1,
  350,
  '{"protein": 15, "carbs": 28, "fat": 22, "fiber": 8}'::JSONB,
  '[
    {"name": "Pain complet", "quantity": 2, "unit": "tranches"},
    {"name": "Avocat", "quantity": 1, "unit": "pièce"},
    {"name": "Œuf", "quantity": 1, "unit": "pièce"},
    {"name": "Citron", "quantity": 0.5, "unit": "pièce"},
    {"name": "Sel", "quantity": 1, "unit": "pincée"},
    {"name": "Poivre", "quantity": 1, "unit": "pincée"}
  ]'::JSONB,
  '[
    "Faire griller le pain complet",
    "Écraser l\'avocat avec le jus de citron, sel et poivre",
    "Porter l\'eau à ébullition pour l\'œuf poché",
    "Cuire l\'œuf poché pendant 3-4 minutes",
    "Étaler l\'avocat sur le pain grillé",
    "Déposer l\'œuf poché sur l\'avocat",
    "Assaisonner et servir immédiatement"
  ]'::JSONB,
  ARRAY['petit-déjeuner', 'rapide', 'nutritif']::TEXT[],
  'easy',
  'custom'
),

-- Lunch recipes
(
  auth.uid(),
  'Salade Quinoa Méditerranéenne',
  'Salade fraîche et colorée avec quinoa, légumes et feta',
  'lunch',
  ARRAY['vegetarian', 'gluten_free']::TEXT[],
  15,
  15,
  2,
  420,
  '{"protein": 18, "carbs": 45, "fat": 16, "fiber": 6}'::JSONB,
  '[
    {"name": "Quinoa", "quantity": 100, "unit": "g"},
    {"name": "Tomates cerises", "quantity": 150, "unit": "g"},
    {"name": "Concombre", "quantity": 1, "unit": "pièce"},
    {"name": "Feta", "quantity": 80, "unit": "g"},
    {"name": "Olives noires", "quantity": 50, "unit": "g"},
    {"name": "Huile d\'olive", "quantity": 2, "unit": "cuillères à soupe"},
    {"name": "Citron", "quantity": 1, "unit": "pièce"},
    {"name": "Basilic frais", "quantity": 10, "unit": "feuilles"}
  ]'::JSONB,
  '[
    "Rincer et cuire le quinoa selon les instructions",
    "Couper les tomates cerises en deux",
    "Découper le concombre en dés",
    "Émietter la feta",
    "Préparer la vinaigrette avec huile, citron et basilic",
    "Mélanger tous les ingrédients",
    "Laisser reposer 10 minutes avant de servir"
  ]'::JSONB,
  ARRAY['déjeuner', 'méditerranéen', 'sans-gluten']::TEXT[],
  'easy',
  'custom'
),

-- Dinner recipes
(
  auth.uid(),
  'Saumon Grillé aux Légumes',
  'Saumon grillé avec légumes de saison et herbes fraîches',
  'dinner',
  ARRAY['dairy_free', 'low_carb']::TEXT[],
  20,
  25,
  2,
  380,
  '{"protein": 35, "carbs": 12, "fat": 22, "fiber": 4}'::JSONB,
  '[
    {"name": "Filet de saumon", "quantity": 300, "unit": "g"},
    {"name": "Courgettes", "quantity": 2, "unit": "pièces"},
    {"name": "Poivrons", "quantity": 2, "unit": "pièces"},
    {"name": "Brocolis", "quantity": 200, "unit": "g"},
    {"name": "Huile d\'olive", "quantity": 3, "unit": "cuillères à soupe"},
    {"name": "Thym", "quantity": 1, "unit": "cuillère à café"},
    {"name": "Ail", "quantity": 2, "unit": "gousses"}
  ]'::JSONB,
  '[
    "Préchauffer le four à 200°C",
    "Couper les légumes en morceaux",
    "Mélanger les légumes avec huile, ail et thym",
    "Enfourner les légumes pendant 15 minutes",
    "Griller le saumon 4-5 minutes de chaque côté",
    "Servir le saumon avec les légumes grillés"
  ]'::JSONB,
  ARRAY['dîner', 'poisson', 'légumes', 'faible-glucides']::TEXT[],
  'medium',
  'custom'
);

-- Insert sample meal plan templates
INSERT INTO meal_plan_templates (
  dietitian_id, name, description, type, duration_days, target_calories, target_macros, meal_structure, dietary_restrictions, tags
) VALUES 
(
  auth.uid(),
  'Plan Équilibré 7 Jours',
  'Plan alimentaire équilibré pour une semaine complète',
  'weekly',
  7,
  1800,
  '{"protein": 25, "carbs": 45, "fat": 30}'::JSONB,
  '{
    "breakfast": {"calories": 400, "suggestions": ["Avocado Toast avec Œuf Poché", "Smoothie Bowl", "Overnight Oats"]},
    "lunch": {"calories": 500, "suggestions": ["Salade Quinoa Méditerranéenne", "Bowl Buddha", "Wrap Légumes"]},
    "dinner": {"calories": 600, "suggestions": ["Saumon Grillé aux Légumes", "Poulet aux Légumes", "Curry de Lentilles"]},
    "snacks": {"calories": 300, "suggestions": ["Fruits et Noix", "Yaourt Grec", "Légumes et Houmous"]}
  }'::JSONB,
  ARRAY[]::TEXT[],
  ARRAY['équilibré', 'hebdomadaire', 'varié']::TEXT[]
),

(
  auth.uid(),
  'Plan Perte de Poids',
  'Plan hypocalorique pour la perte de poids progressive',
  'weight_loss',
  14,
  1500,
  '{"protein": 30, "carbs": 35, "fat": 35}'::JSONB,
  '{
    "breakfast": {"calories": 300, "suggestions": ["Smoothie Protéiné", "Œufs Brouillés", "Yaourt Grec"]},
    "lunch": {"calories": 400, "suggestions": ["Salade de Légumes", "Soupe de Légumes", "Wrap Léger"]},
    "dinner": {"calories": 500, "suggestions": ["Poisson Grillé", "Légumes Vapeur", "Salade Composée"]},
    "snacks": {"calories": 300, "suggestions": ["Fruits", "Légumes Crus", "Thé Vert"]}
  }'::JSONB,
  ARRAY['low_calorie']::TEXT[],
  ARRAY['perte-de-poids', 'hypocalorique', 'progressif']::TEXT[]
),

(
  auth.uid(),
  'Plan Végétarien',
  'Plan alimentaire végétarien complet et équilibré',
  'maintenance',
  7,
  1900,
  '{"protein": 20, "carbs": 50, "fat": 30}'::JSONB,
  '{
    "breakfast": {"calories": 400, "suggestions": ["Overnight Oats", "Smoothie Bowl", "Toast Avocat"]},
    "lunch": {"calories": 550, "suggestions": ["Bowl Quinoa", "Salade Légumineuses", "Wrap Végétarien"]},
    "dinner": {"calories": 600, "suggestions": ["Curry Lentilles", "Risotto Légumes", "Pasta Primavera"]},
    "snacks": {"calories": 350, "suggestions": ["Noix et Fruits", "Houmous", "Yaourt Végétal"]}
  }'::JSONB,
  ARRAY['vegetarian']::TEXT[],
  ARRAY['végétarien', 'équilibré', 'varié']::TEXT[]
);
