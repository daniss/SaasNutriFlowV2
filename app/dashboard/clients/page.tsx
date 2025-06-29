"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  Target,
  TrendingUp,
  Activity,
  Filter,
  MoreHorizontal,
  Heart,
  Scale,
  ChevronRight
} from "lucide-react"
import { useAuthContext } from "@/components/auth/AuthProvider"
import { supabase, type Client } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard-header"
import Link from "next/link"

export default function ClientsPage() {
  const { user } = useAuthContext()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    age: "",
    height: "",
    current_weight: "",
    goal_weight: "",
    goal: "",
    plan_type: "",
    notes: "",
  })

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  const fetchClients = async () => {
    if (!user) return

    try {
      console.log("👥 Fetching clients for user:", user.id)
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("dietitian_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching clients:", error)
        return
      }

      console.log("✅ Clients fetched:", data?.length || 0)
      setClients(data || [])
    } catch (error) {
      console.error("❌ Unexpected error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async () => {
    if (!user) return

    try {
      const clientData = {
        dietitian_id: user.id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone || null,
        address: newClient.address || null,
        age: newClient.age ? Number.parseInt(newClient.age) : null,
        height: newClient.height || null,
        current_weight: newClient.current_weight ? Number.parseFloat(newClient.current_weight) : null,
        goal_weight: newClient.goal_weight ? Number.parseFloat(newClient.goal_weight) : null,
        goal: newClient.goal,
        plan_type: newClient.plan_type,
        status: "active",
        tags: [],
        notes: newClient.notes || null,
        emergency_contact: null,
        join_date: new Date().toISOString().split("T")[0],
        last_session: null,
        next_appointment: null,
        progress_percentage: 0,
      }

      console.log("➕ Adding new client:", clientData)

      const { data, error } = await supabase.from("clients").insert(clientData).select().single()

      if (error) {
        console.error("❌ Error adding client:", error)
        return
      }

      console.log("✅ Client added successfully:", data)
      setClients([data, ...clients])
      setIsAddDialogOpen(false)
      setNewClient({
        name: "",
        email: "",
        phone: "",
        address: "",
        age: "",
        height: "",
        current_weight: "",
        goal_weight: "",
        goal: "",
        plan_type: "",
        notes: "",
      })
    } catch (error) {
      console.error("❌ Unexpected error adding client:", error)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-6 lg:p-8 bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 min-h-screen">
        {/* Header Skeleton */}
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-48 animate-pulse" />
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-64 animate-pulse" />
            </div>
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-32 animate-pulse" />
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-slide-up animate-delay-100">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-20 animate-pulse" />
                        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-16 animate-pulse" />
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse" />
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="flex items-center gap-4 animate-slide-up animate-delay-200">
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl flex-1 max-w-md animate-pulse" />
          <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-24 animate-pulse" />
        </div>

        {/* Client Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up animate-delay-300">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 shadow-soft bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-32 animate-pulse" />
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-40 animate-pulse" />
                    </div>
                    <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-16 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-full animate-pulse" />
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse" />
                    <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-full animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Client Management"
        subtitle="Manage and track your clients' nutrition journeys"
        searchPlaceholder="Search clients..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium">
                <Plus className="mr-2 h-4 w-4" />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto shadow-soft-lg border-0">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold text-gray-900">Add New Client</DialogTitle>
                <DialogDescription className="text-gray-600 leading-relaxed">
                  Create a new client profile to start managing their nutrition journey.
                </DialogDescription>
              </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name *</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="John Doe"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="john@example.com"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone</Label>
                  <Input
                    id="phone"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-semibold text-gray-700">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={newClient.age}
                    onChange={(e) => setNewClient({ ...newClient, age: e.target.value })}
                    placeholder="30"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Address</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                  className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-sm font-semibold text-gray-700">Height</Label>
                  <Input
                    id="height"
                    value={newClient.height}
                    onChange={(e) => setNewClient({ ...newClient, height: e.target.value })}
                    placeholder="5'8&quot;"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_weight" className="text-sm font-semibold text-gray-700">Current Weight (lbs)</Label>
                  <Input
                    id="current_weight"
                    type="number"
                    value={newClient.current_weight}
                    onChange={(e) => setNewClient({ ...newClient, current_weight: e.target.value })}
                    placeholder="150"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal_weight" className="text-sm font-semibold text-gray-700">Goal Weight (lbs)</Label>
                  <Input
                    id="goal_weight"
                    type="number"
                    value={newClient.goal_weight}
                    onChange={(e) => setNewClient({ ...newClient, goal_weight: e.target.value })}
                    placeholder="140"
                    className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal" className="text-sm font-semibold text-gray-700">Primary Goal</Label>
                  <Select value={newClient.goal} onValueChange={(value: string) => setNewClient({ ...newClient, goal: value })}>
                    <SelectTrigger className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20">
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="weight_gain">Weight Gain</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="health_improvement">Health Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan_type" className="text-sm font-semibold text-gray-700">Plan Type</Label>
                  <Select
                    value={newClient.plan_type}
                    onValueChange={(value: string) => setNewClient({ ...newClient, plan_type: value })}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Notes</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Any additional notes about the client..."
                  rows={3}
                  className="border-gray-200 focus:border-emerald-300 focus:ring-emerald-500/20 resize-none"
                />
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-gray-200 hover:bg-gray-50">
                Cancel
              </Button>
              <Button 
                onClick={handleAddClient} 
                disabled={!newClient.name || !newClient.email}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft disabled:opacity-50 font-medium"
              >
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      <div className="px-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-slide-up animate-delay-100">
        <Card className="border-0 shadow-soft hover:shadow-soft-lg bg-gradient-to-br from-emerald-50/90 to-emerald-100/60 hover:from-emerald-50 hover:to-emerald-100/80 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-emerald-700 text-sm font-semibold tracking-wide">Total Clients</p>
                <p className="text-2xl font-bold text-emerald-900 tabular-nums">{clients.length}</p>
                <p className="text-emerald-600 text-xs font-medium">Active relationships</p>
              </div>
              <div className="h-12 w-12 bg-emerald-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Users className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft hover:shadow-soft-lg bg-gradient-to-br from-blue-50/90 to-blue-100/60 hover:from-blue-50 hover:to-blue-100/80 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-700 text-sm font-semibold tracking-wide">Active Goals</p>
                <p className="text-2xl font-bold text-blue-900 tabular-nums">
                  {clients.filter(c => c.status === 'active').length}
                </p>
                <p className="text-blue-600 text-xs font-medium">In progress</p>
              </div>
              <div className="h-12 w-12 bg-blue-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Target className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft hover:shadow-soft-lg bg-gradient-to-br from-orange-50/90 to-orange-100/60 hover:from-orange-50 hover:to-orange-100/80 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-orange-700 text-sm font-semibold tracking-wide">Avg Progress</p>
                <p className="text-2xl font-bold text-orange-900 tabular-nums">
                  {clients.length > 0 
                    ? Math.round(clients.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) / clients.length)
                    : 0}%
                </p>
                <p className="text-orange-600 text-xs font-medium">Goal completion</p>
              </div>
              <div className="h-12 w-12 bg-orange-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <TrendingUp className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft hover:shadow-soft-lg bg-gradient-to-br from-purple-50/90 to-purple-100/60 hover:from-purple-50 hover:to-purple-100/80 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-purple-700 text-sm font-semibold tracking-wide">This Month</p>
                <p className="text-2xl font-bold text-purple-900 tabular-nums">
                  {clients.filter(c => {
                    const joinDate = new Date(c.join_date)
                    const now = new Date()
                    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
                <p className="text-purple-600 text-xs font-medium">New clients</p>
              </div>
              <div className="h-12 w-12 bg-purple-200/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Activity className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List Section */}
      <div>
      {filteredClients.length === 0 ? (
        <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm animate-scale-in">
          <CardContent className="pt-16 pb-16">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8 shadow-soft">
                <Users className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {searchTerm ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-gray-600 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                {searchTerm 
                  ? "Try adjusting your search terms or add a new client." 
                  : "Get started by adding your first client to begin their nutrition journey."
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-lg transition-all duration-200 font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up animate-delay-300">
          {filteredClients.map((client, index) => (
            <Card 
              key={client.id} 
              className="group border-0 shadow-soft bg-white/90 backdrop-blur-sm hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                {/* Client Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-white shadow-soft group-hover:ring-emerald-100 transition-all duration-200">
                        <AvatarImage src={`https://avatar.vercel.sh/${client.email}`} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 font-semibold">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                      <p className="text-sm text-gray-500 truncate flex items-center">
                        <Mail className="mr-1 h-3 w-3 opacity-60" />
                        {client.email}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={client.status === "active" ? "default" : "secondary"}
                    className={`${
                      client.status === "active" 
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                        : "bg-gray-100 text-gray-600"
                    } border-0 font-medium px-3 py-1`}
                  >
                    {client.status}
                  </Badge>
                </div>

                {/* Client Info */}
                <div className="space-y-3 mb-6">
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="mr-3 h-3 w-3 text-gray-400" />
                      <span className="font-medium">{client.phone}</span>
                    </div>
                  )}
                  
                  {client.goal && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Target className="mr-3 h-3 w-3 text-gray-400" />
                        <span>Goal:</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {client.goal.replace("_", " ")}
                      </span>
                    </div>
                  )}

                  {client.current_weight && client.goal_weight && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Scale className="mr-3 h-3 w-3 text-gray-400" />
                        <span>Weight:</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {client.current_weight} → {client.goal_weight} lbs
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {client.current_weight && client.goal_weight && (
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-emerald-600 tabular-nums">
                        {client.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${Math.min(client.progress_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <Calendar className="mr-1 h-3 w-3 opacity-60" />
                    Joined {new Date(client.join_date).toLocaleDateString()}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    asChild
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 group-hover:bg-emerald-50/80 transition-all duration-200 font-medium"
                  >
                    <Link href={`/dashboard/clients/${client.id}`} className="flex items-center">
                      View
                      <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
      </div>
    </div>
  )
}
