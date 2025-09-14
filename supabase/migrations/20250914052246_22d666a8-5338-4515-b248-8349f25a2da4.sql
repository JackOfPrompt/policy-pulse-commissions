-- Fix security warning by setting search_path on the function
CREATE OR REPLACE FUNCTION assign_free_plan_to_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  free_plan_id uuid;
begin
  -- Get the free plan id
  select id into free_plan_id from plans where name = 'free' limit 1;
  
  -- Create subscription with trial period
  if free_plan_id is not null then
    insert into subscriptions (org_id, plan_id, status, start_date, trial_end)
    values (
      new.id,
      free_plan_id,
      'trialing',
      now(),
      now() + interval '60 days'
    );
  end if;
  
  return new;
end;
$$;