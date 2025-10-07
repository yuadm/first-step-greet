-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leave', 'compliance', 'document', 'employee', 'system')),
  reference_id UUID,
  reference_table TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (is_admin_user());

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification for admins
CREATE OR REPLACE FUNCTION notify_admins(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_table TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_table)
  SELECT 
    ur.user_id,
    p_title,
    p_message,
    p_type,
    p_reference_id,
    p_reference_table
  FROM user_roles ur
  WHERE ur.role = 'admin';
END;
$$;

-- Function to create notification for specific user
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_table TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_table)
  VALUES (p_user_id, p_title, p_message, p_type, p_reference_id, p_reference_table);
END;
$$;

-- Trigger: Notify on new leave request
CREATE OR REPLACE FUNCTION notify_on_leave_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  employee_name TEXT;
BEGIN
  SELECT name INTO employee_name FROM employees WHERE id = NEW.employee_id;
  
  PERFORM notify_admins(
    'New Leave Request',
    employee_name || ' submitted a leave request from ' || NEW.start_date || ' to ' || NEW.end_date,
    'leave',
    NEW.id,
    'leave_requests'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_leave_request_created
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_leave_request();

-- Trigger: Notify employee on leave status change
CREATE OR REPLACE FUNCTION notify_on_leave_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  employee_user_id UUID;
BEGIN
  IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    SELECT user_id INTO employee_user_id FROM employees WHERE id = NEW.employee_id;
    
    IF employee_user_id IS NOT NULL THEN
      PERFORM notify_user(
        employee_user_id,
        'Leave Request ' || INITCAP(NEW.status),
        'Your leave request from ' || NEW.start_date || ' to ' || NEW.end_date || ' has been ' || NEW.status,
        'leave',
        NEW.id,
        'leave_requests'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_leave_status_updated
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_leave_status_change();

-- Trigger: Notify on compliance overdue
CREATE OR REPLACE FUNCTION notify_on_compliance_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  employee_user_id UUID;
  employee_name TEXT;
  compliance_name TEXT;
BEGIN
  IF OLD.is_overdue = false AND NEW.is_overdue = true THEN
    SELECT e.user_id, e.name INTO employee_user_id, employee_name 
    FROM employees e WHERE e.id = NEW.employee_id;
    
    SELECT ct.name INTO compliance_name 
    FROM compliance_types ct WHERE ct.id = NEW.compliance_type_id;
    
    -- Notify employee
    IF employee_user_id IS NOT NULL THEN
      PERFORM notify_user(
        employee_user_id,
        'Compliance Task Overdue',
        'Your ' || compliance_name || ' task is now overdue',
        'compliance',
        NEW.id,
        'compliance_period_records'
      );
    END IF;
    
    -- Notify admins
    PERFORM notify_admins(
      'Compliance Overdue',
      employee_name || ' has an overdue ' || compliance_name || ' task',
      'compliance',
      NEW.id,
      'compliance_period_records'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_compliance_overdue
  AFTER UPDATE ON compliance_period_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_compliance_overdue();

-- Trigger: Notify on document expiring soon (7 days)
CREATE OR REPLACE FUNCTION notify_on_document_expiring()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  employee_user_id UUID;
  employee_name TEXT;
  doc_type_name TEXT;
  days_until_expiry INTEGER;
  expiry_date_value DATE;
BEGIN
  -- Only process if expiry_date is a valid date format
  IF NEW.expiry_date ~ '^\d{4}-\d{2}-\d{2}$' THEN
    BEGIN
      expiry_date_value := NEW.expiry_date::DATE;
      days_until_expiry := expiry_date_value - CURRENT_DATE;
      
      -- Notify when 7 days before expiry
      IF days_until_expiry = 7 THEN
        SELECT e.user_id, e.name INTO employee_user_id, employee_name 
        FROM employees e WHERE e.id = NEW.employee_id;
        
        SELECT dt.name INTO doc_type_name 
        FROM document_types dt WHERE dt.id = NEW.document_type_id;
        
        -- Notify employee
        IF employee_user_id IS NOT NULL THEN
          PERFORM notify_user(
            employee_user_id,
            'Document Expiring Soon',
            'Your ' || doc_type_name || ' will expire in 7 days (' || NEW.expiry_date || ')',
            'document',
            NEW.id,
            'document_tracker'
          );
        END IF;
        
        -- Notify admins
        PERFORM notify_admins(
          'Document Expiring',
          employee_name || '''s ' || doc_type_name || ' expires in 7 days',
          'document',
          NEW.id,
          'document_tracker'
        );
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Skip notification if date conversion fails
        NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_document_expiring
  AFTER INSERT OR UPDATE ON document_tracker
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_document_expiring();

-- Trigger: Notify on new employee
CREATE OR REPLACE FUNCTION notify_on_new_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM notify_admins(
    'New Employee Added',
    NEW.name || ' has been added to the system',
    'employee',
    NEW.id,
    'employees'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_employee_created
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_employee();