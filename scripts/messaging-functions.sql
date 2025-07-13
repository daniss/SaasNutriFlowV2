-- Messaging Functions for Real-time Client Portal
-- Functions to support client messaging functionality

-- Function to increment unread count for a conversation
CREATE OR REPLACE FUNCTION increment_unread_count(conversation_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE conversations 
    SET unread_count = unread_count + 1,
        updated_at = NOW()
    WHERE id = conversation_id
    RETURNING unread_count INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(conversation_id UUID, reader_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Mark unread messages as read
    UPDATE messages 
    SET read_at = NOW(),
        updated_at = NOW()
    WHERE conversation_id = mark_messages_read.conversation_id
    AND read_at IS NULL
    AND sender_type != reader_type;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    -- Reset unread count to 0
    UPDATE conversations 
    SET unread_count = 0,
        updated_at = NOW()
    WHERE id = mark_messages_read.conversation_id;
    
    RETURN affected_count;
END;
$$;

-- Function to get conversation for client
CREATE OR REPLACE FUNCTION get_client_conversation(client_id UUID)
RETURNS TABLE(
    conversation_id UUID,
    dietitian_id UUID,
    subject TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.dietitian_id,
        c.subject,
        c.last_message_at,
        c.unread_count
    FROM conversations c
    WHERE c.client_id = get_client_conversation.client_id
    AND c.status = 'active'
    ORDER BY c.last_message_at DESC
    LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_unread_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_conversation TO authenticated;

-- Enable RLS on conversations and messages if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy for conversations - clients can only see their own
CREATE POLICY IF NOT EXISTS "Clients can view their conversations" ON conversations
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE id = auth.uid()
        )
        OR dietitian_id = auth.uid()
    );

-- RLS Policy for messages - based on conversation access
CREATE POLICY IF NOT EXISTS "Users can view messages in their conversations" ON messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE client_id IN (SELECT id FROM clients WHERE id = auth.uid())
            OR dietitian_id = auth.uid()
        )
    );

-- RLS Policy for inserting messages
CREATE POLICY IF NOT EXISTS "Users can insert messages in their conversations" ON messages
    FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE client_id IN (SELECT id FROM clients WHERE id = auth.uid())
            OR dietitian_id = auth.uid()
        )
    );
