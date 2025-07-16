-- Progress Tracking System
-- Enhanced progress tracking with weight, measurements, and goals

-- Create progress entries table
CREATE TABLE IF NOT EXISTS progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Weight and body composition
  weight DECIMAL(5,2) NOT NULL,
  body_fat_percentage DECIMAL(4,2),
  muscle_mass DECIMAL(5,2),
  
  -- Body measurements (in cm)
  measurements JSONB DEFAULT '{}',
  
  -- Progress notes and photo
  notes TEXT,
  photo_url TEXT,
  
  -- Timing
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress goals table
CREATE TABLE IF NOT EXISTS progress_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Goal details
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'body_composition')),
  target_value DECIMAL(5,2) NOT NULL,
  current_value DECIMAL(5,2) NOT NULL,
  target_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'paused', 'cancelled')),
  
  -- Links to templates and schedules
  template_id UUID REFERENCES meal_plan_templates(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES meal_plan_schedules(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress milestones table
CREATE TABLE IF NOT EXISTS progress_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES progress_goals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Milestone details
  milestone_type TEXT NOT NULL DEFAULT 'weight', -- weight, measurement, habit, etc.
  target_value DECIMAL(5,2) NOT NULL,
  achieved_value DECIMAL(5,2),
  target_date DATE NOT NULL,
  achieved_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'missed', 'adjusted')),
  
  -- Celebration and motivation
  reward_description TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template effectiveness tracking
