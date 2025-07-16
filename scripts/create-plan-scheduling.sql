-- Plan Scheduling System
-- Enable nutritionists to schedule meal plan delivery dates

-- Create meal plan schedules table
CREATE TABLE IF NOT EXISTS meal_plan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  template_id UUID REFERENCES meal_plan_templates(id) ON DELETE SET NULL,
  
  -- Scheduling details
  schedule_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  delivery_frequency TEXT NOT NULL DEFAULT 'weekly', -- daily, weekly, bi-weekly, monthly
  delivery_days INTEGER[] DEFAULT ARRAY[1], -- Days of week (1=Monday, 7=Sunday)
  delivery_time TIME DEFAULT '09:00:00',
  
  -- Plan configuration
  auto_generate BOOLEAN DEFAULT false, -- Auto-generate new plans
  notification_enabled BOOLEAN DEFAULT true,
  notification_days_before INTEGER DEFAULT 1,
  
  -- Status and tracking
  status TEXT DEFAULT 'active', -- active, paused, completed, cancelled
  last_delivered_date DATE,
  next_delivery_date DATE,
  total_deliveries INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal plan deliveries table to track individual deliveries
CREATE TABLE IF NOT EXISTS meal_plan_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES meal_plan_schedules(id) ON DELETE CASCADE,
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  
  -- Delivery details
  planned_date DATE NOT NULL,
  delivered_date DATE,
  status TEXT DEFAULT 'scheduled', -- scheduled, delivered, skipped, failed
  
  -- Notifications
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Client interaction
  client_viewed BOOLEAN DEFAULT false,
  client_viewed_at TIMESTAMP WITH TIME ZONE,
  client_feedback TEXT,
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled appointments table to link appointments with meal plan deliveries
CREATE TABLE IF NOT EXISTS scheduled_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES meal_plan_schedules(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES meal_plan_deliveries(id) ON DELETE SET NULL,
  
  -- Appointment scheduling details
  auto_created BOOLEAN DEFAULT false,
  appointment_type TEXT DEFAULT 'plan_delivery', -- plan_delivery, follow_up, review
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_plan_schedules_dietitian ON meal_plan_schedules(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_schedules_client ON meal_plan_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_schedules_status ON meal_plan_schedules(status);
CREATE INDEX IF NOT EXISTS idx_meal_plan_schedules_next_delivery ON meal_plan_schedules(next_delivery_date);

CREATE INDEX IF NOT EXISTS idx_meal_plan_deliveries_schedule ON meal_plan_deliveries(schedule_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_deliveries_planned_date ON meal_plan_deliveries(planned_date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_deliveries_status ON meal_plan_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_appointment ON scheduled_appointments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_appointments_schedule ON scheduled_appointments(schedule_id);

-- Add RLS policies
ALTER TABLE meal_plan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_appointments ENABLE ROW LEVEL SECURITY;

-- Policies for meal_plan_schedules
CREATE POLICY "Dietitians can manage their own schedules" ON meal_plan_schedules
  FOR ALL USING (dietitian_id = auth.uid());

-- Policies for meal_plan_deliveries
CREATE POLICY "Dietitians can manage deliveries for their schedules" ON meal_plan_deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_plan_schedules 
      WHERE id = meal_plan_deliveries.schedule_id 
      AND dietitian_id = auth.uid()
    )
  );

-- Policies for scheduled_appointments
CREATE POLICY "Dietitians can manage their scheduled appointments" ON scheduled_appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM appointments 
      WHERE id = scheduled_appointments.appointment_id 
      AND dietitian_id = auth.uid()
    )
  );

-- Create function to calculate next delivery date
CREATE OR REPLACE FUNCTION calculate_next_delivery_date(
  p_schedule_id UUID,
  p_from_date DATE DEFAULT CURRENT_DATE
) RETURNS DATE AS $$
DECLARE
  v_schedule meal_plan_schedules%ROWTYPE;
  v_next_date DATE;
  v_target_day INTEGER;
