import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PolicyStatusAlert {
  policyId: string;
  policyNumber: string;
  newStatus: string;
  previousStatus: string;
  updatedBy: string;
  updatedByRole: string;
  comment?: string;
  productName: string;
  lineOfBusiness: string;
  customerName: string;
}

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      policyId, 
      policyNumber, 
      newStatus, 
      previousStatus, 
      updatedBy, 
      updatedByRole, 
      comment, 
      productName, 
      lineOfBusiness, 
      customerName 
    }: PolicyStatusAlert = await req.json();

    console.log(`Policy status alert for ${policyNumber}: ${previousStatus} → ${newStatus}`);

    // Determine recipients based on new status
    let recipientRoles: string[] = [];
    let emailSubject = '';
    let emailBody = '';

    switch (newStatus.toLowerCase()) {
      case 'free look cancellation':
        recipientRoles = ['finance', 'admin'];
        emailSubject = `🚨 Policy #${policyNumber} - Free Look Cancellation Alert`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin: 0;">⚠️ Policy Free Look Cancellation Alert</h2>
            </div>
            
            <p>A policy has been cancelled under free look period and may require payout reversal.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Policy Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Policy Number:</td><td style="padding: 8px 0;">${policyNumber}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Product:</td><td style="padding: 8px 0;">${productName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Line of Business:</td><td style="padding: 8px 0;">${lineOfBusiness}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td style="padding: 8px 0;">${customerName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Previous Status:</td><td style="padding: 8px 0;">${previousStatus}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">New Status:</td><td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${newStatus}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Updated By:</td><td style="padding: 8px 0;">${updatedBy} (${updatedByRole})</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Updated At:</td><td style="padding: 8px 0;">${new Date().toLocaleString()}</td></tr>
                ${comment ? `<tr><td style="padding: 8px 0; font-weight: bold;">Comment:</td><td style="padding: 8px 0;">${comment}</td></tr>` : ''}
              </table>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: bold; color: #92400e;">🔥 Action Required:</p>
              <p style="margin: 10px 0 0 0; color: #92400e;">Please review for potential payout reversal immediately.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/admin/policies" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Policy Details
              </a>
            </div>
          </div>
        `;
        break;

      case 'rejected':
        recipientRoles = ['manager', 'admin'];
        emailSubject = `❌ Policy #${policyNumber} - Rejection Alert`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin: 0;">❌ Policy Rejection Alert</h2>
            </div>
            
            <p>A policy application has been rejected and requires management review.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Policy Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Policy Number:</td><td style="padding: 8px 0;">${policyNumber}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Product:</td><td style="padding: 8px 0;">${productName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Line of Business:</td><td style="padding: 8px 0;">${lineOfBusiness}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td style="padding: 8px 0;">${customerName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Previous Status:</td><td style="padding: 8px 0;">${previousStatus}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">New Status:</td><td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${newStatus}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Updated By:</td><td style="padding: 8px 0;">${updatedBy} (${updatedByRole})</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Updated At:</td><td style="padding: 8px 0;">${new Date().toLocaleString()}</td></tr>
                ${comment ? `<tr><td style="padding: 8px 0; font-weight: bold;">Reason:</td><td style="padding: 8px 0;">${comment}</td></tr>` : ''}
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/admin/policies" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Policy Details
              </a>
            </div>
          </div>
        `;
        break;

      case 'cancelled':
        recipientRoles = ['manager', 'admin'];
        emailSubject = `🚫 Policy #${policyNumber} - Cancellation Alert`;
        emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fed7d7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #c53030; margin: 0;">🚫 Policy Cancellation Alert</h2>
            </div>
            
            <p>A policy has been cancelled and requires management attention.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Policy Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Policy Number:</td><td style="padding: 8px 0;">${policyNumber}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Product:</td><td style="padding: 8px 0;">${productName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Line of Business:</td><td style="padding: 8px 0;">${lineOfBusiness}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Customer:</td><td style="padding: 8px 0;">${customerName}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Previous Status:</td><td style="padding: 8px 0;">${previousStatus}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">New Status:</td><td style="padding: 8px 0; color: #c53030; font-weight: bold;">${newStatus}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Updated By:</td><td style="padding: 8px 0;">${updatedBy} (${updatedByRole})</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Updated At:</td><td style="padding: 8px 0;">${new Date().toLocaleString()}</td></tr>
                ${comment ? `<tr><td style="padding: 8px 0; font-weight: bold;">Reason:</td><td style="padding: 8px 0;">${comment}</td></tr>` : ''}
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/admin/policies" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Policy Details
              </a>
            </div>
          </div>
        `;
        break;

      default:
        // No alert needed for other status changes
        return new Response(
          JSON.stringify({ message: 'No alert required for this status change' }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
    }

    // Get recipient emails based on roles
    const { data: recipients, error: recipientsError } = await supabase
      .from('employees')
      .select('email, name')
      .in('role', recipientRoles)
      .not('email', 'is', null)
      .eq('status', 'Active');

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      throw recipientsError;
    }

    if (!recipients || recipients.length === 0) {
      console.log('No recipients found for roles:', recipientRoles);
      return new Response(
        JSON.stringify({ message: 'No recipients found for notification' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Create notification records in the database
    const notifications = recipients.map(recipient => ({
      entity_type: 'policy',
      entity_id: policyId,
      recipient_role: recipientRoles[0], // Use first role as primary
      message: `Policy ${policyNumber} status changed to ${newStatus}`,
      notification_type: 'policy_status_change'
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating notifications:', notificationError);
    }

    // Send email if Resend API key is configured
    if (Deno.env.get("RESEND_API_KEY")) {
      try {
        const emailPromises = recipients.map(recipient => 
          resend.emails.send({
            from: "Insurance System <onboarding@resend.dev>",
            to: [recipient.email],
            subject: emailSubject,
            html: emailBody,
          })
        );

        const emailResults = await Promise.allSettled(emailPromises);
        const successCount = emailResults.filter(result => result.status === 'fulfilled').length;
        const failureCount = emailResults.filter(result => result.status === 'rejected').length;

        console.log(`Email alerts sent: ${successCount} successful, ${failureCount} failed`);

        return new Response(
          JSON.stringify({ 
            message: 'Policy status alert processed successfully',
            recipientCount: recipients.length,
            emailsSent: successCount,
            emailsFailed: failureCount,
            recipients: recipients.map(r => ({ name: r.name, email: r.email }))
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      } catch (emailError) {
        console.error('Error sending emails:', emailError);
        // Continue without failing the operation
      }
    }

    // Log the alert if no email service configured
    console.log(`Email alert logged for ${recipients.length} recipients for policy ${policyNumber}`);
    console.log('Recipients:', recipients.map(r => r.email).join(', '));
    console.log('Subject:', emailSubject);

    return new Response(
      JSON.stringify({ 
        message: 'Policy status alert processed successfully (logged only - no email service configured)',
        recipientCount: recipients.length,
        recipients: recipients.map(r => ({ name: r.name, email: r.email }))
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-policy-status-alert function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(serve_handler);