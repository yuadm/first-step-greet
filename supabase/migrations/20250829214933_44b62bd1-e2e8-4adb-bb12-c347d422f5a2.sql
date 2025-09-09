-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients
CREATE POLICY "Admins can manage clients" 
ON public.clients 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Allow public read access to clients" 
ON public.clients 
FOR SELECT 
USING (true);

-- Create client compliance types table
CREATE TABLE public.client_compliance_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'quarterly',
  has_questionnaire BOOLEAN DEFAULT false,
  questionnaire_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for client compliance types
ALTER TABLE public.client_compliance_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage client compliance types" 
ON public.client_compliance_types 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Allow public read access to client compliance types" 
ON public.client_compliance_types 
FOR SELECT 
USING (true);

-- Create client spot check records table
CREATE TABLE public.client_spot_check_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  compliance_record_id UUID,
  service_user_name TEXT NOT NULL,
  care_workers TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  performed_by TEXT NOT NULL,
  observations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for client spot check records
ALTER TABLE public.client_spot_check_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to client spot check records" 
ON public.client_spot_check_records 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create client compliance period records table
CREATE TABLE public.client_compliance_period_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_compliance_type_id UUID NOT NULL REFERENCES public.client_compliance_types(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_identifier TEXT NOT NULL,
  completion_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  completion_method TEXT DEFAULT 'spotcheck',
  auto_generated BOOLEAN DEFAULT false,
  is_overdue BOOLEAN DEFAULT false,
  grace_period_end DATE,
  next_due_date DATE,
  completed_by UUID,
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for client compliance period records
ALTER TABLE public.client_compliance_period_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to client compliance period records" 
ON public.client_compliance_period_records 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert default Client Spot-Check compliance type
INSERT INTO public.client_compliance_types (name, description, frequency, has_questionnaire)
VALUES ('Client Spot-Check', 'Quarterly spot check compliance for clients', 'quarterly', false);

-- Create trigger for updating timestamps
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_compliance_types_updated_at
BEFORE UPDATE ON public.client_compliance_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_spot_check_records_updated_at
BEFORE UPDATE ON public.client_spot_check_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_compliance_period_records_updated_at
BEFORE UPDATE ON public.client_compliance_period_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();