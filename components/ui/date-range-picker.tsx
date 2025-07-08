"use client"

import { addDays, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(
    date || {
      from: new Date(2024, 0, 20),
      to: addDays(new Date(2024, 0, 20), 20),
    }
  )

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
    }
  }, [date])

  const handleDateChange = (newDate: DateRange | undefined) => {
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate?.from ? (
              selectedDate.to ? (
                <>
                  {format(selectedDate.from, "LLL dd, y", { locale: fr })} -{" "}
                  {format(selectedDate.to, "LLL dd, y", { locale: fr })}
                </>
              ) : (
                format(selectedDate.from, "LLL dd, y", { locale: fr })
              )
            ) : (
              <span>Sélectionner une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedDate?.from}
            selected={selectedDate}
            onSelect={handleDateChange}
            numberOfMonths={2}
            locale={fr}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
