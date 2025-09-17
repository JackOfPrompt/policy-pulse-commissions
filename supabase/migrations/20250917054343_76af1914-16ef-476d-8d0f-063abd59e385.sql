-- Update existing agents to use employee_code 71092 as default reporting manager
DO $$
DECLARE
  default_employee_id uuid;
BEGIN
  -- Find the employee with employee_code 71092
  SELECT id INTO default_employee_id 
  FROM employees 
  WHERE employee_code = '71092' 
  LIMIT 1;

  -- Update all agents that don't have a reporting_manager_id set
  IF default_employee_id IS NOT NULL THEN
    UPDATE agents 
    SET reporting_manager_id = default_employee_id,
        updated_at = now()
    WHERE reporting_manager_id IS NULL;
    
    RAISE NOTICE 'Updated % agents to use employee_code 71092 as reporting manager', 
                 (SELECT count(*) FROM agents WHERE reporting_manager_id = default_employee_id);
  ELSE
    RAISE NOTICE 'Employee with employee_code 71092 not found';
  END IF;
END $$;