"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuthNew"
import { formatDate, formatTime } from "@/lib/formatters"
import { supabase, type Client } from "@/lib/supabase"
import {
    MessageCircle,
    MoreHorizontal,
    Phone,
    Plus,
    Search,
    Send,
    Video
} from "lucide-react"
import { useEffect, useState } from "react"

type ClientBasic = Pick<Client, 'id' | 'name' | 'email'>

interface Message {
  id: string
  client_id: string
  dietitian_id: string
  sender_type: 'dietitian' | 'client'
  message: string
  is_read: boolean
  created_at: string
  clients: { name: string; email: string } | null
}

interface MessageThread {
  client: Client
  messages: Message[]
  unread_count: number
  last_message_at: string
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([])
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null)
  const [clients, setClients] = useState<ClientBasic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState("")
  const [newMessageText, setNewMessageText] = useState("")
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all')

  useEffect(() => {
    if (user) {
      fetchMessageThreads()
      fetchClients()
    }
  }, [user])

  const fetchMessageThreads = async () => {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          *,
          clients (id, name, email)
        `)
        .eq("dietitian_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Group messages by client
      const threadMap = new Map<string, MessageThread>()
      
      messages?.forEach((message) => {
        if (!message.clients) return
        
        const clientId = message.client_id
        if (!threadMap.has(clientId)) {
          threadMap.set(clientId, {
            client: message.clients as unknown as Client,
            messages: [],
            unread_count: 0,
            last_message_at: message.created_at
          })
        }
        
        const thread = threadMap.get(clientId)!
        thread.messages.push(message)
        
        if (!message.is_read && message.sender_type === 'client') {
          thread.unread_count++
        }
        
        if (new Date(message.created_at) > new Date(thread.last_message_at)) {
          thread.last_message_at = message.created_at
        }
      })

      // Sort threads by last message date
      const threads = Array.from(threadMap.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      )

      setMessageThreads(threads)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("dietitian_id", user?.id)
        .eq("status", "active")
        .order("name", { ascending: true })

      if (!error) {
        setClients(data || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          client_id: selectedThread.client.id,
          dietitian_id: user?.id,
          sender_type: 'dietitian',
          message: newMessage.trim(),
          is_read: false
        })

      if (error) throw error

      setNewMessage("")
      fetchMessageThreads()
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès."
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive"
      })
    }
  }

  const sendNewMessage = async () => {
    if (!newMessageText.trim() || !selectedClientId) return

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          client_id: selectedClientId,
          dietitian_id: user?.id,
          sender_type: 'dietitian',
          message: newMessageText.trim(),
          is_read: false
        })

      if (error) throw error

      setNewMessageText("")
      setSelectedClientId("")
      setIsNewMessageOpen(false)
      fetchMessageThreads()
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès."
      })
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive"
      })
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId)
        .eq("sender_type", "client")
      
      fetchMessageThreads()
    } catch (error) {
      console.error("Error marking message as read:", error)
    }
  }

  const filteredThreads = messageThreads.filter(thread => {
    const matchesSearch = thread.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         thread.client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && thread.unread_count > 0)
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="px-4 sm:px-6">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
              <div className="h-8 bg-slate-200 rounded w-48"></div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
              <div className="lg:col-span-2 h-96 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Messages"
        subtitle="Communiquez avec vos clients en temps réel"
        action={
          <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle>Nouveau message</DialogTitle>
                <DialogDescription>
                  Envoyer un message à un client
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
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
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Tapez votre message..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={sendNewMessage}>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Message Threads List */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher des conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'starred') => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="unread">Non lus</SelectItem>
                  <SelectItem value="starred">Favoris</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredThreads.length === 0 ? (
                  <Card className="p-6 text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Aucune conversation</h3>
                    <p className="text-slate-600 mb-4">
                      {searchTerm ? "Aucun résultat pour votre recherche." : "Commencez une conversation avec un client."}
                    </p>
                  </Card>
                ) : (
                  filteredThreads.map((thread) => (
                    <Card 
                      key={thread.client.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedThread?.client.id === thread.client.id 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedThread(thread)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={`https://avatar.vercel.sh/${thread.client.email}`} />
                          <AvatarFallback>
                            {thread.client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900 truncate">
                              {thread.client.name}
                            </p>
                            {thread.unread_count > 0 && (
                              <Badge variant="default" className="bg-emerald-600">
                                {thread.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate">
                            {thread.messages[0]?.message || "Aucun message"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(thread.last_message_at)} à {formatTime(thread.last_message_at)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Message Thread Detail */}
          <div className="lg:col-span-2">
            {selectedThread ? (
              <Card className="h-[700px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${selectedThread.client.email}`} />
                        <AvatarFallback>
                          {selectedThread.client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedThread.client.name}</CardTitle>
                        <CardDescription>{selectedThread.client.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedThread.messages
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_type === 'dietitian' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender_type === 'dietitian'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_type === 'dietitian' ? 'text-emerald-100' : 'text-slate-500'
                            }`}>
                              {formatTime(message.created_at)}
                              {!message.is_read && message.sender_type === 'client' && (
                                <span className="ml-2">•</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex items-end gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Tapez votre message..."
                      rows={2}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[700px] flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                  <h3 className="text-xl font-medium text-slate-900 mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-slate-600">
                    Choisissez une conversation dans la liste pour commencer à échanger.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
