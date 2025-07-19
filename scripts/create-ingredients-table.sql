-- Create ingredients table for nutritional database
-- This table stores nutritional information for ingredients per 100g/100ml/1 piece

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  
  -- Nutritional values per 100g (for solid ingredients)
  calories_per_100g DECIMAL(8,2),
  protein_per_100g DECIMAL(8,2),
  carbs_per_100g DECIMAL(8,2),
  fat_per_100g DECIMAL(8,2),
  fiber_per_100g DECIMAL(8,2),
  
  -- Nutritional values per 100ml (for liquid ingredients)
  calories_per_100ml DECIMAL(8,2),
  protein_per_100ml DECIMAL(8,2),
  carbs_per_100ml DECIMAL(8,2),
  fat_per_100ml DECIMAL(8,2),
  fiber_per_100ml DECIMAL(8,2),
  
  -- Nutritional values per 1 piece (for countable ingredients)
  calories_per_piece DECIMAL(8,2),
  protein_per_piece DECIMAL(8,2),
  carbs_per_piece DECIMAL(8,2),
  fat_per_piece DECIMAL(8,2),
  fiber_per_piece DECIMAL(8,2),
  
  -- Additional metadata
  category TEXT, -- 'solid', 'liquid', 'countable'
  unit_type TEXT, -- 'g', 'ml', 'piece'
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate ingredients per dietitian
  UNIQUE(dietitian_id, name)
);

-- Create RLS policies
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own ingredients
CREATE POLICY "Users can view own ingredients" ON ingredients
  FOR SELECT USING (auth.uid() = dietitian_id);

-- Policy: Users can insert their own ingredients
CREATE POLICY "Users can insert own ingredients" ON ingredients
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

-- Policy: Users can update their own ingredients
CREATE POLICY "Users can update own ingredients" ON ingredients
  FOR UPDATE USING (auth.uid() = dietitian_id);

-- Policy: Users can delete their own ingredients
CREATE POLICY "Users can delete own ingredients" ON ingredients
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Create indexes for better performance
CREATE INDEX ingredients_dietitian_id_idx ON ingredients(dietitian_id);
CREATE INDEX ingredients_name_idx ON ingredients(name);
CREATE INDEX ingredients_category_idx ON ingredients(category);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ingredients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredients_updated_at();