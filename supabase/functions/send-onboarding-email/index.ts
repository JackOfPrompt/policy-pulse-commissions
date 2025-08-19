import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OnboardingEmailRequest {
  email: string;
  invite_url: string;
  temporary_password: string;
  user_type: 'employee' | 'agent';
  role: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, invite_url, temporary_password, user_type, role }: OnboardingEmailRequest = await req.json();
    
    // For demo purposes, we'll just log the email content
    // In production, you would integrate with an email service like Resend
    console.log('Sending onboarding email:', {
      to: email,
      subject: `Welcome to the Insurance Portal - ${user_type} Onboarding`,
      content: {
        invite_url,
        temporary_password,
        user_type,
        role
      }
    });

    // Mock email sending (replace with actual email service)
    const emailContent = `
      <h1>Welcome to the Insurance Portal</h1>
      <p>You have been invited to join as a ${user_type} with the role of ${role}.</p>
      
      <h2>Get Started</h2>
      <p>Click the link below to set up your account:</p>
      <p><a href="${invite_url}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Your Registration</a></p>
      
      <h2>Temporary Login Details</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${temporary_password}</p>
      
      <h2>Next Steps</h2>
      <ol>
        <li>Click the registration link above</li>
        <li>Use your email and the temporary password to create your account</li>
        <li>You'll be prompted to change your password on first login</li>
        <li>Complete your profile setup</li>
      </ol>
      
      <p><strong>Important:</strong> This invitation expires in 7 days. Please complete your registration before then.</p>
      
      <p>If you have any questions, please contact your administrator.</p>
      
      <p>Best regards,<br>Insurance Portal Team</p>
    `;

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, you would call your email service here:
    /*
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const emailResponse = await resend.emails.send({
      from: 'Insurance Portal <onboarding@yourcompany.com>',
      to: [email],
      subject: `Welcome to the Insurance Portal - ${user_type} Onboarding`,
      html: emailContent,
    });

    if (emailResponse.error) {
      throw new Error(emailResponse.error.message);
    }
    */

    console.log('Email sent successfully to:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Onboarding email sent successfully',
        // For demo - in production remove this
        demo_content: emailContent 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-onboarding-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to send email' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});