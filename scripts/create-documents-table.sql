-- Create documents table for file uploads
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    dietitian_id UUID NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'blood_test', 'prescription', 'photo', 'report', 'meal_plan', 'exercise_plan')),
    description TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_visible_to_client BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_dietitian_id ON documents(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Dietitians can view own client documents" ON documents
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert documents for own clients" ON documents
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own client documents" ON documents
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own client documents" ON documents
  FOR DELETE USING (auth.uid() = dietitian_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own documents"  
ON storage.objects FOR DELETE
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
