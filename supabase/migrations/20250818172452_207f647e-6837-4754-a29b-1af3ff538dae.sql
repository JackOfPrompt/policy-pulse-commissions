-- Complete Workflow Instances Migration

-- Migrate agent_approvals → workflow_instances
INSERT INTO workflow_instances (
    id, entity_type, entity_id, workflow_type, current_step, status,
    workflow_config, step_history, approvals, assigned_to, assigned_at,
    tenant_id, created_by, created_at, updated_at, legacy_entity_id
)
SELECT 
    gen_random_uuid() as id,
    'agent' as entity_type,
    aa.agent_id::text as entity_id, -- Convert to text
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
    COALESCE(aa.decision_date, aa.created_at) as updated_at,
    aa.agent_id as legacy_entity_id
    
FROM agent_approvals aa
JOIN agents a ON aa.agent_id = a.agent_id;

-- Final Migration Summary
SELECT 
    'REMAINING MIGRATIONS COMPLETED' as status,
    table_name,
    COUNT(*) as migrated_records
FROM (
    SELECT 'products_unified' as table_name, COUNT(*) FROM products_unified
    UNION ALL
    SELECT 'workflow_instances' as table_name, COUNT(*) FROM workflow_instances  
    UNION ALL
    SELECT 'master_reference_data' as table_name, COUNT(*) FROM master_reference_data
) migration_summary
GROUP BY table_name
ORDER BY table_name;