CREATE TABLE IF NOT EXISTS template_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES meal_plan_templates(id) ON DELETE CASCADE,
  dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Effectiveness metrics
  client_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  average_weight_loss DECIMAL(4,2) DEFAULT 0,
  average_duration_days INTEGER DEFAULT 0,
  dropout_rate DECIMAL(4,2) DEFAULT 0,
  satisfaction_score DECIMAL(3,2) DEFAULT 0,
  
  -- Calculated fields
  success_rate DECIMAL(4,2) GENERATED ALWAYS AS 
    (CASE WHEN client_count > 0 THEN (success_count::decimal / client_count::decimal) * 100 ELSE 0 END) STORED,
  
  -- Last calculation
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress insights table (AI-generated insights)
CREATE TABLE IF NOT EXISTS progress_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Insight details
  insight_type TEXT NOT NULL, -- trend, recommendation, alert, achievement
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  
  -- Actionable recommendations
  recommendations TEXT[],
  suggested_templates UUID[],
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'acted_upon')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_entries_client ON progress_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_dietitian ON progress_entries(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_date ON progress_entries(recorded_date);

CREATE INDEX IF NOT EXISTS idx_progress_goals_client ON progress_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_goals_dietitian ON progress_goals(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_progress_goals_status ON progress_goals(status);
CREATE INDEX IF NOT EXISTS idx_progress_goals_template ON progress_goals(template_id);

CREATE INDEX IF NOT EXISTS idx_progress_milestones_goal ON progress_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_milestones_client ON progress_milestones(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_milestones_status ON progress_milestones(status);

CREATE INDEX IF NOT EXISTS idx_template_effectiveness_template ON template_effectiveness(template_id);
CREATE INDEX IF NOT EXISTS idx_template_effectiveness_dietitian ON template_effectiveness(dietitian_id);

CREATE INDEX IF NOT EXISTS idx_progress_insights_client ON progress_insights(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_insights_dietitian ON progress_insights(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_progress_insights_status ON progress_insights(status);

-- Add RLS policies
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_effectiveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_insights ENABLE ROW LEVEL SECURITY;

-- Policies for progress_entries
CREATE POLICY "Dietitians can manage their clients' progress entries" ON progress_entries
  FOR ALL USING (dietitian_id = auth.uid());

-- Policies for progress_goals
CREATE POLICY "Dietitians can manage their clients' progress goals" ON progress_goals
  FOR ALL USING (dietitian_id = auth.uid());

-- Policies for progress_milestones
CREATE POLICY "Dietitians can manage milestones for their clients" ON progress_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM progress_goals 
      WHERE id = progress_milestones.goal_id 
      AND dietitian_id = auth.uid()
    )
  );

-- Policies for template_effectiveness
CREATE POLICY "Dietitians can view their template effectiveness" ON template_effectiveness
  FOR ALL USING (dietitian_id = auth.uid());

-- Policies for progress_insights
CREATE POLICY "Dietitians can manage their clients' progress insights" ON progress_insights
  FOR ALL USING (dietitian_id = auth.uid());

-- Create function to calculate progress percentage
CREATE OR REPLACE FUNCTION calculate_progress_percentage(
  p_client_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_client clients%ROWTYPE;
  v_latest_weight DECIMAL(5,2);
  v_starting_weight DECIMAL(5,2);
  v_goal_weight DECIMAL(5,2);
  v_total_to_lose DECIMAL(5,2);
  v_lost_so_far DECIMAL(5,2);
  v_percentage DECIMAL(5,2);
BEGIN
  -- Get client data
  SELECT * INTO v_client FROM clients WHERE id = p_client_id;
  
  IF v_client.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get latest weight from progress entries
  SELECT weight INTO v_latest_weight
  FROM progress_entries 
  WHERE client_id = p_client_id 
  ORDER BY recorded_date DESC 
  LIMIT 1;
  
  -- Use current_weight if no progress entries
  v_latest_weight := COALESCE(v_latest_weight, v_client.current_weight, 0);
  
  -- Get starting weight (oldest entry or current if no entries)
  SELECT weight INTO v_starting_weight
  FROM progress_entries 
  WHERE client_id = p_client_id 
  ORDER BY recorded_date ASC 
  LIMIT 1;
  
  v_starting_weight := COALESCE(v_starting_weight, v_client.current_weight, 0);
  v_goal_weight := COALESCE(v_client.goal_weight, v_starting_weight);
  
  -- Calculate progress
  v_total_to_lose := ABS(v_goal_weight - v_starting_weight);
  v_lost_so_far := ABS(v_latest_weight - v_starting_weight);
  
  -- Avoid division by zero
  IF v_total_to_lose = 0 THEN
    RETURN 100;
  END IF;
  
  v_percentage := (v_lost_so_far / v_total_to_lose) * 100;
  
  -- Cap at 100%
  RETURN LEAST(100, v_percentage);
END;
$$ LANGUAGE plpgsql;

-- Create function to update client progress percentage
CREATE OR REPLACE FUNCTION update_client_progress_percentage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients 
  SET progress_percentage = calculate_progress_percentage(NEW.client_id)
  WHERE id = NEW.client_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update progress percentage
CREATE OR REPLACE TRIGGER trigger_update_progress_percentage
  AFTER INSERT OR UPDATE ON progress_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_client_progress_percentage();

-- Create function to generate progress insights
CREATE OR REPLACE FUNCTION generate_progress_insights(
  p_client_id UUID
) RETURNS VOID AS $$
DECLARE
  v_client clients%ROWTYPE;
  v_progress_entries progress_entries[];
  v_latest_weight DECIMAL(5,2);
  v_weight_trend TEXT;
  v_insight_title TEXT;
  v_insight_description TEXT;
  v_recommendations TEXT[];
BEGIN
  -- Get client data
  SELECT * INTO v_client FROM clients WHERE id = p_client_id;
  
  IF v_client.id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get recent progress entries
  SELECT ARRAY_AGG(pe ORDER BY pe.recorded_date DESC) INTO v_progress_entries
  FROM progress_entries pe
  WHERE pe.client_id = p_client_id
  LIMIT 5;
  
  IF array_length(v_progress_entries, 1) < 2 THEN
    RETURN;
  END IF;
  
  -- Analyze trend
  v_latest_weight := v_progress_entries[1].weight;
  
  IF v_latest_weight < v_progress_entries[2].weight THEN
    v_weight_trend := 'decreasing';
    v_insight_title := 'Progression positive';
    v_insight_description := 'Excellente progression dans la perte de poids';
  ELSIF v_latest_weight > v_progress_entries[2].weight THEN
    v_weight_trend := 'increasing';
    v_insight_title := 'Attention - Prise de poids';
    v_insight_description := 'Prise de poids détectée, révision du plan recommandée';
  ELSE
    v_weight_trend := 'stable';
    v_insight_title := 'Poids stable';
    v_insight_description := 'Poids stable, maintien du plan actuel';
  END IF;
  
  -- Generate recommendations
  v_recommendations := ARRAY[
    'Continuer le suivi régulier',
    'Maintenir l\'hydratation',
    'Respecter les portions recommandées'
  ];
  
  -- Insert insight
  INSERT INTO progress_insights (
    client_id,
    dietitian_id,
    insight_type,
    title,
    description,
    confidence_score,
    recommendations,
    status
  ) VALUES (
    p_client_id,
    v_client.dietitian_id,
    'trend',
    v_insight_title,
    v_insight_description,
    0.8,
    v_recommendations,
    'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to update template effectiveness
CREATE OR REPLACE FUNCTION update_template_effectiveness(
  p_template_id UUID
) RETURNS VOID AS $$
DECLARE
  v_template meal_plan_templates%ROWTYPE;
  v_client_count INTEGER;
  v_success_count INTEGER;
  v_avg_weight_loss DECIMAL(4,2);
  v_avg_duration INTEGER;
  v_dropout_count INTEGER;
BEGIN
  -- Get template data
  SELECT * INTO v_template FROM meal_plan_templates WHERE id = p_template_id;
  
  IF v_template.id IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate metrics (this is a simplified version)
  -- In a real implementation, you'd calculate based on actual client outcomes
  v_client_count := v_template.usage_count;
  v_success_count := GREATEST(0, v_template.usage_count - 2); -- Simplified
  v_avg_weight_loss := 2.5; -- Simplified
  v_avg_duration := 30; -- Simplified
  v_dropout_count := 1; -- Simplified
  
  -- Upsert effectiveness record
  INSERT INTO template_effectiveness (
    template_id,
    dietitian_id,
    client_count,
    success_count,
    average_weight_loss,
    average_duration_days,
    dropout_rate,
    satisfaction_score,
    last_calculated_at
  ) VALUES (
    p_template_id,
    v_template.dietitian_id,
    v_client_count,
    v_success_count,
    v_avg_weight_loss,
    v_avg_duration,
    (v_dropout_count::decimal / GREATEST(1, v_client_count)::decimal) * 100,
    COALESCE(v_template.rating, 0),
    NOW()
  ) ON CONFLICT (template_id, dietitian_id) DO UPDATE SET
    client_count = EXCLUDED.client_count,
    success_count = EXCLUDED.success_count,
    average_weight_loss = EXCLUDED.average_weight_loss,
    average_duration_days = EXCLUDED.average_duration_days,
    dropout_rate = EXCLUDED.dropout_rate,
    satisfaction_score = EXCLUDED.satisfaction_score,
    last_calculated_at = EXCLUDED.last_calculated_at;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint for template effectiveness
ALTER TABLE template_effectiveness 
ADD CONSTRAINT unique_template_effectiveness 
UNIQUE (template_id, dietitian_id);

-- Add comments for documentation
COMMENT ON TABLE progress_entries IS 'Detailed progress tracking with weight, measurements, and photos';
COMMENT ON TABLE progress_goals IS 'Client goals with target values and timelines';
COMMENT ON TABLE progress_milestones IS 'Intermediate milestones for achieving goals';
COMMENT ON TABLE template_effectiveness IS 'Template performance metrics and success rates';
COMMENT ON TABLE progress_insights IS 'AI-generated insights and recommendations';

COMMENT ON COLUMN progress_entries.measurements IS 'JSON object with body measurements in cm';
COMMENT ON COLUMN progress_goals.goal_type IS 'Type of goal: weight_loss, weight_gain, muscle_gain, maintenance, body_composition';
COMMENT ON COLUMN template_effectiveness.success_rate IS 'Calculated success rate percentage';
COMMENT ON COLUMN progress_insights.confidence_score IS 'AI confidence in the insight (0-1)';