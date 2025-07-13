import { validateClientAuth } from "@/lib/client-auth-security";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX: Use secure client authentication
    const authResult = await validateClientAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { clientId } = authResult;

    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    // Use service role to send message
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // First, get or create conversation
    const { data: client } = await supabase
      .from("clients")
      .select("dietitian_id")
      .eq("id", clientId)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    // Check if conversation exists
    let { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("client_id", clientId)
      .eq("dietitian_id", client.dietitian_id)
      .single();

    // Create conversation if it doesn't exist
    if (!conversation) {
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          client_id: clientId,
          dietitian_id: client.dietitian_id,
          subject: "Messages avec le client",
          status: "active",
        })
        .select("id")
        .single();

      if (convError) {
        throw convError;
      }
      conversation = newConversation;
    }

    // Insert the message with both client_id and conversation_id
    const { data: newMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        client_id: clientId,
        dietitian_id: client.dietitian_id,
        conversation_id: conversation.id,
        sender_type: "client",
        content: message,
        message_type: "text",
        message: message, // Also set the old message column for compatibility
      })
      .select("*")
      .single();

    if (messageError) {
      throw messageError;
    }

    // Update conversation last_message_at and increment unread count
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    // Increment unread count using RPC
    await supabase.rpc("increment_unread_count", {
      conversation_id: conversation.id,
    });

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        content: newMessage.content,
        sender: newMessage.sender_type,
        timestamp: newMessage.created_at,
        read: false,
      },
    });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
