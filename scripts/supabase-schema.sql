-- Enable Row Level Security (RLS) for all tables
-- This ensures users can only access their own data

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  title TEXT DEFAULT 'Registered Dietitian',
  bio TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  license_number TEXT,
  years_experience INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  age INTEGER,
  height TEXT,
  current_weight DECIMAL,
  goal_weight DECIMAL,
  goal TEXT NOT NULL,
  plan_type TEXT DEFAULT 'Standard',
  status TEXT DEFAULT 'Active',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  emergency_contact TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  last_session TIMESTAMP WITH TIME ZONE,
  next_appointment TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_plans table
CREATE TABLE meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  plan_content JSONB NOT NULL, -- Store meal plan data as JSON
  calories_range TEXT,
  duration_days INTEGER DEFAULT 7,
  status TEXT DEFAULT 'Draft', -- Draft, Active, Completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- check-in, meal-plan, appointment, motivation, follow-up
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT, -- daily, weekly, monthly
  channels TEXT[] DEFAULT '{"email"}', -- email, sms, whatsapp
  status TEXT DEFAULT 'Scheduled', -- Scheduled, Sent, Failed
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  service_description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'Draft', -- Draft, Sent, Paid, Overdue
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weight_history table for tracking client progress
CREATE TABLE weight_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL NOT NULL,
  recorded_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for client-dietitian communication
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL, -- 'dietitian' or 'client'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe_templates table
CREATE TABLE recipe_templates (
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
CREATE TABLE meal_plan_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- weight_loss, muscle_gain, medical, maintenance, etc.
  duration_days INTEGER DEFAULT 7,
  target_calories TEXT, -- e.g., "1400-1600"
  target_macros JSONB, -- target macro percentages
  meal_structure JSONB NOT NULL, -- days, meals, recipes
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'easy',
  rating DECIMAL(2,1),
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  type TEXT DEFAULT 'consultation', -- consultation, follow_up, nutrition_planning, assessment
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients: Dietitians can only see their own clients
CREATE POLICY "Dietitians can view own clients" ON clients
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Meal Plans: Dietitians can only see their own meal plans
CREATE POLICY "Dietitians can view own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own meal plans" ON meal_plans
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own meal plans" ON meal_plans
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Reminders: Dietitians can only see their own reminders
CREATE POLICY "Dietitians can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Invoices: Dietitians can only see their own invoices
CREATE POLICY "Dietitians can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own invoices" ON invoices
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Weight History: Access through client relationship
CREATE POLICY "Access weight history through client" ON weight_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = weight_history.client_id 
      AND clients.dietitian_id = auth.uid()
    )
  );

-- Messages: Access through client relationship
CREATE POLICY "Access messages through client" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = messages.client_id 
      AND clients.dietitian_id = auth.uid()
    )
  );

-- Recipe Templates: Dietitians can only see their own recipe templates
CREATE POLICY "Dietitians can view own recipe templates" ON recipe_templates
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert own recipe templates" ON recipe_templates
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own recipe templates" ON recipe_templates
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own recipe templates" ON recipe_templates
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Meal Plan Templates: Dietitians can only see their own meal plan templates
CREATE POLICY "Dietitians can view own meal plan templates" ON meal_plan_templates
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert own meal plan templates" ON meal_plan_templates
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own meal plan templates" ON meal_plan_templates
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own meal plan templates" ON meal_plan_templates
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Appointments: Dietitians can only see their own appointments
CREATE POLICY "Dietitians can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own appointments" ON appointments
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_clients_dietitian_id ON clients(dietitian_id);
CREATE INDEX idx_meal_plans_client_id ON meal_plans(client_id);
CREATE INDEX idx_meal_plans_dietitian_id ON meal_plans(dietitian_id);
CREATE INDEX idx_reminders_client_id ON reminders(client_id);
CREATE INDEX idx_reminders_dietitian_id ON reminders(dietitian_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_dietitian_id ON invoices(dietitian_id);
CREATE INDEX idx_weight_history_client_id ON weight_history(client_id);
CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_recipe_templates_dietitian_id ON recipe_templates(dietitian_id);
CREATE INDEX idx_meal_plan_templates_dietitian_id ON meal_plan_templates(dietitian_id);
CREATE INDEX idx_appointments_dietitian_id ON appointments(dietitian_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
