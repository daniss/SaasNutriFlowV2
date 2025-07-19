-- Two-Factor Authentication and Security Schema
-- This script adds 2FA and advanced security features

-- User Security Table for 2FA and session management
CREATE TABLE IF NOT EXISTS public.user_security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Two-Factor Authentication (Email-based by default)
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    two_factor_method TEXT DEFAULT 'email' CHECK (two_factor_method IN ('email', 'totp')),
    two_factor_secret TEXT, -- For TOTP method only
    email_verification_code TEXT, -- Current email verification code
    email_code_expires_at TIMESTAMP WITH TIME ZONE,
    email_code_attempts INTEGER DEFAULT 0,
    backup_codes JSONB DEFAULT '[]', -- Encrypted backup codes
    backup_codes_count INTEGER DEFAULT 0,
    last_2fa_used TIMESTAMP WITH TIME ZONE,
    
    -- Session Management
    max_concurrent_sessions INTEGER DEFAULT 3,
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours default
    require_2fa_for_sensitive BOOLEAN DEFAULT TRUE,
    
    -- Device Management
    trusted_devices JSONB DEFAULT '[]',
    device_remember_days INTEGER DEFAULT 30,
    
    -- Security Preferences
    login_notifications BOOLEAN DEFAULT TRUE,
    suspicious_activity_alerts BOOLEAN DEFAULT TRUE,
    password_change_notifications BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active Sessions Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    device_fingerprint TEXT,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    location_data JSONB DEFAULT '{}',
    
    -- Session Status
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Security Flags
    is_trusted_device BOOLEAN DEFAULT FALSE,
    requires_2fa BOOLEAN DEFAULT FALSE,
    two_fa_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events Table for logging
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login', 'logout', 'failed_login', 'password_change',
        '2fa_enabled', '2fa_disabled', '2fa_used', 'backup_code_used',
        'email_2fa_sent', 'email_2fa_verified', 'email_2fa_failed',
        'suspicious_login', 'device_registered', 'session_expired',
        'sessions_revoked', 'security_settings_updated'
    )),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    
    -- Event Details
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    
    -- Geolocation
    country_code TEXT,
    city TEXT,
    timezone TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_security
CREATE POLICY "Users can view their own security settings" ON public.user_security
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own security settings" ON public.user_security
    FOR ALL
    USING (user_id = auth.uid());

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
    FOR ALL
    USING (user_id = auth.uid());

-- RLS Policies for security_events
CREATE POLICY "Users can view their own security events" ON public.security_events
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all security events
CREATE POLICY "Admins can view all security events" ON public.security_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON public.user_security(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT 'info',
    p_metadata JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.security_events (
        user_id, event_type, description, severity, metadata,
        ip_address, user_agent, device_fingerprint
    ) VALUES (
        p_user_id, p_event_type, p_description, p_severity, p_metadata,
        p_ip_address, p_user_agent, p_device_fingerprint
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW() OR (is_active = false AND updated_at < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Function to check if user has exceeded max concurrent sessions
CREATE OR REPLACE FUNCTION check_session_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_sessions INTEGER;
    max_sessions INTEGER;
BEGIN
    -- Get user's max session limit
    SELECT COALESCE(max_concurrent_sessions, 3) INTO max_sessions
    FROM public.user_security 
    WHERE user_id = p_user_id;
    
    -- Count active sessions
    SELECT COUNT(*) INTO current_sessions
    FROM public.user_sessions 
    WHERE user_id = p_user_id 
    AND is_active = true 
    AND expires_at > NOW();
    
    RETURN current_sessions < max_sessions;
END;
$$;

-- Function to generate email 2FA code
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
    
    -- Log the event
    PERFORM log_security_event(
        p_user_id, 
        'email_2fa_sent', 
        'Email 2FA code generated and sent',
        'info'
    );
    
    RETURN verification_code;
END;
$$;

-- Function to verify email 2FA code
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
        PERFORM log_security_event(
            p_user_id, 
            'email_2fa_failed', 
            'Email 2FA code expired or not found',
            'warning'
        );
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
        
        PERFORM log_security_event(
            p_user_id, 
            'email_2fa_failed', 
            'Email 2FA max attempts exceeded',
            'warning'
        );
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
        
        PERFORM log_security_event(
            p_user_id, 
            'email_2fa_verified', 
            'Email 2FA code successfully verified',
            'info'
        );
        RETURN TRUE;
    ELSE
        PERFORM log_security_event(
            p_user_id, 
            'email_2fa_failed', 
            'Email 2FA code verification failed',
            'warning'
        );
        RETURN FALSE;
    END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION check_session_limit TO authenticated;
GRANT EXECUTE ON FUNCTION generate_email_2fa_code TO authenticated;
GRANT EXECUTE ON FUNCTION verify_email_2fa_code TO authenticated;

-- Initialize user_security for existing users
INSERT INTO public.user_security (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_security)
ON CONFLICT (user_id) DO NOTHING;
