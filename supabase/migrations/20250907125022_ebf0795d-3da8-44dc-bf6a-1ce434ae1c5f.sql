-- Create care worker statements table
CREATE TABLE public.care_worker_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_worker_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_address TEXT NOT NULL,
  report_date DATE NOT NULL,
  statement TEXT,
  person_completing_report TEXT,
  position TEXT,
  digital_signature TEXT, -- Base64 encoded signature
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, approved, rejected
  assigned_employee_id UUID, -- Reference to employees table
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.care_worker_statements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all statements" 
ON public.care_worker_statements 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Employees can view their assigned statements" 
ON public.care_worker_statements 
FOR SELECT 
USING (assigned_employee_id IN (
  SELECT id FROM employees WHERE user_id = auth.uid()
));

CREATE POLICY "Employees can update their own draft/rejected statements" 
ON public.care_worker_statements 
FOR UPDATE 
USING (
  assigned_employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  ) 
  AND status IN ('draft', 'rejected')
)
WITH CHECK (
  assigned_employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_care_worker_statements_updated_at
  BEFORE UPDATE ON public.care_worker_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();