BEGIN
  SELECT * INTO v_schedule FROM meal_plan_schedules WHERE id = p_schedule_id;
  
  IF v_schedule.id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Handle different frequencies
  CASE v_schedule.delivery_frequency
    WHEN 'daily' THEN
      v_next_date := p_from_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      -- Find next occurrence of delivery days
      v_target_day := v_schedule.delivery_days[1];
      v_next_date := p_from_date + (v_target_day - EXTRACT(DOW FROM p_from_date)::INTEGER + 7) % 7;
      IF v_next_date = p_from_date THEN
        v_next_date := v_next_date + INTERVAL '7 days';
      END IF;
    WHEN 'bi-weekly' THEN
      v_target_day := v_schedule.delivery_days[1];
      v_next_date := p_from_date + (v_target_day - EXTRACT(DOW FROM p_from_date)::INTEGER + 7) % 7;
      IF v_next_date = p_from_date THEN
        v_next_date := v_next_date + INTERVAL '14 days';
      ELSE
        v_next_date := v_next_date + INTERVAL '7 days';
      END IF;
    WHEN 'monthly' THEN
      v_next_date := p_from_date + INTERVAL '1 month';
    ELSE
      v_next_date := p_from_date + INTERVAL '1 week';
  END CASE;
  
  -- Don't schedule past end date
  IF v_schedule.end_date IS NOT NULL AND v_next_date > v_schedule.end_date THEN
    RETURN NULL;
  END IF;
  
  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to update next delivery date
CREATE OR REPLACE FUNCTION update_next_delivery_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_delivery_date := calculate_next_delivery_date(NEW.id, COALESCE(NEW.last_delivered_date, NEW.start_date));
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update next delivery date
CREATE TRIGGER trigger_update_next_delivery_date
  BEFORE INSERT OR UPDATE ON meal_plan_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_next_delivery_date();

-- Create function to create scheduled deliveries
CREATE OR REPLACE FUNCTION create_scheduled_deliveries()
RETURNS INTEGER AS $$
DECLARE
  v_schedule meal_plan_schedules%ROWTYPE;
  v_deliveries_created INTEGER := 0;
BEGIN
  FOR v_schedule IN 
    SELECT * FROM meal_plan_schedules 
    WHERE status = 'active' 
    AND next_delivery_date IS NOT NULL 
    AND next_delivery_date <= CURRENT_DATE + INTERVAL '7 days'
  LOOP
    -- Create delivery record
    INSERT INTO meal_plan_deliveries (schedule_id, meal_plan_id, planned_date)
    VALUES (v_schedule.id, v_schedule.meal_plan_id, v_schedule.next_delivery_date)
    ON CONFLICT DO NOTHING;
    
    -- Update schedule
    UPDATE meal_plan_schedules 
    SET 
      last_delivered_date = next_delivery_date,
      total_deliveries = total_deliveries + 1,
      next_delivery_date = calculate_next_delivery_date(id, next_delivery_date)
    WHERE id = v_schedule.id;
    
    v_deliveries_created := v_deliveries_created + 1;
  END LOOP;
  
  RETURN v_deliveries_created;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE meal_plan_schedules IS 'Scheduled meal plan deliveries with recurring patterns';
COMMENT ON TABLE meal_plan_deliveries IS 'Individual meal plan delivery instances';
COMMENT ON TABLE scheduled_appointments IS 'Links appointments to scheduled meal plan deliveries';

COMMENT ON COLUMN meal_plan_schedules.delivery_frequency IS 'How often to deliver: daily, weekly, bi-weekly, monthly';
COMMENT ON COLUMN meal_plan_schedules.delivery_days IS 'Days of week for delivery (1=Monday, 7=Sunday)';
COMMENT ON COLUMN meal_plan_schedules.auto_generate IS 'Whether to auto-generate new plans using templates';
COMMENT ON COLUMN meal_plan_deliveries.status IS 'Delivery status: scheduled, delivered, skipped, failed';