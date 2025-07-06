-- Migration script to add missing tables to the database
-- Run this in your Supabase SQL editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create recipe_templates table
CREATE TABLE IF NOT EXISTS recipe_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- breakfast, lunch, dinner, snack, dessert
  dietary_type TEXT[], -- vegetarian, vegan, gluten_free, dairy_free, keto, etc.
  preparation_time INTEGER, -- in minutes
  cooking_time INTEGER, -- in minutes
  servings INTEGER DEFAULT 1,
  calories_per_serving INTEGER,
  macros JSONB, -- protein, carbs, fat, fiber, etc.
  ingredients JSONB NOT NULL, -- array of {name, quantity, unit}
  instructions JSONB NOT NULL, -- array of step instructions
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'easy', -- easy, medium, hard
  rating DECIMAL(2,1),
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE, -- can be shared with other dietitians
  source TEXT, -- cookbook, website, custom, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_plan_templates table
CREATE TABLE IF NOT EXISTS meal_plan_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- weekly, monthly, maintenance, weight_loss, etc.
  duration_days INTEGER DEFAULT 7,
  target_calories INTEGER,
  target_macros JSONB, -- protein, carbs, fat percentages
  meal_structure JSONB NOT NULL, -- {breakfast: {...}, lunch: {...}, dinner: {...}, snacks: [...]}
  dietary_restrictions TEXT[], -- vegetarian, vegan, gluten_free, etc.
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE recipe_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for recipe_templates
CREATE POLICY "Dietitians can view own recipe templates" ON recipe_templates
  FOR SELECT USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can insert own recipe templates" ON recipe_templates
  FOR INSERT WITH CHECK (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can update own recipe templates" ON recipe_templates
  FOR UPDATE USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can delete own recipe templates" ON recipe_templates
  FOR DELETE USING (dietitian_id = auth.uid());

-- Create policies for meal_plan_templates
CREATE POLICY "Dietitians can view own meal plan templates" ON meal_plan_templates
  FOR SELECT USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can insert own meal plan templates" ON meal_plan_templates
  FOR INSERT WITH CHECK (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can update own meal plan templates" ON meal_plan_templates
  FOR UPDATE USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can delete own meal plan templates" ON meal_plan_templates
  FOR DELETE USING (dietitian_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipe_templates_dietitian_id ON recipe_templates(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_recipe_templates_category ON recipe_templates(category);
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_dietitian_id ON meal_plan_templates(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_templates_type ON meal_plan_templates(type);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recipe_templates_updated_at BEFORE UPDATE ON recipe_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_plan_templates_updated_at BEFORE UPDATE ON meal_plan_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
