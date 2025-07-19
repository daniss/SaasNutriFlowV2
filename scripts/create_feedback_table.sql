-- Create enums for feedback
CREATE TYPE feedback_category AS ENUM ('bug', 'suggestion', 'feature_request', 'question');
CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved', 'closed');

-- Create feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dietitian_id UUID NOT NULL REFERENCES dietitians(id) ON DELETE CASCADE,
  category feedback_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority feedback_priority DEFAULT 'medium',
  status feedback_status DEFAULT 'new',
  contact_email TEXT,
  page_url TEXT,
  user_agent TEXT,
  attachments TEXT[], -- URLs to Supabase Storage files
  admin_notes TEXT, -- Internal notes for support team
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_feedback_dietitian_id ON feedback(dietitian_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_priority ON feedback(priority);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view and manage their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (dietitian_id = auth.uid());

CREATE POLICY "Users can create their own feedback" ON feedback
  FOR INSERT WITH CHECK (dietitian_id = auth.uid());

CREATE POLICY "Users can update their own feedback" ON feedback
  FOR UPDATE USING (dietitian_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON feedback TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;