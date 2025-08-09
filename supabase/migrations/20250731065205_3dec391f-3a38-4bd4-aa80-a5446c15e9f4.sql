-- Create support chat system with response tracking
CREATE TABLE public.support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('employee', 'agent', 'admin')),
  receiver_id UUID,
  receiver_type TEXT CHECK (receiver_type IN ('employee', 'agent', 'admin')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'awaiting_reply', 'responded')),
  response_time INTEGER, -- in seconds
  first_response_time INTEGER, -- in seconds for first reply in thread
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  replied_at TIMESTAMP WITH TIME ZONE,
  is_first_message BOOLEAN DEFAULT false
);

-- Create performance metrics tracking
CREATE TABLE public.daily_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  policies_processed INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0, -- in seconds
  longest_response_time INTEGER DEFAULT 0,
  missed_replies INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, metric_date)
);

-- Create chat exports log
CREATE TABLE public.chat_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exported_by UUID NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'csv', 'json')),
  thread_id TEXT,
  agent_id UUID,
  date_range_start DATE,
  date_range_end DATE,
  file_path TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_chats
CREATE POLICY "Admin can manage all chats" ON public.support_chats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own chats" ON public.support_chats
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send chats" ON public.support_chats
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- RLS Policies for performance metrics
CREATE POLICY "Admin can view all metrics" ON public.daily_performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Employees can view their metrics" ON public.daily_performance_metrics
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- RLS Policies for chat exports
CREATE POLICY "Admin can manage all exports" ON public.chat_exports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can view their exports" ON public.chat_exports
  FOR SELECT USING (exported_by = auth.uid());

-- Indexes for performance
CREATE INDEX idx_support_chats_thread_id ON public.support_chats(thread_id);
CREATE INDEX idx_support_chats_sender ON public.support_chats(sender_id, sender_type);
CREATE INDEX idx_support_chats_receiver ON public.support_chats(receiver_id, receiver_type);
CREATE INDEX idx_support_chats_status ON public.support_chats(status);
CREATE INDEX idx_performance_metrics_employee_date ON public.daily_performance_metrics(employee_id, metric_date);
CREATE INDEX idx_performance_metrics_date ON public.daily_performance_metrics(metric_date);

-- Function to calculate response times
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $$
DECLARE
  previous_msg RECORD;
  thread_first_msg RECORD;
BEGIN
  -- Find the previous message in the thread that needs a response
  SELECT * INTO previous_msg
  FROM public.support_chats 
  WHERE thread_id = NEW.thread_id 
    AND status = 'awaiting_reply'
    AND sender_id != NEW.sender_id
    AND created_at < NEW.created_at
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Calculate response time if replying to a message
  IF previous_msg.id IS NOT NULL THEN
    NEW.response_time := EXTRACT(EPOCH FROM (NEW.created_at - previous_msg.created_at))::INTEGER;
    
    -- Update the previous message status
    UPDATE public.support_chats 
    SET status = 'responded', replied_at = NEW.created_at
    WHERE id = previous_msg.id;
  END IF;
  
  -- Check if this is first response in thread
  SELECT * INTO thread_first_msg
  FROM public.support_chats 
  WHERE thread_id = NEW.thread_id 
    AND is_first_message = true
  LIMIT 1;
  
  IF thread_first_msg.id IS NOT NULL AND thread_first_msg.sender_id != NEW.sender_id THEN
    NEW.first_response_time := EXTRACT(EPOCH FROM (NEW.created_at - thread_first_msg.created_at))::INTEGER;
  END IF;
  
  -- Set status to awaiting_reply for new messages
  NEW.status := 'awaiting_reply';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for response time calculation
CREATE TRIGGER calculate_response_time_trigger
  BEFORE INSERT ON public.support_chats
  FOR EACH ROW
  EXECUTE FUNCTION calculate_response_time();

-- Function to update daily performance metrics
CREATE OR REPLACE FUNCTION update_daily_performance()
RETURNS TRIGGER AS $$
DECLARE
  emp_id UUID;
  metric_date DATE := CURRENT_DATE;
BEGIN
  -- Get employee ID based on the trigger context
  IF TG_TABLE_NAME = 'policies_new' THEN
    emp_id := COALESCE(NEW.employee_id, OLD.employee_id);
  ELSIF TG_TABLE_NAME = 'leads' THEN
    IF NEW.assigned_to_type = 'Employee' THEN
      emp_id := NEW.assigned_to_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'tasks' THEN
    emp_id := COALESCE(NEW.assigned_to_employee_id, OLD.assigned_to_employee_id);
  END IF;
  
  IF emp_id IS NOT NULL THEN
    -- Insert or update daily metrics
    INSERT INTO public.daily_performance_metrics (employee_id, metric_date)
    VALUES (emp_id, metric_date)
    ON CONFLICT (employee_id, metric_date)
    DO NOTHING;
    
    -- Update specific metrics based on table
    IF TG_TABLE_NAME = 'policies_new' AND TG_OP = 'INSERT' THEN
      UPDATE public.daily_performance_metrics 
      SET policies_processed = policies_processed + 1,
          revenue_generated = revenue_generated + COALESCE(NEW.premium_amount, 0),
          updated_at = now()
      WHERE employee_id = emp_id AND metric_date = metric_date;
    ELSIF TG_TABLE_NAME = 'leads' AND NEW.lead_status = 'Converted' AND OLD.lead_status != 'Converted' THEN
      UPDATE public.daily_performance_metrics 
      SET leads_converted = leads_converted + 1,
          updated_at = now()
      WHERE employee_id = emp_id AND metric_date = metric_date;
    ELSIF TG_TABLE_NAME = 'tasks' AND NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
      UPDATE public.daily_performance_metrics 
      SET tasks_completed = tasks_completed + 1,
          updated_at = now()
      WHERE employee_id = emp_id AND metric_date = metric_date;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for performance tracking
CREATE TRIGGER update_performance_on_policy_insert
  AFTER INSERT ON public.policies_new
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_performance();

CREATE TRIGGER update_performance_on_lead_convert
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (NEW.lead_status IS DISTINCT FROM OLD.lead_status)
  EXECUTE FUNCTION update_daily_performance();

CREATE TRIGGER update_performance_on_task_complete
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION update_daily_performance();