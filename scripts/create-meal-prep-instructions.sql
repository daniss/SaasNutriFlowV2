-- Automated Meal Prep Instructions Database Schema
-- Step-by-step preparation guides for recipes and meal plans

-- Table for meal prep instruction templates
CREATE TABLE IF NOT EXISTS meal_prep_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID, -- References recipe_templates
    meal_plan_id UUID, -- References meal_plan_templates  
    dietitian_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    prep_time_minutes INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    equipment_needed TEXT[], -- Array of required equipment
    prep_category VARCHAR(50) CHECK (prep_category IN ('meal_prep', 'batch_cooking', 'advance_prep', 'quick_prep')),
    servings INTEGER DEFAULT 1,
    storage_instructions TEXT,
    nutrition_notes TEXT,
    is_template BOOLEAN DEFAULT false, -- True if this is a reusable template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_meal_prep_instructions_recipe 
        FOREIGN KEY (recipe_id) 
        REFERENCES recipe_templates(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_meal_prep_instructions_meal_plan 
        FOREIGN KEY (meal_plan_id) 
        REFERENCES meal_plan_templates(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_meal_prep_instructions_dietitian 
        FOREIGN KEY (dietitian_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE,
    
    -- Ensure either recipe_id or meal_plan_id is set, but not both
    CONSTRAINT check_single_reference 
        CHECK ((recipe_id IS NOT NULL AND meal_plan_id IS NULL) OR (recipe_id IS NULL AND meal_plan_id IS NOT NULL)),
    
    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_meal_prep_instructions_recipe ON meal_prep_instructions(recipe_id),
    CREATE INDEX IF NOT EXISTS idx_meal_prep_instructions_meal_plan ON meal_prep_instructions(meal_plan_id),
    CREATE INDEX IF NOT EXISTS idx_meal_prep_instructions_dietitian ON meal_prep_instructions(dietitian_id),
    CREATE INDEX IF NOT EXISTS idx_meal_prep_instructions_category ON meal_prep_instructions(prep_category),
    CREATE INDEX IF NOT EXISTS idx_meal_prep_instructions_template ON meal_prep_instructions(is_template) WHERE is_template = true
);

-- Table for individual preparation steps
CREATE TABLE IF NOT EXISTS prep_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_prep_instruction_id UUID NOT NULL,
    step_number INTEGER NOT NULL,
    step_type VARCHAR(30) CHECK (step_type IN ('prep', 'cook', 'assemble', 'store', 'reheat', 'serve')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER, -- Estimated time for this step
    temperature VARCHAR(50), -- For cooking steps (e.g., "180°C", "Medium heat")
    equipment VARCHAR(100), -- Specific equipment for this step
    tips TEXT, -- Optional tips for this step
    order_position INTEGER NOT NULL, -- For custom ordering
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_prep_steps_instruction 
        FOREIGN KEY (meal_prep_instruction_id) 
        REFERENCES meal_prep_instructions(id) 
        ON DELETE CASCADE,
    
    -- Ensure unique step numbers per instruction
    UNIQUE(meal_prep_instruction_id, step_number),
    
    -- Index for ordering
    CREATE INDEX IF NOT EXISTS idx_prep_steps_order ON prep_steps(meal_prep_instruction_id, order_position)
);

-- Table for ingredient preparation details
CREATE TABLE IF NOT EXISTS ingredient_prep_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_prep_instruction_id UUID NOT NULL,
    ingredient_name VARCHAR(255) NOT NULL,
    quantity VARCHAR(100),
    unit VARCHAR(50),
    prep_method VARCHAR(100), -- e.g., "chopped", "diced", "sliced"
    prep_notes TEXT,
    storage_method VARCHAR(100), -- How to store prepped ingredient
    shelf_life_days INTEGER, -- How long prepped ingredient lasts
    prep_order INTEGER, -- Order to prep ingredients
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_ingredient_prep_instruction 
        FOREIGN KEY (meal_prep_instruction_id) 
        REFERENCES meal_prep_instructions(id) 
        ON DELETE CASCADE,
    
    -- Index for ordering
    CREATE INDEX IF NOT EXISTS idx_ingredient_prep_order ON ingredient_prep_details(meal_prep_instruction_id, prep_order)
);

-- Table for nutritional timing and notes
CREATE TABLE IF NOT EXISTS nutrition_timing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_prep_instruction_id UUID NOT NULL,
    meal_timing VARCHAR(50) CHECK (meal_timing IN ('breakfast', 'mid_morning', 'lunch', 'afternoon', 'dinner', 'evening')),
    nutritional_focus VARCHAR(100), -- e.g., "high protein", "pre-workout", "post-workout"
    macro_breakdown JSONB, -- Structured macro information
    serving_suggestions TEXT,
    timing_notes TEXT, -- When to eat, portion considerations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_nutrition_timing_instruction 
        FOREIGN KEY (meal_prep_instruction_id) 
        REFERENCES meal_prep_instructions(id) 
        ON DELETE CASCADE
);

