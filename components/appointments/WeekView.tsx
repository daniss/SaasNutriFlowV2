"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, Users, MapPin, Video } from "lucide-react"
import { formatTime } from "@/lib/formatters"
import { getStatusVariant } from "@/lib/status"
import { type AppointmentWithClient } from "@/lib/api"

interface WeekViewProps {
  appointments: AppointmentWithClient[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onAppointmentClick: (appointment: AppointmentWithClient) => void
}

export function WeekView({ appointments, selectedDate, onDateSelect, onAppointmentClick }: WeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate)

  // Get the start of the week (Monday)
  const getStartOfWeek = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }

  const startOfWeek = getStartOfWeek(currentWeek)
  
  // Generate 7 days for the week
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + index)
    return day
  })

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt => apt.appointment_date === dateStr)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentWeek(today)
    onDateSelect(today)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-500'
      case 'follow_up': return 'bg-green-500'
      case 'nutrition_planning': return 'bg-purple-500'
      case 'assessment': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const today = new Date()
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
        </div>
        <div className="text-lg font-semibold">
          {startOfWeek.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isSelected = day.toDateString() === selectedDate.toDateString()
          
          return (
            <Card 
              key={index} 
              className={`cursor-pointer transition-colors ${
                isSelected ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-gray-50'
              } ${isToday(day) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => onDateSelect(day)}
            >
              <CardContent className="p-3">
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-gray-600 uppercase">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday(day) ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-1 rounded text-xs cursor-pointer hover:bg-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(appointment)
                      }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getTypeColor(appointment.type)}`} />
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="font-medium">
                          {formatTime(appointment.appointment_time)}
                        </span>
                      </div>
                      <div className="truncate font-medium text-gray-900">
                        {appointment.title}
                      </div>
                      {appointment.clients?.name && (
                        <div className="flex items-center gap-1 text-gray-600 truncate">
                          <Users className="w-3 h-3" />
                          <span>{appointment.clients.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant={getStatusVariant(appointment.status)} className="text-xs px-1 py-0">
                          {appointment.status}
                        </Badge>
                        {appointment.is_virtual && (
                          <Video className="w-3 h-3 text-blue-500" />
                        )}
                        {!appointment.is_virtual && appointment.location && (
                          <MapPin className="w-3 h-3 text-gray-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{dayAppointments.length - 3} autres
                    </div>
                  )}
                  
                  {dayAppointments.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">
                      Aucun RDV
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
