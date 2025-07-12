"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

interface CalendarProps {
  mode?: "single" | "range";
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (date: Date | { from?: Date; to?: Date } | undefined) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  events?: Array<{
    date: Date;
    title: string;
    type?: string;
  }>;
}

const DAYS = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function isSelected(
  date: Date,
  selected?: Date | { from?: Date; to?: Date }
): boolean {
  if (!selected) return false;
  if (selected instanceof Date) {
    return isSameDay(date, selected);
  }
  if (selected.from && isSameDay(date, selected.from)) return true;
  if (selected.to && isSameDay(date, selected.to)) return true;
  return false;
}

function ProfessionalCalendar({
  mode = "single",
  selected,
  onSelect,
  className,
  disabled,
  showOutsideDays = true,
  events = [],
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and calculate grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // Generate calendar days (6 weeks = 42 days)
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    if (disabled && disabled(date)) return;

    if (mode === "single") {
      onSelect?.(date);
    } else if (mode === "range") {
      const currentSelection = selected as
        | { from?: Date; to?: Date }
        | undefined;
      if (
        !currentSelection?.from ||
        (currentSelection.from && currentSelection.to)
      ) {
        onSelect?.({ from: date, to: undefined });
      } else if (currentSelection.from && !currentSelection.to) {
        if (date < currentSelection.from) {
          onSelect?.({ from: date, to: currentSelection.from });
        } else {
          onSelect?.({ from: currentSelection.from, to: date });
        }
      }
    }
  };

  const getDateEvents = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  return (
    <div className={cn("p-4 bg-white rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("prev")}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-lg font-semibold text-gray-900">
          {MONTHS[month]} {year}
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("next")}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const isSelectedDay = isSelected(date, selected);
          const isTodayDate = isToday(date);
          const isDisabled = disabled?.(date);
          const dayEvents = getDateEvents(date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={cn(
                "h-10 w-full flex flex-col items-center justify-center text-sm transition-colors relative rounded-md",
                "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                {
                  // Current month days
                  "text-gray-900": isCurrentMonth,
                  // Outside month days
                  "text-gray-400": !isCurrentMonth && showOutsideDays,
                  invisible: !isCurrentMonth && !showOutsideDays,
                  // Today
                  "bg-blue-100 text-blue-900 font-semibold":
                    isTodayDate && !isSelectedDay,
                  // Selected
                  "bg-blue-600 text-white font-semibold hover:bg-blue-700":
                    isSelectedDay,
                  // Disabled
                  "opacity-50 cursor-not-allowed hover:bg-transparent":
                    isDisabled,
                  // Has events
                  "font-medium": dayEvents.length > 0 && !isSelectedDay,
                }
              )}
            >
              <span className="z-10">{date.getDate()}</span>

              {/* Event indicators */}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 flex space-x-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelectedDay ? "bg-white" : "bg-blue-500"
                      )}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelectedDay ? "bg-white" : "bg-gray-400"
                      )}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            if (mode === "single") {
              onSelect?.(today);
            }
          }}
          className="text-xs"
        >
          Aujourd'hui
        </Button>
      </div>
    </div>
  );
}

export { ProfessionalCalendar };
