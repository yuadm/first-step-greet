import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
  id: string;
  name: string;
}

interface CareWorkerStatement {
  id: string;
  care_worker_name: string;
  client_name: string;
  client_address: string;
  report_date: string;
  assigned_employee_id: string | null;
}

interface Branch {
  id: string;
  name: string;
}

interface CareWorkerStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statement?: CareWorkerStatement | null;
  branches: Branch[];
  onSuccess: () => void;
}

export function CareWorkerStatementModal({ 
  open, 
  onOpenChange, 
  statement,
  branches,
  onSuccess 
}: CareWorkerStatementModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_address: "",
    report_date: new Date(),
    assigned_employee_id: "",
  });

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (statement) {
      setFormData({
        client_address: statement.client_address,
        report_date: new Date(statement.report_date),
        assigned_employee_id: statement.assigned_employee_id || "",
      });
    } else {
      setFormData({
        client_address: "",
        report_date: new Date(),
        assigned_employee_id: "",
      });
    }
  }, [statement, open]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get selected employee's name and branch
      const selectedEmployee = employees.find(emp => emp.id === formData.assigned_employee_id);
      const employeeName = selectedEmployee?.name || "";
      
      // Get employee's branch
      let employeeBranchId = null;
      if (selectedEmployee) {
        const { data: empData } = await supabase
          .from('employees')
          .select('branch_id')
          .eq('id', selectedEmployee.id)
          .single();
        employeeBranchId = empData?.branch_id || null;
      }

      const submitData = {
        care_worker_name: employeeName,
        client_name: employeeName, // Same as care worker name
        client_address: formData.client_address,
        report_date: formData.report_date.toISOString().split('T')[0],
        assigned_employee_id: formData.assigned_employee_id || null,
        branch_id: employeeBranchId,
        created_by: user?.id,
      };

      if (statement) {
        const { error } = await supabase
          .from('care_worker_statements')
          .update(submitData)
          .eq('id', statement.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Statement updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('care_worker_statements')
          .insert(submitData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Statement created and assigned successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving statement:', error);
      toast({
        title: "Error",
        description: "Failed to save statement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {statement ? 'Edit' : 'Create New'} Care Worker Statement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client_address">Client Address</Label>
            <Input
              id="client_address"
              value={formData.client_address}
              onChange={(e) => setFormData({ ...formData, client_address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Report Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.report_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.report_date ? format(formData.report_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.report_date}
                    onSelect={(date) => setFormData({ ...formData, report_date: date || new Date() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="assigned_employee">Assign to Employee (Care Worker)</Label>
              <Select
                value={formData.assigned_employee_id}
                onValueChange={(value) => setFormData({ ...formData, assigned_employee_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : statement ? 'Update' : 'Create'} Statement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}