-- Table for prep instruction usage tracking
CREATE TABLE IF NOT EXISTS prep_instruction_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_prep_instruction_id UUID NOT NULL,
    used_by_dietitian_id UUID NOT NULL,
    client_id UUID, -- If used for a specific client
    meal_plan_id UUID, -- If used in a specific meal plan
    usage_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_rating INTEGER CHECK (completion_rating >= 1 AND completion_rating <= 5),
    feedback TEXT,
    time_taken_minutes INTEGER, -- Actual time taken vs estimated
    difficulty_experienced VARCHAR(20) CHECK (difficulty_experienced IN ('easier', 'as_expected', 'harder')),
    
    -- Foreign key constraints
    CONSTRAINT fk_prep_usage_instruction 
        FOREIGN KEY (meal_prep_instruction_id) 
        REFERENCES meal_prep_instructions(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_prep_usage_dietitian 
        FOREIGN KEY (used_by_dietitian_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_prep_usage_client 
        FOREIGN KEY (client_id) 
        REFERENCES clients(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_prep_usage_meal_plan 
        FOREIGN KEY (meal_plan_id) 
        REFERENCES meal_plans(id) 
        ON DELETE SET NULL
);

-- Row Level Security Policies
ALTER TABLE meal_prep_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prep_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_timing ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_instruction_usage ENABLE ROW LEVEL SECURITY;

-- Policies for meal_prep_instructions
CREATE POLICY "Nutritionists can view their own prep instructions" ON meal_prep_instructions
    FOR SELECT USING (dietitian_id = auth.uid());

CREATE POLICY "Nutritionists can manage their own prep instructions" ON meal_prep_instructions
    FOR ALL USING (dietitian_id = auth.uid());

-- Policies for prep_steps
CREATE POLICY "Users can view steps for their instructions" ON prep_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_prep_instructions 
            WHERE id = meal_prep_instruction_id 
            AND dietitian_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage steps for their instructions" ON prep_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM meal_prep_instructions 
            WHERE id = meal_prep_instruction_id 
            AND dietitian_id = auth.uid()
        )
    );

-- Policies for ingredient_prep_details
CREATE POLICY "Users can view ingredient details for their instructions" ON ingredient_prep_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_prep_instructions 
            WHERE id = meal_prep_instruction_id 
            AND dietitian_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage ingredient details for their instructions" ON ingredient_prep_details
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM meal_prep_instructions 
            WHERE id = meal_prep_instruction_id 
            AND dietitian_id = auth.uid()
        )
    );

-- Policies for nutrition_timing
CREATE POLICY "Users can view nutrition timing for their instructions" ON nutrition_timing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_prep_instructions 
            WHERE id = meal_prep_instruction_id 
            AND dietitian_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage nutrition timing for their instructions" ON nutrition_timing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM meal_prep_instructions 
            WHERE id = meal_prep_instruction_id 
            AND dietitian_id = auth.uid()
        )
    );

-- Policies for prep_instruction_usage
CREATE POLICY "Users can view their own usage records" ON prep_instruction_usage
    FOR SELECT USING (used_by_dietitian_id = auth.uid());

