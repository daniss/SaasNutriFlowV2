-- Fix RLS policies on clients table to work with the new dietitians relationship
-- The policies need to join with dietitians table to check auth_user_id

-- Drop old policies that were checking auth.uid() = dietitian_id directly
DROP POLICY IF EXISTS "Dietitians can view own clients" ON clients;
DROP POLICY IF EXISTS "Dietitians can insert own clients" ON clients;  
DROP POLICY IF EXISTS "Dietitians can update own clients" ON clients;
DROP POLICY IF EXISTS "Dietitians can delete own clients" ON clients;

-- Create new policies that join with dietitians table
-- These policies work with the new foreign key relationship where 
-- clients.dietitian_id references dietitians.id instead of auth.uid() directly

CREATE POLICY "Dietitians can view own clients" ON clients
    FOR SELECT USING (
        dietitian_id IN (
            SELECT id FROM dietitians WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Dietitians can insert own clients" ON clients
    FOR INSERT WITH CHECK (
        dietitian_id IN (
            SELECT id FROM dietitians WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Dietitians can update own clients" ON clients
    FOR UPDATE USING (
        dietitian_id IN (
            SELECT id FROM dietitians WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Dietitians can delete own clients" ON clients
    FOR DELETE USING (
        dietitian_id IN (
            SELECT id FROM dietitians WHERE auth_user_id = auth.uid()
        )
    );

-- Comment explaining the policy structure
COMMENT ON POLICY "Dietitians can view own clients" ON clients IS 'Uses dietitians table join to verify auth_user_id matches authenticated user';