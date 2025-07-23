-- Create AI generations tracking table
CREATE TABLE IF NOT EXISTS ai_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dietitian_id UUID NOT NULL REFERENCES dietitians(auth_user_id),
    generation_type VARCHAR(50) NOT NULL DEFAULT 'meal_plan',
    prompt_used TEXT,
    target_calories INTEGER,
    duration_days INTEGER,
    restrictions TEXT[],
    client_dietary_tags TEXT[],
    generation_successful BOOLEAN NOT NULL DEFAULT true,
    client_id UUID REFERENCES clients(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Policy for dietitians to only see their own AI generations
CREATE POLICY "Dietitians can only access their own AI generations" ON ai_generations
    FOR ALL USING (dietitian_id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_dietitian_id ON ai_generations(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_generations_dietitian_date ON ai_generations(dietitian_id, created_at);

-- Add function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to ai_generations table
CREATE TRIGGER update_ai_generations_updated_at 
    BEFORE UPDATE ON ai_generations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();