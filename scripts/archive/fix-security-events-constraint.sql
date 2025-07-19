-- Fix security_events constraint to include email 2FA events
-- Run this to fix the constraint error

-- Drop the existing constraint
ALTER TABLE public.security_events DROP CONSTRAINT IF EXISTS security_events_event_type_check;

-- Add the new constraint with email 2FA events
ALTER TABLE public.security_events 
ADD CONSTRAINT security_events_event_type_check 
CHECK (event_type IN (
    'login', 
    'logout', 
    'failed_login', 
    'password_change',
    '2fa_enabled', 
    '2fa_disabled', 
    '2fa_used', 
    'backup_code_used',
    'email_2fa_sent', 
    'email_2fa_verified', 
    'email_2fa_failed',
    'suspicious_login', 
    'device_registered', 
    'session_expired',
    'sessions_revoked', 
    'security_settings_updated'
));

-- Verify the constraint is working
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'security_events_event_type_check';
