-- Cleanup Development Data Script
-- This script safely removes development recipes, meal plans, and templates
-- while preserving database structure and referential integrity

-- WARNING: This will delete ALL data in these tables
-- Make sure you have a backup if needed

BEGIN;

-- Step 1: Delete recipe ingredients (child table first)
DELETE FROM recipe_ingredients;

-- Step 2: Delete meal plan recipes (relationship table)
DELETE FROM meal_plan_recipes;

-- Step 3: Delete recipes
DELETE FROM recipes;

-- Step 4: Delete recipe templates
DELETE FROM recipe_templates;

-- Step 5: Delete meal plans
DELETE FROM meal_plans;

-- Step 6: Delete meal plan templates
DELETE FROM meal_plan_templates;

-- Verify the cleanup
SELECT 
  'recipes' as table_name, COUNT(*) as remaining_count
FROM recipes
UNION ALL
SELECT 
  'meal_plans' as table_name, COUNT(*) as remaining_count
FROM meal_plans
UNION ALL
SELECT 
  'meal_plan_templates' as table_name, COUNT(*) as remaining_count
FROM meal_plan_templates
UNION ALL
SELECT 
  'recipe_templates' as table_name, COUNT(*) as remaining_count
FROM recipe_templates
UNION ALL
SELECT 
  'meal_plan_recipes' as table_name, COUNT(*) as remaining_count
FROM meal_plan_recipes
UNION ALL
SELECT 
  'recipe_ingredients' as table_name, COUNT(*) as remaining_count
FROM recipe_ingredients;

-- If everything looks good, commit the transaction
COMMIT;

-- If you need to rollback, uncomment the line below instead of COMMIT
-- ROLLBACK;