-- Create meal_plan_feedback table for client feedback system
-- This table stores feedback from clients about their meal plans

CREATE TABLE IF NOT EXISTS meal_plan_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID NOT NULL,
    client_id UUID NOT NULL,
    dietitian_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    would_recommend BOOLEAN DEFAULT false,
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_meal_plan_feedback_meal_plan 
        FOREIGN KEY (meal_plan_id) 
        REFERENCES meal_plans(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_meal_plan_feedback_client 
        FOREIGN KEY (client_id) 
        REFERENCES clients(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_meal_plan_feedback_dietitian 
        FOREIGN KEY (dietitian_id) 
        REFERENCES dietitians(id) 
        ON DELETE CASCADE,
    
    -- Prevent duplicate feedback from same client for same meal plan
    UNIQUE(meal_plan_id, client_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_plan_feedback_meal_plan_id ON meal_plan_feedback(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_feedback_client_id ON meal_plan_feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_feedback_dietitian_id ON meal_plan_feedback(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_feedback_created_at ON meal_plan_feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE meal_plan_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_plan_feedback

-- Policy: Nutritionists can view feedback for their own meal plans
CREATE POLICY "Nutritionists can view their meal plan feedback" ON meal_plan_feedback
    FOR SELECT USING (dietitian_id = auth.uid());

-- Policy: Clients can view their own feedback
CREATE POLICY "Clients can view their own feedback" ON meal_plan_feedback
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Clients can create feedback for their own meal plans
CREATE POLICY "Clients can create feedback for their meal plans" ON meal_plan_feedback
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT id FROM clients 
            WHERE auth_user_id = auth.uid()
        )
        AND meal_plan_id IN (
            SELECT id FROM meal_plans 
            WHERE client_id IN (
                SELECT id FROM clients 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Policy: Clients can update their own feedback
CREATE POLICY "Clients can update their own feedback" ON meal_plan_feedback
    FOR UPDATE USING (
        client_id IN (
            SELECT id FROM clients 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Nutritionists can manage feedback for their clients' meal plans
CREATE POLICY "Nutritionists can manage client feedback" ON meal_plan_feedback
    FOR ALL USING (dietitian_id = auth.uid());

-- Function to automatically set dietitian_id when feedback is created
CREATE OR REPLACE FUNCTION set_meal_plan_feedback_dietitian()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the dietitian_id from the meal_plan
    SELECT mp.dietitian_id INTO NEW.dietitian_id
    FROM meal_plans mp
    WHERE mp.id = NEW.meal_plan_id;
    
    -- Ensure the client belongs to the same dietitian
    IF NOT EXISTS (
        SELECT 1 FROM clients c 
        WHERE c.id = NEW.client_id 
        AND c.dietitian_id = NEW.dietitian_id
    ) THEN
        RAISE EXCEPTION 'Client does not belong to the dietitian of this meal plan';
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set dietitian_id automatically
CREATE TRIGGER set_meal_plan_feedback_dietitian_trigger
    BEFORE INSERT OR UPDATE ON meal_plan_feedback
    FOR EACH ROW
    EXECUTE FUNCTION set_meal_plan_feedback_dietitian();

-- Function to update meal plan rating when feedback changes
CREATE OR REPLACE FUNCTION update_meal_plan_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    feedback_count INTEGER;
BEGIN
    -- Calculate average rating for the meal plan
    SELECT 
        AVG(rating)::DECIMAL(3,2),
        COUNT(*)
    INTO avg_rating, feedback_count
    FROM meal_plan_feedback 
    WHERE meal_plan_id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id);
    
    -- Update the meal plan with the new rating
    UPDATE meal_plans 
    SET 
        rating = avg_rating,
        rating_count = feedback_count,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.meal_plan_id, OLD.meal_plan_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update meal plan rating when feedback changes
CREATE TRIGGER update_meal_plan_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON meal_plan_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_rating();

-- Add rating and rating_count columns to meal_plans table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meal_plans' AND column_name = 'rating'
    ) THEN
        ALTER TABLE meal_plans ADD COLUMN rating DECIMAL(3,2) DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meal_plans' AND column_name = 'rating_count'
    ) THEN
        ALTER TABLE meal_plans ADD COLUMN rating_count INTEGER DEFAULT 0;
    END IF;
END $$;