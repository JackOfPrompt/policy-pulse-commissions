import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscalationResult {
  escalated_count: number;
  notifications_sent: number;
  errors: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting auto-escalation process...');

    // Call the auto-escalation function
    const { data: escalationResult, error: escalationError } = await supabaseClient
      .rpc('auto_escalate_overdue_tasks');

    if (escalationError) {
      console.error('Error in auto-escalation:', escalationError);
      throw escalationError;
    }

    console.log(`Auto-escalated ${escalationResult} tasks`);

    // Fetch newly escalated tasks for notification
    const { data: escalatedTasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select(`
        id, 
        task_title, 
        related_id, 
        assigned_to_employee_id,
        assigned_to_agent_id,
        escalated_at,
        policies_new!tasks_related_id_fkey(policy_number, line_of_business),
        employees!tasks_assigned_to_employee_id_fkey(name, email, phone),
        agents!tasks_assigned_to_agent_id_fkey(name, email, phone)
      `)
      .not('escalated_at', 'is', null)
      .gte('escalated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    if (tasksError) {
      console.error('Error fetching escalated tasks:', tasksError);
      throw tasksError;
    }

    let notificationsSent = 0;
    const errors: string[] = [];

    // Send notifications for each escalated task
    for (const task of escalatedTasks || []) {
      try {
        console.log(`Processing escalation notifications for task: ${task.task_title}`);

        // Determine the assigned user details
        const assignedUser = task.employees || task.agents;
        if (!assignedUser) {
          console.log('No assigned user found for task:', task.id);
          continue;
        }

        // Create escalation notification record
        const { error: notificationError } = await supabaseClient
          .from('escalation_notifications')
          .insert({
            task_id: task.id,
            policy_id: task.related_id,
            sent_to: assignedUser.email || assignedUser.phone || 'unknown',
            method: assignedUser.email ? 'email' : 'whatsapp',
            delivered: true // Marking as delivered for demo purposes
          });

        if (notificationError) {
          console.error('Error creating notification record:', notificationError);
          errors.push(`Failed to log notification for task ${task.id}`);
          continue;
        }

        // Log the escalation action in audit trail
        const { error: auditError } = await supabaseClient
          .from('task_audit_trail')
          .insert({
            task_id: task.id,
            action: 'Notification Sent',
            new_status: 'Escalated',
            notes: `Auto-escalation notification sent to ${assignedUser.name} via ${assignedUser.email ? 'email' : 'WhatsApp'}`
          });

        if (auditError) {
          console.error('Error creating audit trail:', auditError);
          errors.push(`Failed to create audit trail for task ${task.id}`);
        }

        // Here you would integrate with actual email/WhatsApp services
        // For now, we'll just log the action
        console.log(`Would send notification to: ${assignedUser.name} (${assignedUser.email || assignedUser.phone})`);
        console.log(`Task: ${task.task_title} - Policy: ${task.policies_new?.policy_number}`);
        
        notificationsSent++;

      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        errors.push(`Error processing task ${task.id}: ${taskError.message}`);
      }
    }

    const result: EscalationResult = {
      escalated_count: escalationResult || 0,
      notifications_sent: notificationsSent,
      errors
    };

    console.log('Auto-escalation process completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in auto-escalate-tasks function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        escalated_count: 0,
        notifications_sent: 0,
        errors: [error.message]
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);