import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteUserRequest {
  user_type: 'employee' | 'agent';
  employee_id?: number;
  agent_id?: number;
  email: string;
  role: string;
  tenant_id: string;
}

interface AcceptInvitationRequest {
  invitation_token: string;
  email: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { method } = req;
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const action = pathSegments[pathSegments.length - 1];

    console.log(`${method} request to employee-onboarding API, action: ${action}`);

    switch (method) {
      case 'POST':
        if (action === 'invite') {
          // Create invitation for employee/agent
          const requestData: InviteUserRequest = await req.json();
          
          // Generate invitation token and temporary password
          const { data: tokenData } = await supabaseClient.rpc('generate_invitation_token');
          const { data: tempPassword } = await supabaseClient.rpc('generate_temp_password');
          
          if (!tokenData || !tempPassword) {
            return new Response(
              JSON.stringify({ success: false, message: 'Failed to generate invitation credentials' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Create invitation record
          const { data: invitation, error: inviteError } = await supabaseClient
            .from('onboarding_invitations')
            .insert({
              tenant_id: requestData.tenant_id,
              employee_id: requestData.employee_id,
              agent_id: requestData.agent_id,
              email: requestData.email,
              invitation_token: tokenData,
              user_type: requestData.user_type,
              role: requestData.role,
              temporary_password: tempPassword,
              status: 'pending',
              created_by: (await supabaseClient.auth.getUser()).data.user?.id
            })
            .select()
            .single();

          if (inviteError) {
            console.error('Error creating invitation:', inviteError);
            return new Response(
              JSON.stringify({ success: false, message: 'Failed to create invitation' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Update employee/agent status
          if (requestData.user_type === 'employee') {
            await supabaseClient
              .from('tenant_employees')
              .update({ 
                onboarding_status: 'invited',
                invitation_sent_at: new Date().toISOString()
              })
              .eq('employee_id', requestData.employee_id);
          } else {
            await supabaseClient
              .from('agents')
              .update({ 
                onboarding_status: 'invited',
                invitation_sent_at: new Date().toISOString()
              })
              .eq('agent_id', requestData.agent_id);
          }

          // Schedule email sending (using background task)
          const emailTask = async () => {
            try {
              const inviteUrl = `${url.origin}/onboard?token=${tokenData}`;
              
              // Call email function
              const { error: emailError } = await supabaseClient.functions.invoke('send-onboarding-email', {
                body: {
                  email: requestData.email,
                  invite_url: inviteUrl,
                  temporary_password: tempPassword,
                  user_type: requestData.user_type,
                  role: requestData.role
                }
              });

              if (emailError) {
                console.error('Error sending email:', emailError);
                // Update invitation status to failed
                await supabaseClient
                  .from('onboarding_invitations')
                  .update({ status: 'pending' })
                  .eq('id', invitation.id);
              } else {
                // Update invitation status to sent
                await supabaseClient
                  .from('onboarding_invitations')
                  .update({ 
                    status: 'sent',
                    sent_at: new Date().toISOString()
                  })
                  .eq('id', invitation.id);
              }
            } catch (error) {
              console.error('Background email task failed:', error);
            }
          };

          // Start background email task
          EdgeRuntime.waitUntil(emailTask());

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Invitation created successfully',
              invitation_id: invitation.id,
              temporary_password: tempPassword // For demo purposes - remove in production
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } else if (action === 'accept') {
          // Accept invitation and create user account
          const requestData: AcceptInvitationRequest = await req.json();
          
          // Create auth user
          const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: requestData.email,
            password: requestData.password,
            options: {
              emailRedirectTo: `${url.origin}/dashboard`
            }
          });

          if (authError) {
            console.error('Error creating auth user:', authError);
            return new Response(
              JSON.stringify({ success: false, message: authError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Complete onboarding process
          const { data: onboardingResult, error: onboardingError } = await supabaseClient
            .rpc('complete_user_onboarding', {
              p_auth_user_id: authData.user!.id,
              p_invitation_token: requestData.invitation_token
            });

          if (onboardingError || !onboardingResult?.success) {
            console.error('Error completing onboarding:', onboardingError);
            return new Response(
              JSON.stringify({ 
                success: false, 
                message: onboardingResult?.error || 'Failed to complete onboarding' 
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Account created successfully. Please login and change your password.',
              user_type: onboardingResult.user_type,
              tenant_id: onboardingResult.tenant_id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } else if (action === 'change-password') {
          // Change password after first login
          const { new_password } = await req.json();
          
          // Update password
          const { error: passwordError } = await supabaseClient.auth.updateUser({
            password: new_password
          });

          if (passwordError) {
            console.error('Error updating password:', passwordError);
            return new Response(
              JSON.stringify({ success: false, message: passwordError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Complete password change
          const { data: result, error } = await supabaseClient
            .rpc('complete_password_change', {
              p_auth_user_id: (await supabaseClient.auth.getUser()).data.user?.id
            });

          if (error || !result?.success) {
            console.error('Error completing password change:', error);
            return new Response(
              JSON.stringify({ success: false, message: 'Failed to complete password change' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Password changed successfully. Onboarding completed.',
              onboarding_completed: result.onboarding_completed
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'GET':
        if (action === 'verify-token') {
          // Verify invitation token
          const token = url.searchParams.get('token');
          
          if (!token) {
            return new Response(
              JSON.stringify({ success: false, message: 'Token is required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data: invitation, error } = await supabaseClient
            .from('onboarding_invitations')
            .select('*')
            .eq('invitation_token', token)
            .eq('status', 'sent')
            .gt('expires_at', new Date().toISOString())
            .single();

          if (error || !invitation) {
            return new Response(
              JSON.stringify({ success: false, message: 'Invalid or expired token' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              invitation: {
                email: invitation.email,
                user_type: invitation.user_type,
                role: invitation.role,
                temporary_password: invitation.temporary_password
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});