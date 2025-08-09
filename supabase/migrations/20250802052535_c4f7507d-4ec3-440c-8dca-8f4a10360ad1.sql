-- Fix the policy_type check constraint to allow more common policy types

-- First, drop the existing constraint
ALTER TABLE public.policies_new DROP CONSTRAINT IF EXISTS policies_new_policy_type_check;

-- Add a new constraint with more comprehensive policy types
ALTER TABLE public.policies_new ADD CONSTRAINT policies_new_policy_type_check 
CHECK (policy_type = ANY (ARRAY[
    'New'::text, 
    'Renewal'::text, 
    'Roll-over'::text, 
    'Ported'::text,
    'Fresh'::text,
    'Rollover'::text,
    'Port'::text,
    'Fresh Business'::text,
    'Renewal Business'::text,
    'Portability'::text
]));