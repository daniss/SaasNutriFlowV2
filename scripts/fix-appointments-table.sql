-- Migration script to fix appointments table structure
-- Run this in your Supabase SQL editor

-- First, check if appointments table exists and what its structure is
-- You can run this query first to see the current structure:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'appointments' AND table_schema = 'public';

-- Drop the existing appointments table if it exists (BACKUP YOUR DATA FIRST!)
-- This is necessary because we need to change the structure significantly
DROP TABLE IF EXISTS appointments;

-- Create the correct appointments table structure
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
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Dietitians can view own appointments" ON appointments
  FOR SELECT USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can update own appointments" ON appointments
  FOR UPDATE USING (dietitian_id = auth.uid());

CREATE POLICY "Dietitians can delete own appointments" ON appointments
  FOR DELETE USING (dietitian_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_dietitian_id ON appointments(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Create updated_at trigger
CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the relationship exists
-- Run this query to confirm the foreign key relationships:
-- SELECT 
--   tc.table_name, 
--   kcu.column_name, 
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
--   AND ccu.table_schema = tc.table_schema
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND tc.table_name = 'appointments';
