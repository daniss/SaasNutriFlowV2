"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle,
  Circle,
  Trash2,
  Edit,
  Download,
  Share,
  FileText,
  Users,
  Archive,
  MoreHorizontal
} from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"
import { useToast } from "@/hooks/use-toast"
import { ShoppingListService, type ShoppingList, DEFAULT_CATEGORIES } from "@/lib/shopping-list"
import { ShoppingListDialog } from "@/components/shopping-lists/ShoppingListDialog"
import { ShoppingListCard } from "@/components/shopping-lists/ShoppingListCard"
import { ShoppingListCreateDialog } from "@/components/shopping-lists/ShoppingListCreateDialog"

export default function ShoppingListsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [filteredLists, setFilteredLists] = useState<ShoppingList[]>([])
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showListDialog, setShowListDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    fetchShoppingLists()
    fetchClients()
  }, [])

  useEffect(() => {
    filterLists()
  }, [shoppingLists, searchTerm, statusFilter, clientFilter])

  const fetchShoppingLists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shopping-lists')
      if (response.ok) {
        const data = await response.json()
        setShoppingLists(data.shoppingLists)
      }
    } catch (error) {
      console.error('Error fetching shopping lists:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les listes de courses",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const filterLists = () => {
    let filtered = [...shoppingLists]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(list => 
        list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        list.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(list => list.status === statusFilter)
    }

    // Client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter(list => list.client_id === clientFilter)
    }

    setFilteredLists(filtered)
  }

  const handleCreateList = async (listData: any) => {
    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listData)
      })

      if (response.ok) {
        const data = await response.json()
        setShoppingLists([data.shoppingList, ...shoppingLists])
        setShowCreateDialog(false)
        toast({
          title: "Succès",
          description: "Liste de courses créée avec succès"
        })
      }
    } catch (error) {
      console.error('Error creating shopping list:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la liste de courses",
        variant: "destructive"
      })
    }
  }

  const handleUpdateList = async (listId: string, updates: any) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        setShoppingLists(shoppingLists.map(list => 
          list.id === listId ? data.shoppingList : list
        ))
        toast({
          title: "Succès",
          description: "Liste mise à jour avec succès"
        })
      }
    } catch (error) {
      console.error('Error updating shopping list:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la liste",
        variant: "destructive"
      })
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette liste de courses ?")) return

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShoppingLists(shoppingLists.filter(list => list.id !== listId))
        toast({
          title: "Succès",
          description: "Liste supprimée avec succès"
        })
      }
    } catch (error) {
      console.error('Error deleting shopping list:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la liste",
        variant: "destructive"
      })
    }
  }

  const handleOpenList = (list: ShoppingList) => {
    setSelectedList(list)
    setShowListDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'completed': return 'Terminée'
      case 'archived': return 'Archivée'
      default: return status
    }
  }

  const getCompletionPercentage = (list: ShoppingList) => {
    if (list.total_items === 0) return 0
    return Math.round((list.completed_items / list.total_items) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Listes de courses</h1>
            <p className="text-slate-600">Gérez vos listes de courses et templates</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle liste
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="archived">Archivée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client">Client</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setClientFilter("all")
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shopping Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLists.map((list) => (
          <ShoppingListCard
            key={list.id}
            list={list}
            onOpen={handleOpenList}
            onUpdate={handleUpdateList}
            onDelete={handleDeleteList}
            clients={clients}
          />
        ))}
      </div>

      {filteredLists.length === 0 && (
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune liste de courses
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== "all" || clientFilter !== "all"
                  ? "Aucune liste ne correspond à vos critères de recherche."
                  : "Créez votre première liste de courses pour commencer."}
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une liste
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <ShoppingListCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateList}
        clients={clients}
      />

      {/* List Detail Dialog */}
      {selectedList && (
        <ShoppingListDialog
          open={showListDialog}
          onOpenChange={setShowListDialog}
          list={selectedList}
          onUpdate={(updates) => handleUpdateList(selectedList.id, updates)}
          onItemUpdate={fetchShoppingLists}
        />
      )}
    </div>
  )
}