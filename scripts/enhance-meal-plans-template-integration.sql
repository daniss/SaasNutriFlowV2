-- Migration: Enhance meal plans template integration
-- Date: 2025-07-17
-- Purpose: Add template relationship and tracking to meal_plans table

-- Add template relationship and tracking to meal_plans table
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES meal_plan_templates(id);
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS generation_method TEXT DEFAULT 'manual';

-- Add template usage tracking
ALTER TABLE meal_plan_templates ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_template_id ON meal_plans(template_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_usage ON meal_plan_templates(usage_count, last_used_at);

-- Add generation method check constraint
ALTER TABLE meal_plans ADD CONSTRAINT IF NOT EXISTS chk_generation_method 
CHECK (generation_method IN ('manual', 'ai', 'template'));

-- Update existing meal plans to set generation_method based on plan_content
UPDATE meal_plans 
SET generation_method = CASE 
    WHEN plan_content->>'generated_by' = 'ai' THEN 'ai'
    WHEN plan_content->>'generated_by' = 'template' THEN 'template'
    ELSE 'manual'
END
WHERE generation_method = 'manual';