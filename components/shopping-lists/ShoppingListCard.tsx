"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  ShoppingCart, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Archive,
  CheckCircle,
  Calendar,
  User,
  Package
} from "lucide-react"
import { type ShoppingList } from "@/lib/shopping-list"

interface ShoppingListCardProps {
  list: ShoppingList
  onOpen: (list: ShoppingList) => void
  onUpdate: (listId: string, updates: any) => void
  onDelete: (listId: string) => void
  clients: any[]
}

export function ShoppingListCard({ 
  list, 
  onOpen, 
  onUpdate, 
  onDelete, 
  clients 
}: ShoppingListCardProps) {
  const [loading, setLoading] = useState(false)

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

  const getCompletionPercentage = () => {
    if (list.total_items === 0) return 0
    return Math.round((list.completed_items / list.total_items) * 100)
  }

  const getClientName = () => {
    if (!list.client_id) return 'Aucun client'
    const client = clients.find(c => c.id === list.client_id)
    return client ? client.name : 'Client inconnu'
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      await onUpdate(list.id, { status: newStatus })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpen(list)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                {list.name}
              </CardTitle>
              {list.description && (
                <p className="text-sm text-slate-600 mt-1">
                  {list.description.length > 60 
                    ? `${list.description.substring(0, 60)}...`
                    : list.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onOpen(list)
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              {list.status === 'active' && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange('completed')
                }}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme terminée
                </DropdownMenuItem>
              )}
              {list.status !== 'archived' && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange('archived')
                }}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(list.id)
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status and Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(list.status)}>
                {getStatusLabel(list.status)}
              </Badge>
              <span className="text-sm text-slate-600">
                {list.completed_items}/{list.total_items} articles
              </span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
          </div>

          {/* Meta information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="h-4 w-4" />
              <span>{getClientName()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>
                Créée le {new Date(list.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {(list.meal_plan_id || list.template_id) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Package className="h-4 w-4" />
                <span>
                  {list.meal_plan_id ? 'Depuis un plan repas' : 'Depuis un template'}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}