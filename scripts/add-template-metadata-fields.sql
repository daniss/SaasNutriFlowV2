-- Migration: Add metadata fields to meal_plan_templates for better meal plan generation
-- This enhances templates to support full meal plan compatibility

-- Add new columns to meal_plan_templates table
ALTER TABLE meal_plan_templates
ADD COLUMN IF NOT EXISTS estimated_prep_time_total INTEGER,
ADD COLUMN IF NOT EXISTS shopping_list_template JSONB,
ADD COLUMN IF NOT EXISTS allergen_info TEXT[],
ADD COLUMN IF NOT EXISTS cuisine_type TEXT,
ADD COLUMN IF NOT EXISTS budget_level TEXT CHECK (budget_level IN ('budget', 'moderate', 'premium')),
ADD COLUMN IF NOT EXISTS season TEXT CHECK (season IN ('all', 'spring', 'summer', 'fall', 'winter')),
ADD COLUMN IF NOT EXISTS equipment_needed TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN meal_plan_templates.estimated_prep_time_total IS 'Total estimated preparation time in minutes for all meals';
COMMENT ON COLUMN meal_plan_templates.shopping_list_template IS 'Pre-generated shopping list with quantities and categories';
COMMENT ON COLUMN meal_plan_templates.allergen_info IS 'Array of common allergens present in the meal plan';
COMMENT ON COLUMN meal_plan_templates.cuisine_type IS 'Type of cuisine (e.g., Mediterranean, Asian, French)';
COMMENT ON COLUMN meal_plan_templates.budget_level IS 'Estimated cost level of the meal plan';
COMMENT ON COLUMN meal_plan_templates.season IS 'Best season for this meal plan based on ingredients';
COMMENT ON COLUMN meal_plan_templates.equipment_needed IS 'Kitchen equipment required for preparation';

-- Update RLS policies if needed (templates should already have proper RLS)
-- Existing policies should cover these new fields automatically

-- Set default values for existing templates
UPDATE meal_plan_templates
SET 
  season = 'all',
  budget_level = 'moderate',
  shopping_list_template = '{"items": []}'::jsonb,
  allergen_info = ARRAY[]::TEXT[],
  equipment_needed = ARRAY[]::TEXT[]
WHERE season IS NULL;

-- Example of shopping_list_template structure:
-- {
--   "items": [
--     {
--       "category": "Fruits et Légumes",
--       "items": [
--         {"name": "Tomates", "quantity": "500g"},
--         {"name": "Avocat", "quantity": "2 pièces"}
--       ]
--     },
--     {
--       "category": "Protéines",
--       "items": [
--         {"name": "Poulet", "quantity": "400g"},
--         {"name": "Œufs", "quantity": "6 pièces"}
--       ]
--     }
--   ],
--   "notes": "Liste pour 7 jours, 2 personnes"
-- }