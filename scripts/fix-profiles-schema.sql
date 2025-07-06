-- Fix profiles table schema mismatch
-- Run this in your Supabase SQL editor

-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
