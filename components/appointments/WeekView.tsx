"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type AppointmentWithClient } from "@/lib/api";
import { formatTime } from "@/lib/formatters";
import { getStatusVariant } from "@/lib/status";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";

interface WeekViewProps {
  appointments: AppointmentWithClient[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentWithClient) => void;
}

export function WeekView({
  appointments,
  selectedDate,
  onDateSelect,
  onAppointmentClick,
}: WeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  // Update currentWeek when selectedDate changes from parent
  useEffect(() => {
    setCurrentWeek(selectedDate);
  }, [selectedDate]);

  // Get the start of the week (Monday)
  const getStartOfWeek = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Filter appointments for the current week being displayed
  const getAppointmentsForCurrentWeek = () => {
    const startOfWeek = getStartOfWeek(currentWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return appointments.filter((apt) => {
      const appointmentDate = new Date(apt.appointment_date + "T00:00:00");
      return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
    });
  };

  const weekAppointments = getAppointmentsForCurrentWeek();
  const startOfWeek = getStartOfWeek(currentWeek);

  // Generate 7 days for the week
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);
    return day;
  });

  const getAppointmentsForDay = (date: Date) => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return weekAppointments.filter((apt) => apt.appointment_date === dateStr);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newWeek);
    onDateSelect(newWeek); // Update parent's selectedDate
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    onDateSelect(today);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "consultation":
        return "bg-blue-500";
      case "follow_up":
        return "bg-green-500";
      case "nutrition_planning":
        return "bg-purple-500";
      case "assessment":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek("prev")}
            className="px-2 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek("next")}
            className="px-2 sm:px-3"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs sm:text-sm px-2 sm:px-3">
            <span className="hidden sm:inline">Aujourd'hui</span>
            <span className="sm:hidden">Auj.</span>
          </Button>
        </div>
        <div className="text-base sm:text-lg font-semibold text-center sm:text-right">
          {startOfWeek.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isSelected = day.toDateString() === selectedDate.toDateString();

          return (
            <Card
              key={index}
              className={`cursor-pointer transition-colors ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50"
                  : "hover:bg-gray-50"
              } ${isToday(day) ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => onDateSelect(day)}
            >
              <CardContent className="p-1 sm:p-3">
                <div className="text-center mb-1 sm:mb-2">
                  <div className="text-xs font-medium text-gray-600 uppercase">
                    {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                  </div>
                  <div
                    className={`text-sm sm:text-lg font-semibold ${
                      isToday(day) ? "text-blue-600" : ""
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>

                <div className="space-y-0.5 sm:space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-0.5 sm:p-1 rounded text-xs cursor-pointer hover:bg-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appointment);
                      }}
                    >
                      {/* Mobile View - Simplified */}
                      <div className="sm:hidden">
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${getTypeColor(
                              appointment.type
                            )}`}
                          />
                          <span className="font-medium text-xs truncate">
                            {formatTime(appointment.appointment_time)}
                          </span>
                        </div>
                        <div className="truncate text-xs font-medium text-gray-900 mt-0.5">
                          {appointment.title.length > 12 
                            ? appointment.title.substring(0, 12) + "..." 
                            : appointment.title}
                        </div>
                      </div>

                      {/* Desktop View - Full Details */}
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-1 mb-1">
                          <div
                            className={`w-2 h-2 rounded-full ${getTypeColor(
                              appointment.type
                            )}`}
                          />
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
                          <Badge
                            variant={getStatusVariant(appointment.status)}
                            className="text-xs px-1 py-0"
                          >
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
                    </div>
                  ))}

                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-0.5 sm:py-1">
                      <span className="hidden sm:inline">+{dayAppointments.length - 3} autres</span>
                      <span className="sm:hidden">+{dayAppointments.length - 3}</span>
                    </div>
                  )}

                  {dayAppointments.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2 sm:py-4">
                      <span className="hidden sm:inline">Aucun RDV</span>
                      <span className="sm:hidden">-</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
