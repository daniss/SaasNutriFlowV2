-- Fix the foreign key relationship between clients and dietitians
-- The clients table was referencing profiles.id instead of dietitians.id
-- This migration fixes the relationship to work with the new dietitians table

-- Step 1: Drop the existing foreign key constraint to profiles
ALTER TABLE clients DROP CONSTRAINT clients_dietitian_id_fkey;

-- Step 2: Update clients.dietitian_id to reference dietitians.id instead of auth_user_id
UPDATE clients 
SET dietitian_id = d.id
FROM dietitians d
WHERE clients.dietitian_id = d.auth_user_id;

-- Step 3: Add proper foreign key constraint to dietitians table
ALTER TABLE clients 
ADD CONSTRAINT clients_dietitian_id_fkey 
FOREIGN KEY (dietitian_id) REFERENCES dietitians(id) ON DELETE CASCADE;

-- Comment explaining the fix
COMMENT ON CONSTRAINT clients_dietitian_id_fkey ON clients IS 'References dietitians.id instead of profiles.id for proper multi-tenant isolation';