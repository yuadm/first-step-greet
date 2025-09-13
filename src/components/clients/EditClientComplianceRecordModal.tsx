import { useState, ReactNode } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientComplianceRecord {
  id: string;
  client_id: string;
  period_identifier: string;
  completion_date: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_by: string | null;
  completion_method?: string;
}

interface EditClientComplianceRecordModalProps {
  record: ClientComplianceRecord;
  clientName: string;
  complianceTypeName: string;
  frequency: string;
  onRecordUpdated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}

export function EditClientComplianceRecordModal({
  record,
  clientName,
  complianceTypeName,
  frequency,
  onRecordUpdated,
  open,
  onOpenChange,
  trigger
}: EditClientComplianceRecordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Safely parse the completion date with fallback
  const parseCompletionDate = (dateString: string): Date => {
    // Check if the string looks like a date (YYYY-MM-DD format)
    if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsed = new Date(dateString);
      return isValid(parsed) ? parsed : new Date();
    }
    // If it's not a date format, return current date
    return new Date();
  };
  
  const [completionDate, setCompletionDate] = useState<Date>(parseCompletionDate(record.completion_date));
  const [notes, setNotes] = useState(record.notes || '');
  const [recordType, setRecordType] = useState<'date' | 'new'>(() => {
    // Check if completion_date looks like a date or is text
    if (record.completion_date && record.completion_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return 'date';
    }
    return 'new';
  });
  const [newText, setNewText] = useState(() => {
    // If it's not a date format, use it as the new text value  
    if (record.completion_date && !record.completion_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return record.completion_date;
    }
    return '';
  });
  const { toast } = useToast();

  // Calculate valid date range based on period and frequency
  const getValidDateRange = () => {
    const now = new Date();
    const period = record.period_identifier;
    
    if (!frequency) {
      console.warn('Frequency is undefined, using default year range');
      const currentYear = now.getFullYear();
      return {
        minDate: new Date(currentYear, 0, 1),
        maxDate: now
      };
    }
    
    let minDate: Date;
    let maxDate: Date;
    
    try {
      if (frequency.toLowerCase() === 'annual') {
        const year = parseInt(period);
        if (isNaN(year)) throw new Error('Invalid year');
        minDate = new Date(year, 0, 1);
        maxDate = new Date(year, 11, 31);
      } else if (frequency.toLowerCase() === 'monthly') {
        const [year, month] = period.split('-');
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        if (isNaN(yearNum) || isNaN(monthNum)) throw new Error('Invalid date components');
        const monthIndex = monthNum - 1;
        minDate = new Date(yearNum, monthIndex, 1);
        maxDate = new Date(yearNum, monthIndex + 1, 0);
      } else if (frequency.toLowerCase() === 'quarterly') {
        const [year, quarterStr] = period.split('-Q');
        const yearNum = parseInt(year);
        const quarter = parseInt(quarterStr);
        if (isNaN(yearNum) || isNaN(quarter)) throw new Error('Invalid date components');
        const startMonth = (quarter - 1) * 3;
        const endMonth = startMonth + 2;
        minDate = new Date(yearNum, startMonth, 1);
        maxDate = new Date(yearNum, endMonth + 1, 0);
      } else if (frequency.toLowerCase() === 'bi-annual') {
        const [year, halfStr] = period.split('-H');
        const yearNum = parseInt(year);
        const half = parseInt(halfStr);
        if (isNaN(yearNum) || isNaN(half)) throw new Error('Invalid date components');
        const startMonth = half === 1 ? 0 : 6;
        const endMonth = half === 1 ? 5 : 11;
        minDate = new Date(yearNum, startMonth, 1);
        maxDate = new Date(yearNum, endMonth + 1, 0);
      } else {
        const year = parseInt(period) || now.getFullYear();
        minDate = new Date(year, 0, 1);
        maxDate = new Date(year, 11, 31);
      }
      
      if (!isValid(minDate) || !isValid(maxDate)) {
        throw new Error('Invalid calculated dates');
      }
      
      return { minDate, maxDate };
    } catch (error) {
      console.error('Error calculating date range:', error);
      const currentYear = now.getFullYear();
      return {
        minDate: new Date(currentYear, 0, 1),
        maxDate: now
      };
    }
  };

  const { minDate, maxDate } = getValidDateRange();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (recordType === 'date') {
      if (!isValid(completionDate) || completionDate < minDate || completionDate > maxDate) {
        const minDateStr = isValid(minDate) ? format(minDate, 'dd/MM/yyyy') : 'Invalid';
        const maxDateStr = isValid(maxDate) ? format(maxDate, 'dd/MM/yyyy') : 'Invalid';
        toast({
          title: "Invalid date",
          description: `Please select a date between ${minDateStr} and ${maxDateStr} for this ${frequency?.toLowerCase() || 'compliance'} period.`,
          variant: "destructive",
        });
        return;
      }
    } else if (recordType === 'new') {
      if (!newText.trim()) {
        toast({
          title: "Text required",
          description: "Please enter text for the new record type.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const updateData: any = {
        completion_date: recordType === 'date' 
          ? format(completionDate, 'yyyy-MM-dd') 
          : newText,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
        status: recordType === 'new' ? 'new' : 'completed',
        completion_method: recordType === 'date' ? 'date_entry' : 'text_entry',
      };

      const { error } = await supabase
        .from('client_compliance_period_records')
        .update(updateData)
        .eq('id', record.id);

      if (error) throw error;

      toast({
        title: "Record updated successfully",
        description: `Compliance record for ${clientName} has been updated.`,
      });

      onOpenChange?.(false);
      onRecordUpdated();
    } catch (error) {
      console.error('Error updating client compliance record:', error);
      toast({
        title: "Error updating record",
        description: "Could not update compliance record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle trigger click directly instead of nesting dialogs
  const handleTriggerClick = () => {
    onOpenChange?.(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <div onClick={handleTriggerClick} className="contents">
          {trigger}
        </div>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Compliance Record</DialogTitle>
          <DialogDescription>
            Edit the compliance record for {clientName} - {complianceTypeName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              value={clientName}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Period</Label>
            <Input
              id="period"
              value={record.period_identifier}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>Record Type</Label>
            <Select value={recordType} onValueChange={(value: 'date' | 'new') => setRecordType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="new">New (before client joined)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recordType === 'date' ? (
            <div className="space-y-2">
              <Label>Completion Date</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Valid range for {frequency?.toLowerCase() || 'compliance'} period: {format(minDate, 'dd/MM/yyyy')} - {format(maxDate, 'dd/MM/yyyy')}
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !completionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {completionDate ? format(completionDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={completionDate}
                    onSelect={(date) => date && setCompletionDate(date)}
                    disabled={(date) => date < minDate || date > maxDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="newText">Text</Label>
              <Input
                id="newText"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter text (e.g., 'new', 'N/A', etc.)"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange?.(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}