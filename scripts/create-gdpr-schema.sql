-- GDPR Compliance Schema
-- Adds tables and functions for GDPR/data compliance

-- Create consent management table
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'data_processing', 'marketing', 'photos', 'sharing'
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  version TEXT NOT NULL DEFAULT '1.0', -- consent version for tracking changes
  purpose TEXT, -- specific purpose of consent
  legal_basis TEXT, -- GDPR legal basis (consent, contract, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data_category TEXT NOT NULL, -- 'client_data', 'messages', 'photos', 'documents', etc.
  retention_period_years INTEGER NOT NULL DEFAULT 7,
  auto_delete BOOLEAN DEFAULT false,
  description TEXT,
  legal_requirement TEXT, -- reference to legal requirement
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL, -- 'client' or 'dietitian'
  request_type TEXT NOT NULL, -- 'export', 'portability', 'deletion'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  download_url TEXT, -- encrypted URL for download
  expires_at TIMESTAMP WITH TIME ZONE, -- download link expiry
  file_size_bytes BIGINT,
  notes TEXT
);

-- Create data anonymization log
CREATE TABLE IF NOT EXISTS data_anonymization_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID, -- may be null after anonymization
  original_client_id UUID, -- keep original reference
  anonymized_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  anonymization_type TEXT NOT NULL, -- 'partial', 'full', 'pseudonymization'
  affected_tables TEXT[], -- list of tables that were anonymized
  retention_reason TEXT, -- why data was retained (legal, research, etc.)
  performed_by UUID REFERENCES profiles(id)
);

-- Create privacy policy versions table
CREATE TABLE IF NOT EXISTS privacy_policy_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
  effective_until TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create privacy policy acceptances table
CREATE TABLE IF NOT EXISTS privacy_policy_acceptances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  policy_version_id UUID REFERENCES privacy_policy_versions(id),
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  acceptance_method TEXT -- 'registration', 'explicit', 'renewal'
);

-- Add RLS policies
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_anonymization_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_policy_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS policies for consent_records
CREATE POLICY "Dietitians can manage consent records for their clients" ON consent_records
  FOR ALL USING (dietitian_id = auth.uid());

-- RLS policies for data_retention_policies
CREATE POLICY "Dietitians can manage their retention policies" ON data_retention_policies
  FOR ALL USING (dietitian_id = auth.uid());

-- RLS policies for data_export_requests
CREATE POLICY "Dietitians can manage export requests for their clients" ON data_export_requests
  FOR ALL USING (dietitian_id = auth.uid());

-- RLS policies for data_anonymization_log
CREATE POLICY "Dietitians can view anonymization logs for their data" ON data_anonymization_log
  FOR SELECT USING (dietitian_id = auth.uid());

-- RLS policies for privacy_policy_acceptances
CREATE POLICY "Dietitians can view acceptances for their clients" ON privacy_policy_acceptances
  FOR SELECT USING (dietitian_id = auth.uid());

-- Function to check if data retention period has expired
CREATE OR REPLACE FUNCTION check_data_retention(
  p_dietitian_id UUID,
  p_data_category TEXT,
  p_created_at TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
  retention_years INTEGER;
BEGIN
  SELECT retention_period_years INTO retention_years
  FROM data_retention_policies 
  WHERE dietitian_id = p_dietitian_id 
    AND data_category = p_data_category
  LIMIT 1;
  
  IF retention_years IS NULL THEN
    retention_years := 7; -- Default retention period
  END IF;
  
  RETURN p_created_at < now() - (retention_years || ' years')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to anonymize client data
CREATE OR REPLACE FUNCTION anonymize_client_data(
  p_client_id UUID,
  p_dietitian_id UUID,
  p_anonymization_type TEXT DEFAULT 'full'
) RETURNS UUID AS $$
DECLARE
  anonymization_id UUID;
  affected_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Create anonymization log entry
  INSERT INTO data_anonymization_log (
    dietitian_id, 
    original_client_id, 
    anonymization_type,
    performed_by
  ) VALUES (
    p_dietitian_id, 
    p_client_id, 
    p_anonymization_type,
    auth.uid()
  ) RETURNING id INTO anonymization_id;
  
  IF p_anonymization_type = 'full' THEN
    -- Full anonymization - replace with generic data
    UPDATE clients SET
      first_name = 'Client',
      last_name = 'Anonymisé',
      email = 'anonyme-' || substr(gen_random_uuid()::text, 1, 8) || '@anonyme.local',
      phone = NULL,
      address = NULL,
      date_of_birth = NULL,
      notes = '[Données anonymisées]'
    WHERE id = p_client_id AND dietitian_id = p_dietitian_id;
    
    affected_tables := array_append(affected_tables, 'clients');
    
    -- Anonymize messages
    UPDATE messages SET
      content = '[Message anonymisé]'
    WHERE client_id = p_client_id;
    
    affected_tables := array_append(affected_tables, 'messages');
    
  ELSIF p_anonymization_type = 'partial' THEN
    -- Partial anonymization - keep clinical data, remove personal identifiers
    UPDATE clients SET
      email = 'anonyme-' || substr(gen_random_uuid()::text, 1, 8) || '@anonyme.local',
      phone = NULL,
      address = NULL
    WHERE id = p_client_id AND dietitian_id = p_dietitian_id;
    
    affected_tables := array_append(affected_tables, 'clients');
  END IF;
  
  -- Update anonymization log with affected tables
  UPDATE data_anonymization_log 
  SET affected_tables = affected_tables
  WHERE id = anonymization_id;
  
  RETURN anonymization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate data export
CREATE OR REPLACE FUNCTION create_data_export_request(
  p_dietitian_id UUID,
  p_client_id UUID,
  p_request_type TEXT DEFAULT 'export'
) RETURNS UUID AS $$
DECLARE
  request_id UUID;
BEGIN
  INSERT INTO data_export_requests (
    dietitian_id,
    client_id,
    requested_by,
    request_type,
    expires_at
  ) VALUES (
    p_dietitian_id,
    p_client_id,
    'dietitian',
    p_request_type,
    now() + INTERVAL '7 days' -- Download expires in 7 days
  ) RETURNING id INTO request_id;
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default retention policies
INSERT INTO data_retention_policies (dietitian_id, data_category, retention_period_years, description) 
SELECT 
  id as dietitian_id,
  unnest(ARRAY['client_data', 'messages', 'documents', 'photos', 'meal_plans', 'appointments']) as data_category,
  7 as retention_period_years,
  'Politique de rétention par défaut conforme aux exigences légales' as description
FROM profiles
ON CONFLICT DO NOTHING;

-- Insert current privacy policy version
INSERT INTO privacy_policy_versions (version, content, effective_from, is_current)
VALUES (
  '1.0',
  'Politique de confidentialité NutriFlow - Version initiale',
  now(),
  true
) ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consent_records_client_type ON consent_records(client_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_dietitian ON consent_records(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_anonymization_log_client ON data_anonymization_log(original_client_id);
CREATE INDEX IF NOT EXISTS idx_privacy_acceptances_client ON privacy_policy_acceptances(client_id);
