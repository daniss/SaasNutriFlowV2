-- NutriFlow Professional Nutritionist SaaS
-- French Food Database Schema (ANSES-CIQUAL, 60+ nutrients, GEMRCN, PNNS)
-- To be executed manually in Supabase SQL Editor
CREATE TABLE french_foods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name_fr VARCHAR(255) NOT NULL,
    barcode VARCHAR(32),
    category VARCHAR(64),
    -- French standard portions
    portion_gemrcn NUMERIC, -- Standard portion (GEMRCN)
    portion_pnns NUMERIC,   -- Standard portion (PNNS)
    -- CIQUAL 2020: 60+ nutrients per food (all values per 100g edible portion)
    energy_kcal NUMERIC,
    energy_kj NUMERIC,
    water_g NUMERIC,
    protein_g NUMERIC,
    fat_g NUMERIC,
    saturated_fat_g NUMERIC,
    monounsaturated_fat_g NUMERIC,
    polyunsaturated_fat_g NUMERIC,
    cholesterol_mg NUMERIC,
    carbohydrate_g NUMERIC,
    sugar_g NUMERIC,
    starch_g NUMERIC,
    fiber_g NUMERIC,
    sodium_mg NUMERIC,
    salt_g NUMERIC,
    potassium_mg NUMERIC,
    calcium_mg NUMERIC,
    magnesium_mg NUMERIC,
    phosphorus_mg NUMERIC,
    iron_mg NUMERIC,
    copper_mg NUMERIC,
    zinc_mg NUMERIC,
    manganese_mg NUMERIC,
    selenium_ug NUMERIC,
    iodine_ug NUMERIC,
    vitamin_a_ug NUMERIC,
    retinol_ug NUMERIC,
    beta_carotene_ug NUMERIC,
    vitamin_d_ug NUMERIC,
    vitamin_e_mg NUMERIC,
    vitamin_k1_ug NUMERIC,
    vitamin_k2_ug NUMERIC,
    vitamin_c_mg NUMERIC,
    vitamin_b1_mg NUMERIC,
    vitamin_b2_mg NUMERIC,
    vitamin_b3_mg NUMERIC,
    niacin_equiv_mg NUMERIC,
    vitamin_b5_mg NUMERIC,
    vitamin_b6_mg NUMERIC,
    vitamin_b8_ug NUMERIC,
    vitamin_b9_ug NUMERIC,
    folates_ug NUMERIC,
    vitamin_b12_ug NUMERIC,
    alcohol_g NUMERIC,
    ash_g NUMERIC,
    organic_acids_g NUMERIC,
    polyols_g NUMERIC,
    cholesterol_g NUMERIC,
    sfa_4_0_g NUMERIC,
    sfa_6_0_g NUMERIC,
    sfa_8_0_g NUMERIC,
    sfa_10_0_g NUMERIC,
    sfa_12_0_g NUMERIC,
    sfa_14_0_g NUMERIC,
    sfa_16_0_g NUMERIC,
    sfa_18_0_g NUMERIC,
    alim_code VARCHAR(32),
    alim_nom_sci TEXT,
    alim_grp_code TEXT,
    alim_ssgrp_code TEXT,
    alim_ssssgrp_code TEXT,
    alim_grp_nom_fr TEXT,
    alim_ssgrp_nom_fr TEXT,
    alim_ssssgrp_nom_fr TEXT,
    glucose_g NUMERIC,
    fructose_g NUMERIC,
    galactose_g NUMERIC,
    lactose_g NUMERIC,
    maltose_g NUMERIC,
    saccharose_g NUMERIC,
    energie_jones_kcal NUMERIC,
    energie_jones_kj NUMERIC,
    proteines_625_g NUMERIC,
    mufa_16_1_g NUMERIC,
    mufa_18_1_g NUMERIC,
    pufa_18_2_g NUMERIC,
    pufa_18_3_g NUMERIC,
    pufa_20_4_g NUMERIC,
    pufa_20_5_g NUMERIC,
    pufa_22_6_g NUMERIC,
    -- Add more as needed for full CIQUAL coverage
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE french_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dietitian can access public and own foods" ON french_foods
  FOR SELECT USING (
    dietitian_id IS NULL OR dietitian_id = auth.uid()
  );
CREATE POLICY "Dietitian can insert own foods" ON french_foods
  FOR INSERT WITH CHECK (dietitian_id = auth.uid());
CREATE POLICY "Dietitian can update own foods" ON french_foods
  FOR UPDATE USING (dietitian_id = auth.uid());
CREATE POLICY "Dietitian can delete own foods" ON french_foods
  FOR DELETE USING (dietitian_id = auth.uid());
-- Indexes for search
CREATE INDEX idx_french_foods_name_fr ON french_foods (name_fr);
CREATE INDEX idx_french_foods_barcode ON french_foods (barcode);
CREATE INDEX idx_french_foods_category ON french_foods (category);

-- Foreign key to dietitian (assuming dietitians table exists)
ALTER TABLE french_foods ADD CONSTRAINT fk_dietitian FOREIGN KEY (dietitian_id) REFERENCES dietitians(id);

-- Food Import Script (CSV/JSON to french_foods)
-- Example: Use Supabase's SQL Editor or client API to import CIQUAL data
-- 1. Prepare CIQUAL data as CSV/JSON with matching columns
-- 2. Use Supabase's "Import Data" tool or write a script:
-- Example (Node.js):
--
-- const fs = require('fs');
-- const { createClient } = require('@supabase/supabase-js');
-- const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
-- const foods = JSON.parse(fs.readFileSync('ciqual-foods.json'));
-- for (const food of foods) {
--   await supabase.from('french_foods').insert({ ...food, dietitian_id: YOUR_DIETITIAN_ID });
-- }

-- For CSV: Use Supabase dashboard "Import Data" or pgAdmin's COPY command
-- COPY french_foods (columns...) FROM '/path/to/ciqual.csv' DELIMITER ',' CSV HEADER;

-- All columns must match the schema above. Ensure correct mapping for nutrients and portions.
