-- Migration script to add 2FA email functionality to existing user_security table
-- Run this if you get column errors

-- First, add the missing columns to existing table
DO $$ 
BEGIN 
    -- Add two_factor_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_security' AND column_name = 'two_factor_method') THEN
        ALTER TABLE public.user_security 
        ADD COLUMN two_factor_method TEXT DEFAULT 'email' CHECK (two_factor_method IN ('email', 'totp'));
    END IF;

    -- Add email verification columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_security' AND column_name = 'email_verification_code') THEN
        ALTER TABLE public.user_security 
        ADD COLUMN email_verification_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_security' AND column_name = 'email_code_expires_at') THEN
        ALTER TABLE public.user_security 
        ADD COLUMN email_code_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_security' AND column_name = 'email_code_attempts') THEN
        ALTER TABLE public.user_security 
        ADD COLUMN email_code_attempts INTEGER DEFAULT 0;
    END IF;

    -- Update two_factor_enabled to default TRUE if it's not already
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_security' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE public.user_security 
        ALTER COLUMN two_factor_enabled SET DEFAULT TRUE;
        
        -- Update existing rows to enable 2FA by default
        UPDATE public.user_security 
        SET two_factor_enabled = TRUE, two_factor_method = 'email'
        WHERE two_factor_enabled IS NULL OR two_factor_enabled = FALSE;
    END IF;
END $$;

-- Add the functions if they don't exist
CREATE OR REPLACE FUNCTION generate_email_2fa_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    verification_code TEXT;
BEGIN
    -- Generate 6-digit code
    verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Update user security with new code
    UPDATE public.user_security 
    SET 
        email_verification_code = verification_code,
        email_code_expires_at = NOW() + INTERVAL '10 minutes',
        email_code_attempts = 0,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log the event if log function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_security_event') THEN
        PERFORM log_security_event(
            p_user_id, 
            'email_2fa_sent', 
            'Email 2FA code generated and sent',
            'info'
        );
    END IF;
    
    RETURN verification_code;
END;
$$;

CREATE OR REPLACE FUNCTION verify_email_2fa_code(
    p_user_id UUID, 
    p_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_code TEXT;
    code_expires TIMESTAMP WITH TIME ZONE;
    attempts INTEGER;
    max_attempts INTEGER := 3;
BEGIN
    -- Get stored verification data
    SELECT 
        email_verification_code, 
        email_code_expires_at, 
        email_code_attempts 
    INTO stored_code, code_expires, attempts
    FROM public.user_security 
    WHERE user_id = p_user_id;
    
    -- Check if code exists and hasn't expired
    IF stored_code IS NULL OR code_expires < NOW() THEN
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_security_event') THEN
            PERFORM log_security_event(
                p_user_id, 
                'email_2fa_failed', 
                'Email 2FA code expired or not found',
                'warning'
            );
        END IF;
        RETURN FALSE;
    END IF;
    
    -- Increment attempts
    UPDATE public.user_security 
    SET email_code_attempts = email_code_attempts + 1
    WHERE user_id = p_user_id;
    
    -- Check max attempts
    IF attempts >= max_attempts THEN
        -- Clear the code after max attempts
        UPDATE public.user_security 
        SET 
            email_verification_code = NULL,
            email_code_expires_at = NULL,
            email_code_attempts = 0
        WHERE user_id = p_user_id;
        
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_security_event') THEN
            PERFORM log_security_event(
                p_user_id, 
                'email_2fa_failed', 
                'Email 2FA max attempts exceeded',
                'warning'
            );
        END IF;
        RETURN FALSE;
    END IF;
    
    -- Verify code
    IF stored_code = p_code THEN
        -- Clear the code after successful verification
        UPDATE public.user_security 
        SET 
            email_verification_code = NULL,
            email_code_expires_at = NULL,
            email_code_attempts = 0,
            last_2fa_used = NOW()
        WHERE user_id = p_user_id;
        
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_security_event') THEN
            PERFORM log_security_event(
                p_user_id, 
                'email_2fa_verified', 
                'Email 2FA code successfully verified',
                'info'
            );
        END IF;
        RETURN TRUE;
    ELSE
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_security_event') THEN
            PERFORM log_security_event(
                p_user_id, 
                'email_2fa_failed', 
                'Email 2FA code verification failed',
                'warning'
            );
        END IF;
        RETURN FALSE;
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_email_2fa_code TO authenticated;
GRANT EXECUTE ON FUNCTION verify_email_2fa_code TO authenticated;

-- Ensure all existing users have 2FA settings
INSERT INTO public.user_security (user_id, two_factor_enabled, two_factor_method)
SELECT id, true, 'email' FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_security WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET 
    two_factor_enabled = true,
    two_factor_method = 'email';
