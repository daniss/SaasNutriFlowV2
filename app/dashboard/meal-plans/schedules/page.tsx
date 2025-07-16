"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSkeleton, GridSkeleton } from "@/components/shared/skeletons"
import { 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  Pause, 
  Square, 
  Edit, 
  Trash2, 
  Bell,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  CalendarDays,
  Timer,
  BarChart3
} from "lucide-react"
import { useAuth } from "@/hooks/useAuthNew"
import { useToast } from "@/hooks/use-toast"
import { PlanSchedulingService, type MealPlanSchedule } from "@/lib/plan-scheduling"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

interface ScheduleWithRelations extends MealPlanSchedule {
  clients?: { id: string; name: string; email: string }
  meal_plans?: { id: string; name: string; description: string }
}

export default function SchedulesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<ScheduleWithRelations[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleWithRelations | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const [schedulesData, statsData] = await Promise.all([
        PlanSchedulingService.getSchedules(user.id),
        PlanSchedulingService.getDeliveryStats(user.id)
      ])

      setSchedules(schedulesData)
      setStats(statsData)
    } catch (error) {
      console.error("Error fetching schedules:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les plannings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (scheduleId: string, status: 'active' | 'paused' | 'completed' | 'cancelled') => {
    try {
      setActionLoading(scheduleId)
      await PlanSchedulingService.updateScheduleStatus(scheduleId, status)
      
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, status } : schedule
      ))
      
      toast({
        title: "Succès",
        description: `Planning ${status === 'active' ? 'activé' : status === 'paused' ? 'mis en pause' : status === 'completed' ? 'terminé' : 'annulé'}`
      })
    } catch (error) {
      console.error("Error updating schedule:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le planning",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (schedule: ScheduleWithRelations) => {
    try {
      await PlanSchedulingService.deleteSchedule(schedule.id)
      setSchedules(prev => prev.filter(s => s.id !== schedule.id))
      
      toast({
        title: "Succès",
        description: "Planning supprimé avec succès"
      })
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le planning",
        variant: "destructive"
      })
    } finally {
      setDeleteDialogOpen(false)
      setScheduleToDelete(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'paused': return 'En pause'
      case 'completed': return 'Terminé'
      case 'cancelled': return 'Annulé'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />
      case 'paused': return <Pause className="h-3 w-3" />
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'cancelled': return <AlertCircle className="h-3 w-3" />
      default: return null
    }
  }

  const filteredSchedules = schedules.filter(schedule => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return schedule.status === 'active'
    if (activeTab === 'completed') return schedule.status === 'completed'
    return true
  })

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Plannings de livraison"
        subtitle="Gérez vos plannings de livraison automatisés et suivez les performances"
        action={
          <Button asChild>
            <Link href="/dashboard/meal-plans">
              <Calendar className="mr-2 h-4 w-4" />
              Créer un planning
            </Link>
          </Button>
        }
      />

      <div className="px-4 sm:px-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.total_schedules}</p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actifs</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active_schedules}</p>
                  </div>
                  <Play className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">À venir</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.upcoming_deliveries}</p>
                  </div>
                  <Timer className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Livrés</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.completed_deliveries}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cette semaine</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.this_week_deliveries}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="all">Tous ({schedules.length})</TabsTrigger>
            <TabsTrigger value="active">Actifs ({schedules.filter(s => s.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="completed">Terminés ({schedules.filter(s => s.status === 'completed').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <GridSkeleton items={6} />
            ) : filteredSchedules.length === 0 ? (
              <Card>
                <CardContent className="pt-20 pb-20">
                  <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-8">
                      <Calendar className="h-12 w-12 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {activeTab === 'all' ? 'Aucun planning trouvé' : 
                       activeTab === 'active' ? 'Aucun planning actif' : 
                       'Aucun planning terminé'}
                    </h3>
                    <p className="text-gray-600 mb-10 max-w-md mx-auto">
                      {activeTab === 'all' 
                        ? "Créez votre premier planning automatisé pour faciliter la livraison de vos plans alimentaires."
                        : activeTab === 'active' 
                        ? "Vous n'avez actuellement aucun planning actif."
                        : "Vous n'avez pas encore de planning terminé."
                      }
                    </p>
                    {activeTab === 'all' && (
                      <Button asChild>
                        <Link href="/dashboard/meal-plans">
                          <Calendar className="mr-2 h-4 w-4" />
                          Créer un planning
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredSchedules.map((schedule) => (
                  <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{schedule.schedule_name}</CardTitle>
                          <CardDescription className="text-sm">
                            {schedule.clients?.name} • {schedule.meal_plans?.name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(schedule.status)} border-0 font-medium`}>
                            {getStatusIcon(schedule.status)}
                            <span className="ml-1">{getStatusLabel(schedule.status)}</span>
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                disabled={actionLoading === schedule.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {schedule.status === 'active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(schedule.id, 'paused')}
                                >
                                  <Pause className="mr-2 h-4 w-4" />
                                  Mettre en pause
                                </DropdownMenuItem>
                              )}
                              {schedule.status === 'paused' && (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(schedule.id, 'active')}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Réactiver
                                </DropdownMenuItem>
                              )}
                              {schedule.status === 'active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleUpdateStatus(schedule.id, 'completed')}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Marquer terminé
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setScheduleToDelete(schedule)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {schedule.description && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {schedule.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">Fréquence</span>
                          </div>
                          <span className="text-sm font-semibold text-blue-700">
                            {PlanSchedulingService.formatFrequency(schedule.delivery_frequency)}
                          </span>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">Livraisons</span>
                          </div>
                          <span className="text-sm font-semibold text-green-700">
                            {schedule.total_deliveries}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Jours: {PlanSchedulingService.formatDeliveryDays(schedule.delivery_days)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Heure: {schedule.delivery_time}</span>
                        </div>
                        {schedule.next_delivery_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Prochaine: {new Date(schedule.next_delivery_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {schedule.notification_enabled && (
                          <Badge variant="outline" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            Notifications
                          </Badge>
                        )}
                        {schedule.auto_generate && (
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Auto-génération
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le planning</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer "{scheduleToDelete?.schedule_name}" ? 
                Cette action supprimera également toutes les livraisons associées et ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => scheduleToDelete && handleDelete(scheduleToDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}