CREATE POLICY "Users can create their own usage records" ON prep_instruction_usage
    FOR INSERT WITH CHECK (used_by_dietitian_id = auth.uid());

CREATE POLICY "Users can update their own usage records" ON prep_instruction_usage
    FOR UPDATE USING (used_by_dietitian_id = auth.uid());

-- Function to auto-generate prep instructions from recipe
CREATE OR REPLACE FUNCTION generate_basic_prep_instructions(
    p_recipe_id UUID,
    p_dietitian_id UUID
) RETURNS UUID AS $$
DECLARE
    recipe_record RECORD;
    instruction_id UUID;
    step_counter INTEGER := 1;
BEGIN
    -- Get recipe information
    SELECT * INTO recipe_record 
    FROM recipe_templates 
    WHERE id = p_recipe_id AND dietitian_id = p_dietitian_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recipe not found or access denied';
    END IF;
    
    -- Create the main instruction record
    INSERT INTO meal_prep_instructions (
        recipe_id,
        dietitian_id,
        title,
        description,
        prep_time_minutes,
        difficulty_level,
        servings,
        prep_category
    ) VALUES (
        p_recipe_id,
        p_dietitian_id,
        'Instructions pour: ' || recipe_record.name,
        'Instructions de préparation générées automatiquement',
        recipe_record.prep_time,
        recipe_record.difficulty,
        recipe_record.servings,
        'meal_prep'
    ) RETURNING id INTO instruction_id;
    
    -- Add basic preparation steps
    INSERT INTO prep_steps (meal_prep_instruction_id, step_number, step_type, title, description, order_position)
    VALUES 
        (instruction_id, step_counter, 'prep', 'Préparation des ingrédients', 'Rassembler et préparer tous les ingrédients selon les indications', step_counter);
    step_counter := step_counter + 1;
    
    -- Add cooking step if recipe has instructions
    IF recipe_record.instructions IS NOT NULL THEN
        INSERT INTO prep_steps (meal_prep_instruction_id, step_number, step_type, title, description, order_position)
        VALUES 
            (instruction_id, step_counter, 'cook', 'Cuisson', recipe_record.instructions, step_counter);
        step_counter := step_counter + 1;
    END IF;
    
    -- Add serving step
    INSERT INTO prep_steps (meal_prep_instruction_id, step_number, step_type, title, description, order_position)
    VALUES 
        (instruction_id, step_counter, 'serve', 'Service', 'Servir immédiatement ou conserver selon les instructions de stockage', step_counter);
    
    RETURN instruction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total prep time
CREATE OR REPLACE FUNCTION calculate_total_prep_time(instruction_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_time INTEGER;
BEGIN
    SELECT COALESCE(SUM(duration_minutes), 0) 
    INTO total_time
    FROM prep_steps 
    WHERE meal_prep_instruction_id = instruction_id;
    
    -- Update the main instruction record
    UPDATE meal_prep_instructions 
    SET prep_time_minutes = total_time,
        updated_at = NOW()
    WHERE id = instruction_id;
    
    RETURN total_time;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate prep time when steps are modified
CREATE OR REPLACE FUNCTION recalculate_prep_time()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_total_prep_time(COALESCE(NEW.meal_prep_instruction_id, OLD.meal_prep_instruction_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalculate_prep_time_trigger
    AFTER INSERT OR UPDATE OR DELETE ON prep_steps
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_prep_time();

-- Add some default prep instruction templates
INSERT INTO meal_prep_instructions (
    dietitian_id,
    title,
    description,
    prep_category,
    difficulty_level,
    is_template,
    equipment_needed,
    storage_instructions
) 
SELECT 
    id,
    'Modèle: Préparation batch cooking',
    'Instructions de base pour la préparation de repas en lot',
    'batch_cooking',
    'intermediate',
    true,
    ARRAY['Contenants hermétiques', 'Balance de cuisine', 'Plaque de cuisson'],
    'Conserver au réfrigérateur jusqu''à 4 jours ou congeler jusqu''à 3 mois'
FROM dietitians
ON CONFLICT DO NOTHING;