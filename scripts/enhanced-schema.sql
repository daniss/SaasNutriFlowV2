-- Enhanced database schema for NutriFlow with all new features
-- This script builds upon the existing schema and adds new tables

-- Drop existing constraints that might conflict
ALTER TABLE IF EXISTS messages DROP CONSTRAINT IF EXISTS messages_client_id_fkey;
ALTER TABLE IF EXISTS messages DROP CONSTRAINT IF EXISTS messages_dietitian_id_fkey;

-- Enhanced Messages and Conversations system
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    dietitian_id UUID NOT NULL,
    subject TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    is_starred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enhanced Messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID,
ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'dietitian' CHECK (sender_type IN ('dietitian', 'client')),
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'appointment', 'meal_plan')),
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update messages to use conversation_id
ALTER TABLE messages 
ADD FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
    subject TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enhanced Analytics and Metrics
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    client_id UUID,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC,
    metric_data JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enhanced Calendar and Scheduling
CREATE TABLE IF NOT EXISTS calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple', 'caldav')),
    calendar_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recurring_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    client_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    recurrence_rule TEXT NOT NULL, -- RRULE format
    start_date DATE NOT NULL,
    end_date DATE,
    appointment_type TEXT DEFAULT 'consultation',
    location TEXT,
    video_link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Payment Processing
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'sumup', 'lydia')),
    provider_account_id TEXT NOT NULL,
    provider_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID,
    client_id UUID NOT NULL,
    dietitian_id UUID NOT NULL,
    payment_method_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    provider_transaction_id TEXT,
    provider_data JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

-- Food Database Integration
CREATE TABLE IF NOT EXISTS food_database_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    nutrition_per_100g JSONB NOT NULL,
    allergens TEXT[],
    ingredients TEXT[],
    barcode TEXT,
    image_url TEXT,
    source TEXT DEFAULT 'manual',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    nutrition_per_100g JSONB NOT NULL,
    recipe_instructions TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Client Progress Tracking
CREATE TABLE IF NOT EXISTS progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    dietitian_id UUID NOT NULL,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'progress' CHECK (photo_type IN ('progress', 'before', 'after', 'meal')),
    description TEXT,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    dietitian_id UUID NOT NULL,
    measurement_type TEXT NOT NULL CHECK (measurement_type IN ('waist', 'chest', 'hips', 'thigh', 'arm', 'neck')),
    value_cm DECIMAL(5,2) NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enhanced User Settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE(user_id, preference_key)
);

-- Enhanced Meal Plans
ALTER TABLE meal_plans 
ADD COLUMN IF NOT EXISTS meal_plan_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS nutritional_analysis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shopping_list JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] DEFAULT '{}';

-- Meal Plan Feedback
CREATE TABLE IF NOT EXISTS meal_plan_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID NOT NULL,
    client_id UUID NOT NULL,
    dietitian_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    would_recommend BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enhanced Invoicing
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0.20,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net_30',
ADD COLUMN IF NOT EXISTS invoice_template TEXT DEFAULT 'standard';

-- Subscription Management
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    client_id UUID NOT NULL,
    plan_name TEXT NOT NULL,
    plan_type TEXT DEFAULT 'monthly' CHECK (plan_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    billing_cycle INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Workflow Automation
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dietitian_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('client_signup', 'appointment_completed', 'plan_completed', 'weight_goal_reached', 'inactivity')),
    trigger_conditions JSONB DEFAULT '{}',
    action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'send_sms', 'create_appointment', 'assign_plan', 'send_reminder')),
    action_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_dietitian_id ON conversations(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_dietitian_id ON analytics_events(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_dietitian_id ON payment_transactions(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_photos_client_id ON progress_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_taken_at ON progress_photos(taken_at DESC);

CREATE INDEX IF NOT EXISTS idx_body_measurements_client_id ON body_measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_recorded_at ON body_measurements(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_food_database_items_name ON food_database_items USING gin(to_tsvector('french', name));
CREATE INDEX IF NOT EXISTS idx_food_database_items_category ON food_database_items(category);

-- Enable Row Level Security (RLS) on all new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
-- Conversations
CREATE POLICY "Users can view their own conversations" ON conversations FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Users can insert their own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = dietitian_id);
CREATE POLICY "Users can update their own conversations" ON conversations FOR UPDATE USING (auth.uid() = dietitian_id);
CREATE POLICY "Users can delete their own conversations" ON conversations FOR DELETE USING (auth.uid() = dietitian_id);

-- Analytics Events
CREATE POLICY "Users can view their own analytics" ON analytics_events FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Users can insert their own analytics" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

-- Performance Metrics
CREATE POLICY "Users can view their own metrics" ON performance_metrics FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Users can insert their own metrics" ON performance_metrics FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

-- Calendar Integrations
CREATE POLICY "Users can manage their own calendar integrations" ON calendar_integrations FOR ALL USING (auth.uid() = dietitian_id);

-- Payment Methods
CREATE POLICY "Users can manage their own payment methods" ON payment_methods FOR ALL USING (auth.uid() = dietitian_id);

-- Payment Transactions
CREATE POLICY "Users can view their own transactions" ON payment_transactions FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Users can insert their own transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

-- Custom Foods
CREATE POLICY "Users can manage their own custom foods" ON custom_foods FOR ALL USING (auth.uid() = dietitian_id);
CREATE POLICY "Users can view public custom foods" ON custom_foods FOR SELECT USING (is_public = true);

-- Progress Photos
CREATE POLICY "Users can manage their clients' progress photos" ON progress_photos FOR ALL USING (auth.uid() = dietitian_id);

-- Body Measurements
CREATE POLICY "Users can manage their clients' measurements" ON body_measurements FOR ALL USING (auth.uid() = dietitian_id);

-- User Preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Meal Plan Feedback
CREATE POLICY "Users can view feedback for their meal plans" ON meal_plan_feedback FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Users can insert feedback for their meal plans" ON meal_plan_feedback FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

-- Subscription Plans
CREATE POLICY "Users can manage their own subscription plans" ON subscription_plans FOR ALL USING (auth.uid() = dietitian_id);

-- Automation Rules
CREATE POLICY "Users can manage their own automation rules" ON automation_rules FOR ALL USING (auth.uid() = dietitian_id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_timestamp BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Insert default notification templates
INSERT INTO notification_templates (dietitian_id, name, type, subject, content, variables, category) 
SELECT 
    id as dietitian_id,
    'Rappel de rendez-vous' as name,
    'email' as type,
    'Rappel: Rendez-vous demain avec {{dietitian_name}}' as subject,
    'Bonjour {{client_name}}, nous vous rappelons votre rendez-vous prévu demain à {{appointment_time}} avec {{dietitian_name}}.' as content,
    '["client_name", "appointment_time", "dietitian_name"]'::jsonb as variables,
    'appointment' as category
FROM profiles 
WHERE id IN (SELECT DISTINCT dietitian_id FROM clients)
ON CONFLICT DO NOTHING;

COMMIT;
