-- Enhance meal plan templates to support recipe references
-- This script adds recipe integration capabilities to meal plan templates

-- First, let's add some sample recipes that can be referenced in templates
INSERT INTO recipes (
  id,
  dietitian_id,
  name,
  description,
  category,
  prep_time,
  cook_time,
  servings,
  difficulty,
  calories_per_serving,
  protein_per_serving,
  carbs_per_serving,
  fat_per_serving,
  fiber_per_serving,
  instructions,
  tags,
  is_favorite,
  usage_count,
  created_at,
  updated_at
) VALUES 
-- Mediterranean breakfast recipes
(
  gen_random_uuid(),
  'PLACEHOLDER_DIETITIAN_ID', -- Replace with actual dietitian ID
  'Yaourt grec aux noix et miel',
  'Petit-déjeuner riche en protéines et oméga-3, parfait pour commencer la journée.',
  'breakfast',
  5,
  0,
  1,
  'easy',
  320,
  20,
  25,
  15,
  5,
  ARRAY[
    'Verser 150g de yaourt grec nature dans un bol',
    'Ajouter 1 cuillère à soupe de miel',
    'Parsemer de 30g de noix concassées',
    'Ajouter quelques baies fraîches si désiré',
    'Servir immédiatement'
  ],
  ARRAY['méditerranéen', 'protéines', 'petit-déjeuner', 'rapide'],
  false,
  0,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'PLACEHOLDER_DIETITIAN_ID',
  'Toast avocat et tomate',
  'Toast nutritif et savoureux, source de bonnes graisses et de fibres.',
  'breakfast',
  8,
  2,
  1,
  'easy',
  340,
  12,
  30,
  22,
  8,
  ARRAY[
    'Griller 2 tranches de pain complet',
    'Écraser 1/2 avocat avec une fourchette',
    'Étaler l''avocat sur les tranches grillées',
    'Ajouter des rondelles de tomate',
    'Assaisonner avec sel, poivre et un filet d''huile d''olive',
    'Servir immédiatement'
  ],
  ARRAY['avocat', 'toast', 'végétarien', 'fibres'],
  false,
  0,
  NOW(),
  NOW()
),

-- Lunch recipes
(
  gen_random_uuid(),
  'PLACEHOLDER_DIETITIAN_ID',
  'Salade méditerranéenne au thon',
  'Salade complète et équilibrée, riche en oméga-3 et légumes frais.',
  'lunch',
  10,
  0,
  2,
  'easy',
  450,
  35,
  15,
  28,
  8,
  ARRAY[
    'Laver et couper les légumes : tomates, concombre, poivrons',
    'Préparer la base de salade verte',
    'Ajouter le thon égoutté',
    'Incorporer les olives noires et la feta',
    'Préparer la vinaigrette : huile d''olive, vinaigre, herbes de Provence',
    'Mélanger et servir frais'
  ],
  ARRAY['méditerranéen', 'thon', 'salade', 'oméga-3'],
  false,
  0,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'PLACEHOLDER_DIETITIAN_ID',
  'Taboulé aux légumes frais',
  'Taboulé traditionnel revisité avec des légumes de saison.',
  'lunch',
  15,
  0,
  4,
  'medium',
  420,
  12,
  55,
  18,
  12,
  ARRAY[
    'Faire tremper 200g de boulgour dans l''eau chaude 15 min',
    'Ciseler finement le persil et la menthe',
    'Couper en dés les tomates, concombre et oignon',
    'Égoutter le boulgour et le mélanger aux légumes',
    'Assaisonner avec citron, huile d''olive, sel et poivre',
    'Laisser reposer 30 min au frais avant de servir'
  ],
  ARRAY['taboulé', 'végétarien', 'frais', 'libanais'],
  false,
  0,
  NOW(),
  NOW()
),

-- Dinner recipes
(
  gen_random_uuid(),
  'PLACEHOLDER_DIETITIAN_ID',
  'Saumon grillé aux légumes',
  'Plat complet riche en oméga-3 et légumes de saison.',
  'dinner',
  10,
  20,
  2,
  'medium',
  550,
  45,
  12,
  35,
  6,
  ARRAY[
    'Préchauffer le four à 200°C',
    'Assaisonner les pavés de saumon avec herbes et citron',
    'Préparer les légumes : courgettes, brocolis, poivrons',
    'Cuire le saumon à la poêle 3-4 min de chaque côté',
    'Cuire les légumes à la vapeur 10-12 min',
    'Servir avec un filet d''huile d''olive et du citron'
  ],
  ARRAY['saumon', 'oméga-3', 'légumes', 'équilibré'],
  false,
  0,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'PLACEHOLDER_DIETITIAN_ID',
  'Dorade aux herbes de Provence',
  'Poisson grillé parfumé aux herbes méditerranéennes.',
  'dinner',
  15,
  25,
  2,
  'medium',
  520,
  48,
  8,
  28,
  4,
  ARRAY[
    'Nettoyer et vider la dorade',
    'Farcir l''intérieur avec citron et herbes de Provence',
    'Badigeonner d''huile d''olive et assaisonner',
    'Cuire au four à 180°C pendant 25 min',
    'Arroser régulièrement pendant la cuisson',
    'Servir avec des légumes grillés'
  ],
  ARRAY['dorade', 'herbes', 'méditerranéen', 'grillé'],
  false,
  0,
  NOW(),
  NOW()
);

