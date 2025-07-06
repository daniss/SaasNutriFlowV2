/**
 * Status utility functions for consistent status handling across the app
 */

export type Status = 'active' | 'completed' | 'paused' | 'draft' | 'pending' | 'paid' | 'overdue'

export const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Actif',
    'completed': 'Terminé', 
    'paused': 'En pause',
    'draft': 'Brouillon',
    'pending': 'En attente',
    'paid': 'Payé',
    'overdue': 'En retard'
  }
  
  return statusMap[status.toLowerCase()] || status
}

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'active': 'bg-green-100 text-green-800 border-green-200',
    'completed': 'bg-blue-100 text-blue-800 border-blue-200',
    'paused': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'draft': 'bg-gray-100 text-gray-800 border-gray-200',
    'pending': 'bg-amber-100 text-amber-800 border-amber-200',
    'paid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'overdue': 'bg-red-100 text-red-800 border-red-200'
  }
  
  return colorMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
  const variantMap: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
    'active': 'default',
    'completed': 'secondary',
    'paused': 'outline',
    'draft': 'outline',
    'pending': 'secondary',
    'paid': 'default',
    'overdue': 'destructive',
    'sent': 'default',
    'scheduled': 'secondary'
  }
  
  return variantMap[status.toLowerCase()] || 'outline'
}
