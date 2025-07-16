"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, User, Bell, Repeat, ChevronRight, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuthNew"
import { type MealPlan } from "@/lib/supabase"

interface ClientOption {
  id: string
  name: string
}

interface ClientData {
  id: string
  name: string
  email?: string
}
import { PlanSchedulingService, type CreateScheduleData } from "@/lib/plan-scheduling"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PlanSchedulingDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mealPlan?: MealPlan
  client?: ClientData
  clients: ClientOption[]
}

export default function PlanSchedulingDialog({
  isOpen,
  onClose,
  onSuccess,
  mealPlan,
  client,
  clients
}: PlanSchedulingDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState<CreateScheduleData>({
    client_id: client?.id || "",
    meal_plan_id: mealPlan?.id || "",
    schedule_name: mealPlan?.name ? `Planning ${mealPlan.name}` : "",
    description: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    delivery_frequency: "weekly",
    delivery_days: [1], // Monday
    delivery_time: "09:00",
    auto_generate: false,
    notification_enabled: true,
    notification_days_before: 1
  })

  const frequencyOptions = PlanSchedulingService.getFrequencyOptions()
  const dayOptions = PlanSchedulingService.getDayOptions()

  const handleSubmit = async () => {
    if (!user) return

    // Validation
    if (!formData.client_id || !formData.meal_plan_id || !formData.schedule_name || !formData.start_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await PlanSchedulingService.createSchedule(user.id, formData)
      
      toast({
        title: "Succès",
        description: "Planning créé avec succès"
      })
      
      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error creating schedule:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le planning",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setFormData({
      client_id: client?.id || "",
      meal_plan_id: mealPlan?.id || "",
      schedule_name: mealPlan?.name ? `Planning ${mealPlan.name}` : "",
      description: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      delivery_frequency: "weekly",
      delivery_days: [1],
      delivery_time: "09:00",
      auto_generate: false,
      notification_enabled: true,
      notification_days_before: 1
    })
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const nextDeliveryDate = PlanSchedulingService.calculateNextDeliveryDate(
    formData.delivery_frequency,
    formData.delivery_days,
    new Date(formData.start_date)
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programmer la livraison du plan
          </DialogTitle>
          <DialogDescription>
            Configurez la livraison automatique de vos plans alimentaires selon un calendrier personnalisé.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meal_plan">Plan alimentaire *</Label>
                <Input
                  value={mealPlan?.name || "Plan sélectionné"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule_name">Nom du planning *</Label>
              <Input
                id="schedule_name"
                value={formData.schedule_name}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule_name: e.target.value }))}
                placeholder="ex: Planning hebdomadaire Marie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez l'objectif et les détails du planning..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin (optionnel)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!formData.client_id || !formData.schedule_name || !formData.start_date}
              >
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="frequency">Fréquence de livraison *</Label>
              <Select 
                value={formData.delivery_frequency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_frequency: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.delivery_frequency === 'weekly' || formData.delivery_frequency === 'bi-weekly' ? (
              <div className="space-y-2">
                <Label>Jours de livraison</Label>
                <div className="grid grid-cols-7 gap-2">
                  {dayOptions.map(day => (
                    <div key={day.value} className="flex flex-col items-center">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={formData.delivery_days.includes(day.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              delivery_days: [...prev.delivery_days, day.value] 
                            }))
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              delivery_days: prev.delivery_days.filter(d => d !== day.value) 
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-xs mt-1">
                        {day.short}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="delivery_time">Heure de livraison</Label>
              <Input
                id="delivery_time"
                type="time"
                value={formData.delivery_time}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifications"
                  checked={formData.notification_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    notification_enabled: checked as boolean 
                  }))}
                />
                <Label htmlFor="notifications">Notifications automatiques</Label>
              </div>

              {formData.notification_enabled && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="notification_days">Rappel avant livraison</Label>
                  <Select 
                    value={formData.notification_days_before?.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      notification_days_before: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 jour avant</SelectItem>
                      <SelectItem value="2">2 jours avant</SelectItem>
                      <SelectItem value="3">3 jours avant</SelectItem>
                      <SelectItem value="7">1 semaine avant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_generate"
                checked={formData.auto_generate}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  auto_generate: checked as boolean 
                }))}
              />
              <Label htmlFor="auto_generate">Génération automatique de nouveaux plans</Label>
            </div>

            {formData.auto_generate && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  De nouveaux plans seront générés automatiquement à partir des modèles disponibles.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Précédent
              </Button>
              <Button onClick={() => setStep(3)}>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5" />
                  Résumé du planning
                </CardTitle>
                <CardDescription>
                  Vérifiez les détails de votre planning avant de le créer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Client</Label>
                    <p className="text-sm">{clients.find(c => c.id === formData.client_id)?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Plan</Label>
                    <p className="text-sm">{mealPlan?.name}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Nom du planning</Label>
                  <p className="text-sm">{formData.schedule_name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Période</Label>
                    <p className="text-sm">
                      Du {new Date(formData.start_date).toLocaleDateString('fr-FR')}
                      {formData.end_date && ` au ${new Date(formData.end_date).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Fréquence</Label>
                    <p className="text-sm">{PlanSchedulingService.formatFrequency(formData.delivery_frequency)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Jours de livraison</Label>
                    <p className="text-sm">{PlanSchedulingService.formatDeliveryDays(formData.delivery_days)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Heure</Label>
                    <p className="text-sm">{formData.delivery_time}</p>
                  </div>
                </div>

                {nextDeliveryDate && (
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <Label className="text-sm font-medium text-emerald-800">Prochaine livraison</Label>
                    <p className="text-sm text-emerald-700">
                      {nextDeliveryDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} à {formData.delivery_time}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {formData.notification_enabled && (
                    <Badge variant="outline" className="text-xs">
                      <Bell className="h-3 w-3 mr-1" />
                      Notifications activées
                    </Badge>
                  )}
                  {formData.auto_generate && (
                    <Badge variant="outline" className="text-xs">
                      <Repeat className="h-3 w-3 mr-1" />
                      Génération automatique
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Précédent
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Création..." : "Créer le planning"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}