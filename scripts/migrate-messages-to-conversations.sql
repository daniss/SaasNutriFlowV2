-- Migration script to update messages system to conversation-based model
-- This script will be applied to align with enhanced-schema.sql

-- First, create the conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    dietitian_id UUID NOT NULL,
    subject TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    is_starred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (dietitian_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Add new columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'appointment', 'meal_plan')),
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Migrate existing messages to conversation model
DO $$
DECLARE
    msg RECORD;
    conv_id UUID;
BEGIN
    -- For each unique client-dietitian pair, create a conversation
    FOR msg IN 
        SELECT DISTINCT client_id, dietitian_id, MIN(created_at) as first_message
        FROM messages 
        WHERE conversation_id IS NULL
        GROUP BY client_id, dietitian_id
    LOOP
        -- Create conversation
        INSERT INTO conversations (client_id, dietitian_id, created_at, last_message_at)
        VALUES (msg.client_id, msg.dietitian_id, msg.first_message, msg.first_message)
        RETURNING id INTO conv_id;
        
        -- Update messages to reference this conversation
        UPDATE messages 
        SET conversation_id = conv_id,
            content = message  -- Copy old message to new content field
        WHERE client_id = msg.client_id 
        AND dietitian_id = msg.dietitian_id 
        AND conversation_id IS NULL;
        
        -- Update conversation with latest message time and unread count
        UPDATE conversations 
        SET last_message_at = (
            SELECT MAX(created_at) 
            FROM messages 
            WHERE conversation_id = conv_id
        ),
        unread_count = (
            SELECT COUNT(*) 
            FROM messages 
            WHERE conversation_id = conv_id 
            AND is_read = false 
            AND sender_type = 'client'
        )
        WHERE id = conv_id;
    END LOOP;
END $$;

-- Add foreign key constraint for conversation_id
ALTER TABLE messages 
ADD CONSTRAINT messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_dietitian_id ON conversations(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Dietitians can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = dietitian_id);

CREATE POLICY "Dietitians can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() = dietitian_id);
