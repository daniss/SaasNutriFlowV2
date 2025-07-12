-- Create client_accounts table for client portal authentication
CREATE TABLE client_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL, -- Login email (can be different from client.email)
  password_hash TEXT NOT NULL, -- Hashed password for authentication
  is_active BOOLEAN DEFAULT TRUE, -- Enable/disable portal access
  last_login TIMESTAMP WITH TIME ZONE,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE client_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client accounts

-- Clients can only view their own account
CREATE POLICY "Clients can view own account" ON client_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_accounts.client_id 
      AND clients.email = auth.jwt() ->> 'email'
    )
  );

-- Clients can update their own account (for password changes, etc.)
CREATE POLICY "Clients can update own account" ON client_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_accounts.client_id 
      AND clients.email = auth.jwt() ->> 'email'
    )
  );

-- Dietitians can manage client accounts for their clients
CREATE POLICY "Dietitians can manage client accounts" ON client_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_accounts.client_id 
      AND clients.dietitian_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_client_accounts_client_id ON client_accounts(client_id);
CREATE INDEX idx_client_accounts_email ON client_accounts(email);
CREATE INDEX idx_client_accounts_active ON client_accounts(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_client_accounts_updated_at
  BEFORE UPDATE ON client_accounts
  FOR EACH ROW EXECUTE FUNCTION update_client_accounts_updated_at();

-- Add comment to table
COMMENT ON TABLE client_accounts IS 'Authentication accounts for clients to access their portal';
COMMENT ON COLUMN client_accounts.client_id IS 'Reference to the client record';
COMMENT ON COLUMN client_accounts.email IS 'Login email for client portal (can differ from client.email)';
COMMENT ON COLUMN client_accounts.password_hash IS 'Hashed password for client authentication';
COMMENT ON COLUMN client_accounts.is_active IS 'Whether the client account is active and can log in';
