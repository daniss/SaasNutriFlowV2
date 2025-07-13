"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  content: string;
  sender: "client" | "dietitian";
  timestamp: string;
  read: boolean;
}

interface ClientMessagesProps {
  clientId: string;
  initialMessages: Message[];
}

export function ClientMessages({
  clientId,
  initialMessages,
}: ClientMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!clientId) return;

    // Subscribe to real-time updates for messages
    const channel = supabase
      .channel("client-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Check if this message belongs to our client's conversation
          const { data: conversation } = await supabase
            .from("conversations")
            .select("client_id")
            .eq("id", newMsg.conversation_id)
            .single();

          if (conversation?.client_id === clientId) {
            const message: Message = {
              id: newMsg.id,
              content: newMsg.content,
              sender: newMsg.sender_type,
              timestamp: newMsg.created_at,
              read: !!newMsg.read_at,
            };

            // Only add if it's not already in the list (avoid duplicates)
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === message.id);
              if (exists) return prev;
              return [...prev, message];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, supabase]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/client-auth/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          clientId,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Message will be added via real-time subscription
          setNewMessage("");
          toast({
            title: "Message envoyé",
            description: "Votre message a été envoyé à votre diététicien.",
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error("Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <CardTitle className="text-xl text-purple-800 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages avec votre diététicien
        </CardTitle>
        <CardDescription className="text-purple-600">
          Échangez avec votre professionnel de santé
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "client" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-lg shadow-sm ${
                  message.sender === "client"
                    ? "bg-emerald-500 text-white"
                    : "bg-white border border-gray-200 text-gray-900"
                }`}
              >
                <p className="mb-2">{message.content}</p>
                <p
                  className={`text-xs ${
                    message.sender === "client"
                      ? "text-emerald-100"
                      : "text-gray-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Aucun message</h3>
              <p>Commencez une conversation avec votre diététicien.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-3">
          <Textarea
            placeholder="Écrivez votre message..."
            className="flex-1 resize-none"
            rows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