-- Add corresponding ingredients for these recipes
-- Note: This would typically be done through the recipe creation interface
-- Here we're adding just a few key ingredients as examples

DO $$
DECLARE
    recipe_id_yaourt UUID;
    recipe_id_toast UUID;
    recipe_id_salade UUID;
    recipe_id_taboule UUID;
    recipe_id_saumon UUID;
    recipe_id_dorade UUID;
BEGIN
    -- Get recipe IDs (in practice, these would be known when creating)
    SELECT id INTO recipe_id_yaourt FROM recipes WHERE name = 'Yaourt grec aux noix et miel' AND dietitian_id = 'PLACEHOLDER_DIETITIAN_ID';
    SELECT id INTO recipe_id_toast FROM recipes WHERE name = 'Toast avocat et tomate' AND dietitian_id = 'PLACEHOLDER_DIETITIAN_ID';
    SELECT id INTO recipe_id_salade FROM recipes WHERE name = 'Salade méditerranéenne au thon' AND dietitian_id = 'PLACEHOLDER_DIETITIAN_ID';
    SELECT id INTO recipe_id_taboule FROM recipes WHERE name = 'Taboulé aux légumes frais' AND dietitian_id = 'PLACEHOLDER_DIETITIAN_ID';
    SELECT id INTO recipe_id_saumon FROM recipes WHERE name = 'Saumon grillé aux légumes' AND dietitian_id = 'PLACEHOLDER_DIETITIAN_ID';
    SELECT id INTO recipe_id_dorade FROM recipes WHERE name = 'Dorade aux herbes de Provence' AND dietitian_id = 'PLACEHOLDER_DIETITIAN_ID';

    -- Add ingredients for yaourt grec
    IF recipe_id_yaourt IS NOT NULL THEN
        INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, order_index) VALUES
        (recipe_id_yaourt, 'Yaourt grec nature', 150, 'g', 1),
        (recipe_id_yaourt, 'Miel', 1, 'cuillère à soupe', 2),
        (recipe_id_yaourt, 'Noix', 30, 'g', 3),
        (recipe_id_yaourt, 'Baies fraîches', 50, 'g', 4);
    END IF;

    -- Add ingredients for toast avocat
    IF recipe_id_toast IS NOT NULL THEN
        INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, order_index) VALUES
        (recipe_id_toast, 'Pain complet', 2, 'tranche', 1),
        (recipe_id_toast, 'Avocat', 0.5, 'pièce', 2),
        (recipe_id_toast, 'Tomate', 1, 'pièce', 3),
        (recipe_id_toast, 'Huile d''olive', 1, 'cuillère à café', 4);
    END IF;

    -- Add ingredients for salade méditerranéenne
    IF recipe_id_salade IS NOT NULL THEN
        INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, order_index) VALUES
        (recipe_id_salade, 'Salade verte', 100, 'g', 1),
        (recipe_id_salade, 'Thon au naturel', 120, 'g', 2),
        (recipe_id_salade, 'Tomates cerises', 150, 'g', 3),
        (recipe_id_salade, 'Concombre', 1, 'pièce', 4),
        (recipe_id_salade, 'Olives noires', 50, 'g', 5),
        (recipe_id_salade, 'Feta', 80, 'g', 6),
        (recipe_id_salade, 'Huile d''olive', 2, 'cuillère à soupe', 7);
    END IF;

END $$;

-- Enhanced template structure example that can reference recipes
-- This shows how templates can now include recipe_id references
UPDATE meal_plan_templates 
SET meal_structure = '{
  "day_1": {
    "breakfast": {"recipe_id": null, "name": "Yaourt grec aux noix et miel", "calories": 320, "prep_time": "5 min"},
    "lunch": {"recipe_id": null, "name": "Salade méditerranéenne au thon", "calories": 450, "prep_time": "10 min"},
    "dinner": {"recipe_id": null, "name": "Saumon grillé aux légumes", "calories": 550, "prep_time": "20 min"},
    "snack": {"name": "Poignée d''amandes", "calories": 180, "prep_time": "0 min"}
  },
  "day_2": {
    "breakfast": {"recipe_id": null, "name": "Toast avocat et tomate", "calories": 340, "prep_time": "8 min"},
    "lunch": {"recipe_id": null, "name": "Taboulé aux légumes frais", "calories": 420, "prep_time": "15 min"},
    "dinner": {"recipe_id": null, "name": "Dorade aux herbes de Provence", "calories": 520, "prep_time": "25 min"},
    "snack": {"name": "Fruits de saison", "calories": 120, "prep_time": "0 min"}
  },
  "recipe_integration": {
    "enabled": true,
    "auto_calculate_nutrition": true,
    "allow_substitutions": true
  },
  "daily_tips": ["Privilégier l''huile d''olive", "Consommer 2-3 portions de poisson par semaine", "5 portions de fruits et légumes par jour"]
}'
WHERE name = 'Plan Méditerranéen 7 Jours';

-- Note: After running this script, you should:
-- 1. Replace 'PLACEHOLDER_DIETITIAN_ID' with actual dietitian IDs
-- 2. Update the recipe_id fields in templates to reference the actual recipe IDs
-- 3. Test the enhanced template-to-meal-plan transformation