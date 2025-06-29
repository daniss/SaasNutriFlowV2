-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    title TEXT,
    bio TEXT,
    address TEXT,
    license_number TEXT,
    years_experience INTEGER,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    age INTEGER,
    height TEXT,
    current_weight DECIMAL(5,2),
    goal_weight DECIMAL(5,2),
    goal TEXT NOT NULL,
    plan_type TEXT NOT NULL DEFAULT 'Standard',
    status TEXT NOT NULL DEFAULT 'Active',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    emergency_contact TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    last_session DATE,
    next_appointment TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    plan_content JSONB,
    calories_range TEXT,
    duration_days INTEGER DEFAULT 7,
    status TEXT NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency TEXT,
    channels TEXT[] DEFAULT '{"email"}',
    status TEXT NOT NULL DEFAULT 'Scheduled',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    service_description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weight_history table
CREATE TABLE IF NOT EXISTS weight_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('dietitian', 'client')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_dietitian_id ON clients(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_dietitian_id ON meal_plans(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_client_id ON meal_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_dietitian_id ON reminders(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_dietitian_id ON invoices(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_client_id ON weight_history(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_dietitian_id ON messages(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dietitian_id ON appointments(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients: Dietitians can only see their own clients
CREATE POLICY "Dietitians can view own clients" ON clients FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can update own clients" ON clients FOR UPDATE USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can delete own clients" ON clients FOR DELETE USING (auth.uid() = dietitian_id);

-- Meal plans: Dietitians can only see their own meal plans
CREATE POLICY "Dietitians can view own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can insert own meal plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can update own meal plans" ON meal_plans FOR UPDATE USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can delete own meal plans" ON meal_plans FOR DELETE USING (auth.uid() = dietitian_id);

-- Reminders: Dietitians can only see their own reminders
CREATE POLICY "Dietitians can view own reminders" ON reminders FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can insert own reminders" ON reminders FOR INSERT WITH CHECK (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can update own reminders" ON reminders FOR UPDATE USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can delete own reminders" ON reminders FOR DELETE USING (auth.uid() = dietitian_id);

-- Invoices: Dietitians can only see their own invoices
CREATE POLICY "Dietitians can view own invoices" ON invoices FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = dietitian_id);

-- Weight history: Dietitians can see weight history for their clients
CREATE POLICY "Dietitians can view client weight history" ON weight_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = weight_history.client_id AND clients.dietitian_id = auth.uid())
);
CREATE POLICY "Dietitians can insert client weight history" ON weight_history FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = weight_history.client_id AND clients.dietitian_id = auth.uid())
);
CREATE POLICY "Dietitians can update client weight history" ON weight_history FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = weight_history.client_id AND clients.dietitian_id = auth.uid())
);
CREATE POLICY "Dietitians can delete client weight history" ON weight_history FOR DELETE USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = weight_history.client_id AND clients.dietitian_id = auth.uid())
);

-- Messages: Dietitians can see messages for their clients
CREATE POLICY "Dietitians can view client messages" ON messages FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can insert client messages" ON messages FOR INSERT WITH CHECK (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can update client messages" ON messages FOR UPDATE USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can delete client messages" ON messages FOR DELETE USING (auth.uid() = dietitian_id);

-- Appointments: Dietitians can see their own appointments
CREATE POLICY "Dietitians can view own appointments" ON appointments FOR SELECT USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = dietitian_id);
CREATE POLICY "Dietitians can delete own appointments" ON appointments FOR DELETE USING (auth.uid() = dietitian_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
