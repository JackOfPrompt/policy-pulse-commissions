-- Update the customer_type check constraint to allow more values
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_customer_type_check;

ALTER TABLE customers 
ADD CONSTRAINT customers_customer_type_check 
CHECK (customer_type IN ('individual', 'corporate', 'business', 'self employed', 'company', 'organization', 'partnership', 'trust', 'huf'));