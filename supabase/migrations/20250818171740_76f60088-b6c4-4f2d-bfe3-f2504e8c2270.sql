-- Workflow Instances (Agent Approvals) Migration
INSERT INTO workflow_instances (
    id, entity_type, entity_id, workflow_type, current_step, status,
    workflow_config, step_history, approvals, assigned_to, assigned_at,
    tenant_id, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id,
    'agent' as entity_type,
    aa.agent_id::uuid as entity_id,
    'agent_approval' as workflow_type,
    CASE 
        WHEN aa.decision = 'approved' THEN 'completed'
        WHEN aa.decision = 'rejected' THEN 'rejected' 
        ELSE 'pending_approval'
    END as current_step,
    CASE 
        WHEN aa.decision = 'approved' THEN 'completed'
        WHEN aa.decision = 'rejected' THEN 'rejected'
        ELSE 'in_progress'
    END as status,
    
    -- Workflow configuration
    jsonb_build_object(
        'approval_levels', aa.level,
        'auto_approval', false,
        'required_documents', '[]'
    ) as workflow_config,
    
    -- Step history
    jsonb_build_array(
        jsonb_build_object(
            'step', 'submitted',
            'timestamp', a.created_at,
            'actor', a.created_by,
            'status', 'completed'
        ),
        jsonb_build_object(
            'step', 'approval_level_' || aa.level,
            'timestamp', COALESCE(aa.decision_date, aa.created_at),
            'actor', aa.approver_id,
            'status', COALESCE(aa.decision, 'pending'),
            'comments', aa.comments
        )
    ) as step_history,
    
    -- Approvals array
    jsonb_build_array(
        jsonb_build_object(
            'level', aa.level,
            'approver_id', aa.approver_id,
            'decision', aa.decision,
            'decision_date', aa.decision_date,
            'comments', aa.comments
        )
    ) as approvals,
    
    aa.approver_id as assigned_to,
    aa.created_at as assigned_at,
    a.tenant_id,
    a.created_by,
    aa.created_at,
    COALESCE(aa.decision_date, aa.created_at) as updated_at
    
FROM agent_approvals aa
JOIN agents a ON aa.agent_id = a.agent_id;

-- Final Migration Summary
SELECT 
    'MIGRATION PHASE COMPLETED' as status,
    'Multiple unified tables' as table_name,
    COUNT(*) as total_unified_records
FROM (
    SELECT id FROM master_reference_data
    UNION ALL
    SELECT id FROM documents_unified
    UNION ALL  
    SELECT id FROM workflow_instances
) unified_data;