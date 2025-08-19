import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { action, ...params } = await req.json()
    console.log('Agent management action:', action, 'params:', params)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      supabase.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: ''
      })
    }

    switch (action) {
      case 'get_agents':
        return await getAgents(supabase, params)
      case 'create_agent':
        return await createAgent(supabase, params)
      case 'update_agent':
        return await updateAgent(supabase, params)
      case 'delete_agent':
        return await deleteAgent(supabase, params)
      case 'get_agent_detail':
        return await getAgentDetail(supabase, params)
      case 'submit_exam':
        return await submitExam(supabase, params)
      case 'process_approval':
        return await processApproval(supabase, params)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in agents-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getAgents(supabase: any, params: any) {
  try {
    let query = supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (params.tenant_id) {
      query = query.eq('tenant_id', params.tenant_id)
    }
    if (params.agent_type) {
      query = query.eq('agent_type', params.agent_type)
    }
    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.search) {
      query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,agent_id.eq.${params.search}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching agents:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in getAgents:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function createAgent(supabase: any, params: any) {
  try {
    const { agent_type, full_name, email, phone, tenant_id, created_by } = params

    // Determine initial status based on agent type
    let status = 'PENDING'
    if (agent_type === 'POSP') {
      status = 'EXAM_PENDING'
    }

    // Insert agent
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .insert({
        agent_type,
        full_name,
        email,
        phone,
        status,
        tenant_id,
        created_by
      })
      .select()
      .single()

    if (agentError) {
      console.error('Error creating agent:', agentError)
      throw agentError
    }

    // If POSP, create exam entry
    if (agent_type === 'POSP') {
      const { error: examError } = await supabase
        .from('agent_exams')
        .insert({
          agent_id: agentData.agent_id,
          status: 'ASSIGNED'
        })

      if (examError) {
        console.error('Error creating exam entry:', examError)
        // Don't fail the whole operation for this
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: agentData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in createAgent:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function updateAgent(supabase: any, params: any) {
  try {
    const { agent_id, ...updateData } = params

    const { data, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('agent_id', agent_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating agent:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in updateAgent:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function deleteAgent(supabase: any, params: any) {
  try {
    const { agent_id } = params

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('agent_id', agent_id)

    if (error) {
      console.error('Error deleting agent:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in deleteAgent:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getAgentDetail(supabase: any, params: any) {
  try {
    const { agent_id } = params

    // Get agent with exam and approvals
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agent_id)
      .single()

    if (agentError) {
      console.error('Error fetching agent:', agentError)
      throw agentError
    }

    // Get exam data if POSP
    let exam = null
    if (agent.agent_type === 'POSP') {
      const { data: examData } = await supabase
        .from('agent_exams')
        .select('*')
        .eq('agent_id', agent_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      exam = examData
    }

    // Get approval history
    const { data: approvals } = await supabase
      .from('agent_approvals')
      .select('*')
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...agent,
          exam,
          approvals: approvals || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in getAgentDetail:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function submitExam(supabase: any, params: any) {
  try {
    const { agent_id, score, status } = params

    // Update or create exam record
    const { data: existingExam } = await supabase
      .from('agent_exams')
      .select('exam_id')
      .eq('agent_id', agent_id)
      .maybeSingle()

    let examData
    if (existingExam) {
      const { data, error } = await supabase
        .from('agent_exams')
        .update({
          score,
          status,
          exam_date: new Date().toISOString()
        })
        .eq('exam_id', existingExam.exam_id)
        .select()
        .single()

      if (error) throw error
      examData = data
    } else {
      const { data, error } = await supabase
        .from('agent_exams')
        .insert({
          agent_id,
          score,
          status,
          exam_date: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      examData = data
    }

    // Update agent status based on exam result
    const newAgentStatus = status === 'PASSED' ? 'EXAM_PASSED' : 'REJECTED'
    const { error: agentUpdateError } = await supabase
      .from('agents')
      .update({ status: newAgentStatus })
      .eq('agent_id', agent_id)

    if (agentUpdateError) {
      console.error('Error updating agent status:', agentUpdateError)
      throw agentUpdateError
    }

    return new Response(
      JSON.stringify({ success: true, data: examData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in submitExam:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function processApproval(supabase: any, params: any) {
  try {
    const { agent_id, approver_id, decision, comments, level = 1 } = params

    // Create approval record
    const { data: approvalData, error: approvalError } = await supabase
      .from('agent_approvals')
      .insert({
        agent_id,
        approver_id,
        level,
        decision,
        comments,
        decision_date: new Date().toISOString()
      })
      .select()
      .single()

    if (approvalError) {
      console.error('Error creating approval record:', approvalError)
      throw approvalError
    }

    // Update agent status based on decision
    const newStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'
    const { error: agentUpdateError } = await supabase
      .from('agents')
      .update({ status: newStatus })
      .eq('agent_id', agent_id)

    if (agentUpdateError) {
      console.error('Error updating agent status:', agentUpdateError)
      throw agentUpdateError
    }

    return new Response(
      JSON.stringify({ success: true, data: approvalData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in processApproval:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}