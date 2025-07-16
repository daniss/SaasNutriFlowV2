-- Enhance template categories for professional use
-- Add proper categorization for meal plan templates

-- Add new categorization columns
ALTER TABLE meal_plan_templates 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS health_condition TEXT,
ADD COLUMN IF NOT EXISTS goal_type TEXT;

-- Add recipe template categories if not exists
ALTER TABLE recipe_templates
ADD COLUMN IF NOT EXISTS meal_type TEXT DEFAULT 'main',
ADD COLUMN IF NOT EXISTS cuisine_type TEXT DEFAULT 'international',
ADD COLUMN IF NOT EXISTS health_benefits TEXT[];

-- Update existing records with proper categories
UPDATE meal_plan_templates 
SET category = CASE
  WHEN type ILIKE '%weight%loss%' OR type ILIKE '%perte%poids%' THEN 'weight_loss'
  WHEN type ILIKE '%muscle%gain%' OR type ILIKE '%prise%masse%' THEN 'muscle_gain'
  WHEN type ILIKE '%diabetes%' OR type ILIKE '%diabète%' THEN 'diabetes'
  WHEN type ILIKE '%heart%' OR type ILIKE '%cardio%' THEN 'cardiovascular'
  WHEN type ILIKE '%detox%' THEN 'detox'
  WHEN type ILIKE '%maintenance%' THEN 'maintenance'
  ELSE 'general'
END;

-- Set goal_type based on category
UPDATE meal_plan_templates 
SET goal_type = CASE
  WHEN category = 'weight_loss' THEN 'weight_loss'
  WHEN category = 'muscle_gain' THEN 'muscle_gain'
  WHEN category = 'maintenance' THEN 'maintenance'
  WHEN category = 'diabetes' THEN 'health_management'
  WHEN category = 'cardiovascular' THEN 'health_management'
  WHEN category = 'detox' THEN 'detox'
  ELSE 'general'
END;

-- Set client_type based on common patterns
UPDATE meal_plan_templates 
SET client_type = CASE
  WHEN category IN ('diabetes', 'cardiovascular') THEN 'medical'
  WHEN category IN ('weight_loss', 'muscle_gain') THEN 'fitness'
  WHEN category = 'maintenance' THEN 'lifestyle'
  WHEN category = 'detox' THEN 'wellness'
  ELSE 'general'
END;

-- Update recipe templates with meal types
UPDATE recipe_templates 
SET meal_type = CASE
  WHEN category ILIKE '%breakfast%' OR category ILIKE '%petit%déjeuner%' THEN 'breakfast'
  WHEN category ILIKE '%lunch%' OR category ILIKE '%déjeuner%' THEN 'lunch'
  WHEN category ILIKE '%dinner%' OR category ILIKE '%dîner%' THEN 'dinner'
  WHEN category ILIKE '%snack%' OR category ILIKE '%collation%' THEN 'snack'
  WHEN category ILIKE '%dessert%' THEN 'dessert'
  ELSE 'main'
END;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_category ON meal_plan_templates(category);
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_client_type ON meal_plan_templates(client_type);
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_goal_type ON meal_plan_templates(goal_type);
CREATE INDEX IF NOT EXISTS idx_recipe_templates_meal_type ON recipe_templates(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipe_templates_cuisine_type ON recipe_templates(cuisine_type);

-- Create a view for template statistics
CREATE OR REPLACE VIEW template_stats AS
SELECT 
  dietitian_id,
  'meal_plan' as template_type,
  category,
  client_type,
  goal_type,
  COUNT(*) as count,
  AVG(usage_count) as avg_usage,
  SUM(usage_count) as total_usage,
  AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE 0 END) as avg_rating
FROM meal_plan_templates
GROUP BY dietitian_id, category, client_type, goal_type

UNION ALL

SELECT 
  dietitian_id,
  'recipe' as template_type,
  category,
  null as client_type,
  null as goal_type,
  COUNT(*) as count,
  AVG(usage_count) as avg_usage,
  SUM(usage_count) as total_usage,
  AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE 0 END) as avg_rating
FROM recipe_templates
GROUP BY dietitian_id, category;

-- Add RLS policy for the view
CREATE POLICY "Dietitians can view own template stats" ON template_stats
FOR SELECT USING (dietitian_id = auth.uid());

-- Add comments for documentation
COMMENT ON COLUMN meal_plan_templates.category IS 'Main category: weight_loss, muscle_gain, diabetes, cardiovascular, detox, maintenance, general';
COMMENT ON COLUMN meal_plan_templates.client_type IS 'Client type: medical, fitness, lifestyle, wellness, general';
COMMENT ON COLUMN meal_plan_templates.goal_type IS 'Goal type: weight_loss, muscle_gain, maintenance, health_management, detox, general';
COMMENT ON COLUMN recipe_templates.meal_type IS 'Meal type: breakfast, lunch, dinner, snack, dessert, main';
COMMENT ON COLUMN recipe_templates.cuisine_type IS 'Cuisine type: french, mediterranean, asian, american, international, etc.';