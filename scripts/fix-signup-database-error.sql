-- Complete fix for signup database error
-- Issue: Database trigger expects columns that don't exist in dietitians table
-- and uses wrong field names for accessing user metadata

-- Step 1: Add missing columns to dietitians table (required by signup trigger)
ALTER TABLE public.dietitians 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Step 2: Migrate existing 'name' data to first_name/last_name if any exists
UPDATE public.dietitians 
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND TRIM(name) != '' THEN 
      CASE 
        WHEN POSITION(' ' IN TRIM(name)) > 0 THEN 
          TRIM(SUBSTRING(name FROM 1 FOR POSITION(' ' IN TRIM(name)) - 1))
        ELSE 
          TRIM(name)
      END
    ELSE NULL
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND TRIM(name) != '' AND POSITION(' ' IN TRIM(name)) > 0 THEN 
      TRIM(SUBSTRING(name FROM POSITION(' ' IN TRIM(name)) + 1))
    ELSE NULL
  END
WHERE (first_name IS NULL OR last_name IS NULL) AND name IS NOT NULL;

-- Step 3: Update the signup trigger with correct field names and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile record (this should work fine)
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Create dietitian record with proper error handling
  BEGIN
    INSERT INTO public.dietitians (
      auth_user_id,
      email,
      first_name,
      last_name,
      phone,
      address,
      subscription_status,
      subscription_plan,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',   -- Use snake_case (matches signup form)
      NEW.raw_user_meta_data->>'last_name',    -- Use snake_case (matches signup form)
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'address',
      'free',
      'free',
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the signup
      RAISE WARNING 'Failed to create dietitian record for user %: %', NEW.id, SQLERRM;
      -- Still return NEW to allow the auth user creation to succeed
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure the trigger exists (it should already exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Add helpful comments
COMMENT ON COLUMN public.dietitians.first_name IS 'First name from signup form (first_name field)';
COMMENT ON COLUMN public.dietitians.last_name IS 'Last name from signup form (last_name field)';
COMMENT ON COLUMN public.dietitians.address IS 'Address from signup form (optional)';

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.dietitians TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.dietitians TO authenticated;

-- Verification queries (for debugging)
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'dietitians' AND table_schema = 'public'
-- ORDER BY ordinal_position;