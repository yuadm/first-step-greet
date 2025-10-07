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
      <PopoverContent className={cn("w-auto p-0 max-w-[280px]", className)} align="start">
        <div className="bg-background rounded-lg shadow-lg border">
          {/* Header - Compact */}
          <div className="px-3 pt-2 pb-1.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">Select date</p>
            <div className="text-sm font-normal">
              {tempDate ? format(tempDate, "EEE, MMM d") : "Select"}
            </div>
          </div>

          {/* Month selector with navigation - Compact */}
          <div className="px-2 py-1.5 flex items-center justify-between border-t gap-1">
            <Select value={currentMonthValue} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[100px] h-7 border-none shadow-none focus:ring-0 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Calendar - Compact */}
          <div className="p-1">
            <Calendar
              mode="single"
              selected={tempDate}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              className="pointer-events-auto scale-[0.85]"
            />
          </div>

          {/* Footer with Cancel and OK buttons - Compact */}
          <div className="flex items-center justify-end gap-1.5 px-2 pb-2 pt-1">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-primary hover:text-primary text-[11px] h-7 px-3"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={handleOk}
              className="text-primary hover:text-primary font-medium text-[11px] h-7 px-3"
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
