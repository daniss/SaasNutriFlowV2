-- Audit Log Table for tracking all user activities
-- This provides comprehensive logging for security and compliance

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_type TEXT NOT NULL DEFAULT 'dietitian', -- 'dietitian', 'client', 'admin'
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout', 'export', etc.
    resource_type TEXT NOT NULL, -- 'client', 'meal_plan', 'invoice', 'document', 'message', etc.
    resource_id TEXT, -- ID of the affected resource
    details JSONB, -- Additional details about the action
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing for performance
    INDEX idx_audit_logs_user_id ON audit_logs(user_id),
    INDEX idx_audit_logs_created_at ON audit_logs(created_at),
    INDEX idx_audit_logs_action ON audit_logs(action),
    INDEX idx_audit_logs_resource_type ON audit_logs(resource_type),
    INDEX idx_audit_logs_user_type ON audit_logs(user_type)
);

-- Enable RLS for audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert audit logs (for server-side logging)
CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- RLS Policy: No updates or deletes (audit logs are immutable)
CREATE POLICY "No updates allowed on audit logs" ON public.audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "No deletes allowed on audit logs" ON public.audit_logs
    FOR DELETE
    USING (false);

-- Function to automatically log actions
CREATE OR REPLACE FUNCTION log_audit_action(
    p_user_id UUID,
    p_user_email TEXT,
    p_user_type TEXT,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        user_type,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        p_user_id,
        p_user_email,
        p_user_type,
        p_action,
        p_resource_type,
        p_resource_id,
        p_details,
        p_ip_address,
        p_user_agent,
        p_session_id
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_audit_action TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_action TO service_role;
