"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, MapPin, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type AppointmentWithClient } from "@/lib/api"
import { formatTime } from "@/lib/formatters"
import { getStatusVariant } from "@/lib/status"

interface MonthlyAgendaProps {
  dietitianId: string
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  appointments: AppointmentWithClient[]
}

export default function MonthlyAgenda({ dietitianId }: MonthlyAgendaProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [appointments, setAppointments] = useState<AppointmentWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  // Get the first day of the current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Get the first day of the calendar grid (might be from previous month)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
  
  // Get the last day of the calendar grid (might be from next month)
  const endDate = new Date(lastDayOfMonth)
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()))

  useEffect(() => {
    fetchAppointments()
  }, [dietitianId, currentDate])

  useEffect(() => {
    generateCalendarDays()
  }, [currentDate, appointments, selectedDate])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const appointmentData = await api.getAppointments(dietitianId)
      setAppointments(appointmentData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarDays = () => {
    const days: CalendarDay[] = []
    const today = new Date()
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date)
      const dateString = currentDate.toISOString().split('T')[0]
      
      // Filter appointments for this date
      const dayAppointments = appointments.filter(
        appointment => appointment.appointment_date === dateString
      )

      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === firstDayOfMonth.getMonth(),
        isToday: currentDate.toDateString() === today.toDateString(),
        isSelected: selectedDate ? currentDate.toDateString() === selectedDate.toDateString() : false,
        appointments: dayAppointments
      })
    }
    
    setCalendarDays(days)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const getAppointmentCountColor = (count: number) => {
    if (count === 0) return ""
    if (count === 1) return "bg-blue-100 border-blue-200"
    if (count === 2) return "bg-orange-100 border-orange-200"
    return "bg-red-100 border-red-200"
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  return (
    <Card className="border-0 shadow-soft bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Agenda mensuel
            </CardTitle>
            <CardDescription className="text-gray-600">
              Vue d'ensemble de vos rendez-vous du mois
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs whitespace-nowrap"
            >
              Aujourd'hui
            </Button>
          </div>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-emerald-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {formatMonthYear(currentDate)}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-emerald-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t border-gray-100">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500 bg-gray-50 border-r border-gray-100 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          <TooltipProvider>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border-r border-b border-gray-100 last:border-r-0 cursor-pointer transition-all duration-200 hover:bg-gray-50 group",
                        !day.isCurrentMonth && "bg-gray-50/50",
                        day.isSelected && "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200",
                        day.isToday && !day.isSelected && "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                      )}
                      onClick={() => handleDateClick(day.date)}
                    >
                      <div className="flex flex-col h-full">
                        <span
                          className={cn(
                            "text-xs sm:text-sm mb-1 transition-colors",
                            day.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                            day.isToday && "font-bold text-blue-600",
                            day.isSelected && "text-emerald-700 font-semibold"
                          )}
                        >
                          {day.date.getDate()}
                        </span>
                        
                        {day.appointments.length > 0 && (
                          <div className="flex-1 space-y-1">
                            {/* Show dots on mobile, time slots on desktop */}
                            <div className="block sm:hidden">
                              <div className="flex gap-1 flex-wrap">
                                {day.appointments.slice(0, 3).map((appointment, idx) => (
                                  <div
                                    key={appointment.id}
                                    className={cn(
                                      "w-2 h-2 rounded-full",
                                      appointment.status === 'completed' && "bg-green-500",
                                      appointment.status === 'scheduled' && "bg-blue-500",
                                      appointment.status === 'cancelled' && "bg-red-500"
                                    )}
                                  />
                                ))}
                                {day.appointments.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{day.appointments.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Show time slots on desktop */}
                            <div className="hidden sm:block space-y-1">
                              {day.appointments.slice(0, 2).map((appointment) => (
                                <div
                                  key={appointment.id}
                                  className={cn(
                                    "text-xs p-1 rounded text-center truncate transition-colors group-hover:shadow-sm",
                                    appointment.status === 'completed' && "bg-green-100 text-green-800 border border-green-200",
                                    appointment.status === 'scheduled' && "bg-emerald-100 text-emerald-800 border border-emerald-200",
                                    appointment.status === 'cancelled' && "bg-red-100 text-red-800 border border-red-200"
                                  )}
                                >
                                  {formatTime(appointment.appointment_time)}
                                </div>
                              ))}
                              {day.appointments.length > 2 && (
                                <div className="text-xs text-center text-gray-500 font-medium">
                                  +{day.appointments.length - 2}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  
                  {day.appointments.length > 0 && (
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">
                          {day.date.toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                        <div className="text-xs text-gray-600 mb-2">
                          {day.appointments.length} rendez-vous
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {day.appointments.map((appointment) => (
                            <div key={appointment.id} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm truncate">{appointment.title}</span>
                                <Badge variant={getStatusVariant(appointment.status)} className="text-xs ml-2 flex-shrink-0">
                                  {appointment.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span>{formatTime(appointment.appointment_time)} ({appointment.duration_minutes}min)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{appointment.clients?.name || "Client inconnu"}</span>
                                </div>
                                {appointment.is_virtual ? (
                                  <div className="flex items-center gap-1">
                                    <Video className="h-3 w-3 flex-shrink-0" />
                                    <span>Visioconférence</span>
                                  </div>
                                ) : appointment.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{appointment.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Legend */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                <span>Aujourd'hui</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded"></div>
                <span>Programmé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span>Terminé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span>Annulé</span>
              </div>
            </div>
            <div className="text-gray-500 hidden sm:block">
              Survolez les jours pour voir les détails
            </div>
            <div className="text-gray-500 block sm:hidden">
              Touchez les jours pour voir les détails
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
