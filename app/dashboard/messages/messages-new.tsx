"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthNew";
import { formatDate, formatTime } from "@/lib/formatters";
import {
  supabase,
  type Client,
  type Conversation,
  type Message,
} from "@/lib/supabase";
import {
  Archive,
  MessageCircle,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Star,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";

type ClientBasic = Pick<Client, "id" | "name" | "email">;

interface ConversationWithClient extends Conversation {
  client: ClientBasic;
  messages: Message[];
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithClient[]>(
    []
  );
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithClient | null>(null);
  const [clients, setClients] = useState<ClientBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newMessageText, setNewMessageText] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchClients();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data: conversationsData, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          client:clients!conversations_client_id_fkey (id, name, email),
          messages (*)
        `
        )
        .eq("dietitian_id", user?.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      const formattedConversations =
        conversationsData?.map((conv) => ({
          ...conv,
          client: conv.client as ClientBasic,
          messages: (conv.messages as Message[]) || [],
        })) || [];

      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("dietitian_id", user?.id);

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversation.id,
          client_id: selectedConversation.client_id,
          dietitian_id: user?.id!,
          sender_type: "dietitian",
          message: newMessage,
          content: newMessage,
          message_type: "text",
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedConversation.id);

      // Update local state
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, messageData],
            }
          : null
      );

      setNewMessage("");

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });

      // Refresh conversations
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const startNewConversation = async () => {
    if (!selectedClientId || !newMessageText.trim()) return;

    try {
      // Create new conversation
      const { data: conversationData, error: convError } = await supabase
        .from("conversations")
        .insert({
          client_id: selectedClientId,
          dietitian_id: user?.id!,
          subject: `Nouvelle conversation`,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;

      // Send first message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationData.id,
          client_id: selectedClientId,
          dietitian_id: user?.id!,
          sender_type: "dietitian",
          message: newMessageText,
          content: newMessageText,
          message_type: "text",
        })
        .select()
        .single();

      if (messageError) throw messageError;

      setIsNewMessageOpen(false);
      setSelectedClientId("");
      setNewMessageText("");

      toast({
        title: "Conversation créée",
        description: "Nouvelle conversation démarrée avec succès",
      });

      // Refresh conversations
      fetchConversations();
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
    }
  };

  const toggleStarred = async (conversationId: string, isStarred: boolean) => {
    try {
      await supabase
        .from("conversations")
        .update({ is_starred: !isStarred })
        .eq("id", conversationId);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, is_starred: !isStarred }
            : conv
        )
      );

      toast({
        title: isStarred ? "Retiré des favoris" : "Ajouté aux favoris",
        description: "Conversation mise à jour",
      });
    } catch (error) {
      console.error("Error toggling starred:", error);
    }
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      await supabase
        .from("conversations")
        .update({ status: "archived" })
        .eq("id", conversationId);

      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }

      toast({
        title: "Conversation archivée",
        description: "La conversation a été archivée",
      });
    } catch (error) {
      console.error("Error archiving conversation:", error);
    }
  };

  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch =
      conversation.client.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      conversation.subject?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "unread")
      return matchesSearch && (conversation.unread_count || 0) > 0;
    if (filter === "starred") return matchesSearch && conversation.is_starred;
    return matchesSearch && conversation.status === "active";
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Messages"
        subtitle="Gérez vos conversations avec les clients"
        action={
          <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau message</DialogTitle>
                <DialogDescription>
                  Commencez une nouvelle conversation avec un client
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tapez votre message..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNewMessageOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={startNewConversation}>Envoyer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={filter}
                    onValueChange={(value: any) => setFilter(value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="unread">Non lues</SelectItem>
                      <SelectItem value="starred">Favoris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-4 pt-0">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {conversation.client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {conversation.client.name}
                            </p>
                            {conversation.is_starred && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.subject || "Conversation générale"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {conversation.last_message_at ? formatDate(conversation.last_message_at) : "Pas de date"}
                        </p>
                        {(conversation.unread_count || 0) > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {selectedConversation.client.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConversation.client.name}
                      </CardTitle>
                      <CardDescription>
                        {selectedConversation.client.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleStarred(
                          selectedConversation.id,
                          selectedConversation.is_starred || false
                        )
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${
                          selectedConversation.is_starred
                            ? "text-yellow-500 fill-yellow-500"
                            : ""
                        }`}
                      />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        archiveConversation(selectedConversation.id)
                      }
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages
                    .sort(
                      (a, b) =>
                        new Date(a.created_at || '').getTime() -
                        new Date(b.created_at || '').getTime()
                    )
                    .map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_type === "dietitian"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_type === "dietitian"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">
                            {message.content || message.message}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_type === "dietitian"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {message.created_at ? formatTime(message.created_at) : "Pas d'heure"}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionner une conversation
                </h3>
                <p className="text-gray-500">
                  Choisissez une conversation pour commencer à échanger avec vos
                  clients
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
