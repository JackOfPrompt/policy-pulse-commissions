-- Create enums for tasks system
CREATE TYPE public.task_related_to AS ENUM ('Lead', 'Policy', 'Renewal', 'Agent', 'Customer', 'Custom');
CREATE TYPE public.task_priority AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE public.task_type AS ENUM ('Call', 'Visit', 'Document Collection', 'Follow-up', 'Renewal', 'Payment Collection', 'Custom');
CREATE TYPE public.task_status AS ENUM ('Open', 'In Progress', 'Completed', 'Overdue', 'Cancelled');
CREATE TYPE public.reminder_via AS ENUM ('Email', 'SMS', 'In-app');
CREATE TYPE public.reminder_status AS ENUM ('Sent', 'Failed');
CREATE TYPE public.recurrence_pattern AS ENUM ('Daily', 'Weekly', 'Monthly');

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_title TEXT NOT NULL,
  description TEXT,
  assigned_to_employee_id UUID REFERENCES public.employees(id),
  assigned_to_agent_id UUID REFERENCES public.agents(id),
  related_to task_related_to,
  related_id UUID, -- Generic foreign key to related entity
  priority task_priority DEFAULT 'Medium',
  task_type task_type NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status task_status DEFAULT 'Open',
  created_by_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reminder_date_time TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern recurrence_pattern,
  recurrence_end_date DATE,
  attachments TEXT[], -- Array of file paths
  notes TEXT
);

-- Create task reminder log table
CREATE TABLE public.task_reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  via reminder_via NOT NULL,
  status reminder_status NOT NULL,
  message TEXT,
  recipient_email TEXT,
  recipient_phone TEXT
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY "Admins can manage all tasks" 
ON public.tasks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for task reminder logs
CREATE POLICY "Admins can manage all task reminder logs" 
ON public.task_reminder_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tasks_assigned_employee ON public.tasks(assigned_to_employee_id);
CREATE INDEX idx_tasks_assigned_agent ON public.tasks(assigned_to_agent_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_related_to ON public.tasks(related_to, related_id);
CREATE INDEX idx_task_reminder_logs_task_id ON public.task_reminder_logs(task_id);
CREATE INDEX idx_task_reminder_logs_sent_at ON public.task_reminder_logs(sent_at);

-- Create function to update task status to overdue
CREATE OR REPLACE FUNCTION public.update_overdue_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update tasks that are past due and not completed/cancelled
  UPDATE public.tasks
  SET 
    status = 'Overdue',
    updated_at = now()
  WHERE 
    due_date < now()
    AND status IN ('Open', 'In Progress')
    AND status != 'Overdue';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Create function to auto-generate renewal tasks
CREATE OR REPLACE FUNCTION public.create_renewal_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create renewal task 7 days before policy expiry
  IF NEW.policy_end_date IS NOT NULL THEN
    INSERT INTO public.tasks (
      task_title,
      description,
      assigned_to_employee_id,
      assigned_to_agent_id,
      related_to,
      related_id,
      priority,
      task_type,
      due_date,
      created_by_id
    ) VALUES (
      'Policy Renewal - ' || NEW.policy_number,
      'Follow up with customer for policy renewal: ' || NEW.policy_number,
      NEW.employee_id,
      NEW.agent_id,
      'Renewal',
      NEW.id,
      'High',
      'Renewal',
      NEW.policy_end_date - INTERVAL '7 days',
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating renewal tasks
CREATE TRIGGER auto_create_renewal_task
AFTER INSERT ON public.policies_new
FOR EACH ROW
EXECUTE FUNCTION public.create_renewal_task();

-- Create view for tasks with related entity details
CREATE OR REPLACE VIEW public.tasks_with_details AS
SELECT 
  t.*,
  e.name as assigned_employee_name,
  a.name as assigned_agent_name,
  a.agent_code,
  created_by.name as created_by_name,
  CASE 
    WHEN t.due_date < now() AND t.status IN ('Open', 'In Progress') THEN 'Overdue'
    WHEN t.due_date <= now() + INTERVAL '1 day' AND t.status IN ('Open', 'In Progress') THEN 'Due Today'
    WHEN t.due_date <= now() + INTERVAL '3 days' AND t.status IN ('Open', 'In Progress') THEN 'Due Soon'
    ELSE 'Upcoming'
  END as urgency_status,
  EXTRACT(epoch FROM (t.due_date - now())) / 3600 as hours_until_due
FROM public.tasks t
LEFT JOIN public.employees e ON t.assigned_to_employee_id = e.id
LEFT JOIN public.agents a ON t.assigned_to_agent_id = a.id
LEFT JOIN public.employees created_by ON t.created_by_id = created_by.id;