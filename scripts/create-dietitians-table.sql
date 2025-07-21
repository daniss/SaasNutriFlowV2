-- Create the missing dietitians table
-- This table is expected by multiple API routes and should reference auth.users

CREATE TABLE IF NOT EXISTS public.dietitians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  specialties TEXT[],
  license_number TEXT,
  practice_address TEXT,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dietitians_auth_user_id ON public.dietitians(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_dietitians_email ON public.dietitians(email);

-- Enable Row Level Security
ALTER TABLE public.dietitians ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Dietitians can only see and modify their own data
CREATE POLICY "Dietitians can view own profile" ON public.dietitians
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Dietitians can update own profile" ON public.dietitians
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Dietitians can insert own profile" ON public.dietitians
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dietitians_updated_at 
  BEFORE UPDATE ON public.dietitians 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing profiles data to dietitians table
-- This will create a dietitians record for each existing profile
INSERT INTO public.dietitians (auth_user_id, name, email, created_at, updated_at)
SELECT 
  id as auth_user_id,
  name,
  email,
  created_at,
  updated_at
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.dietitians WHERE auth_user_id = profiles.id
);

-- Comment explaining the relationship
COMMENT ON TABLE public.dietitians IS 'Dietitian/Nutritionist profiles that reference auth.users via auth_user_id';
COMMENT ON COLUMN public.dietitians.auth_user_id IS 'References auth.users(id) - the authenticated user for this dietitian';