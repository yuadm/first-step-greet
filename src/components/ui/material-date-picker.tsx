import * as React from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MaterialDatePickerProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
}

export function MaterialDatePicker({
  selected,
  onSelect,
  placeholder = "Select date",
  className,
  buttonClassName
}: MaterialDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [tempDate, setTempDate] = React.useState<Date | undefined>(selected)
  const [month, setMonth] = React.useState<Date>(selected || new Date())

  React.useEffect(() => {
    if (selected) {
      setTempDate(selected)
      setMonth(selected)
    }
  }, [selected])

  const handleSelect = (date: Date | undefined) => {
    setTempDate(date)
  }

  const handleOk = () => {
    if (onSelect && tempDate) {
      onSelect(tempDate)
    }
    setOpen(false)
  }

  const handleCancel = () => {
    setTempDate(selected)
    setOpen(false)
  }

  const handleMonthChange = (value: string) => {
    const [year, monthIndex] = value.split('-').map(Number)
    const newDate = new Date(year, monthIndex, 1)
    setMonth(newDate)
  }

  const handlePrevMonth = () => {
    const newMonth = new Date(month)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setMonth(newMonth)
  }

  const handleNextMonth = () => {
    const newMonth = new Date(month)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setMonth(newMonth)
  }

  // Generate month options (current year and neighboring years)
  const generateMonthOptions = () => {
    const options = []
    const currentYear = new Date().getFullYear()
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
        const date = new Date(year, monthIdx, 1)
        options.push({
          value: `${year}-${monthIdx}`,
          label: format(date, 'MMMM yyyy')
        })
      }
    }
    return options
  }

  const monthOptions = generateMonthOptions()
  const currentMonthValue = `${month.getFullYear()}-${month.getMonth()}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            buttonClassName
          )}
        >
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0 max-w-[320px]", className)} align="start">
        <div className="bg-background rounded-lg shadow-lg border">
          {/* Header */}
          <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Select date</p>
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl md:text-2xl font-normal">
                {tempDate ? format(tempDate, "EEE, MMM d") : "Select"}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {/* Month selector with navigation */}
          <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 flex items-center justify-between border-t gap-2">
            <Select value={currentMonthValue} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[110px] sm:w-[140px] border-none shadow-none focus:ring-0 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[250px] sm:max-h-[300px]">
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-2 sm:p-3">
            <Calendar
              mode="single"
              selected={tempDate}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              className="pointer-events-auto scale-75 sm:scale-90"
            />
          </div>

          {/* Footer with Cancel and OK buttons */}
          <div className="flex items-center justify-end gap-2 px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-primary hover:text-primary text-xs sm:text-sm h-8 sm:h-9"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={handleOk}
              className="text-primary hover:text-primary font-medium text-xs sm:text-sm h-8 sm:h-9"
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
