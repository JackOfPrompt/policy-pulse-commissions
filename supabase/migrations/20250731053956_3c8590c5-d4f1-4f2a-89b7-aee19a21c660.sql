-- Check existing roles constraint and fix auth system
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users_auth'::regclass AND contype = 'c';