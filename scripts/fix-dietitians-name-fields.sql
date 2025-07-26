-- Fix dietitians table to match the signup trigger expectations
-- The signup trigger expects first_name and last_name fields, but the table only has 'name'

-- Add missing first_name and last_name columns to dietitians table
ALTER TABLE public.dietitians 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Migrate existing 'name' data to first_name (if any data exists)
-- Split existing name into first_name and last_name where possible
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

-- Create a computed column for full name (for backward compatibility)
-- This will concatenate first_name and last_name when name is requested
CREATE OR REPLACE FUNCTION public.get_dietitian_full_name(dietitian_row public.dietitians)
RETURNS TEXT AS $$
BEGIN
  IF dietitian_row.first_name IS NOT NULL OR dietitian_row.last_name IS NOT NULL THEN
    RETURN TRIM(CONCAT(dietitian_row.first_name, ' ', dietitian_row.last_name));
  ELSE
    RETURN dietitian_row.name;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a comment explaining the schema update
COMMENT ON COLUMN public.dietitians.first_name IS 'First name of the dietitian (used by signup trigger)';
COMMENT ON COLUMN public.dietitians.last_name IS 'Last name of the dietitian (used by signup trigger)';
COMMENT ON COLUMN public.dietitians.address IS 'Address of the dietitian (used by signup trigger)';
COMMENT ON COLUMN public.dietitians.name IS 'Legacy full name field - use first_name and last_name for new records';

-- Update any existing RLS policies to work with the new structure
-- Note: The existing policies should continue to work since they use auth_user_id