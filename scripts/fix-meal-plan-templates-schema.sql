-- Fix meal_plan_templates table schema mismatch
-- Run this in your Supabase SQL editor

-- Add the missing columns to meal_plan_templates table
ALTER TABLE meal_plan_templates 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update the type column to category (if data exists)
UPDATE meal_plan_templates 
SET category = COALESCE(type, 'maintenance') 
WHERE category IS NULL OR category = '';

-- Now make category NOT NULL after setting default values
ALTER TABLE meal_plan_templates 
ALTER COLUMN category SET NOT NULL;

-- Drop the old type column to avoid confusion
ALTER TABLE meal_plan_templates DROP COLUMN IF EXISTS type;

-- Add missing columns to match the TypeScript interface
ALTER TABLE meal_plan_templates 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'easy';

ALTER TABLE meal_plan_templates 
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1);

ALTER TABLE meal_plan_templates 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

ALTER TABLE meal_plan_templates 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

ALTER TABLE meal_plan_templates 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Also fix the target_calories type to match TypeScript (should be TEXT, not INTEGER)
ALTER TABLE meal_plan_templates 
ALTER COLUMN target_calories TYPE TEXT USING target_calories::TEXT;

-- Add dietary_restrictions as separate column if needed
ALTER TABLE meal_plan_templates 
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[];

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'meal_plan_templates' AND table_schema = 'public'
ORDER BY ordinal_position;
