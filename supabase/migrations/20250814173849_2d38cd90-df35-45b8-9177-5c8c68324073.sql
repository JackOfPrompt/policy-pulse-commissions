-- Add provider_id to master_product_name table
ALTER TABLE public.master_product_name 
ADD COLUMN provider_id uuid;

-- Add foreign key constraint to link with master_insurance_providers
ALTER TABLE public.master_product_name 
ADD CONSTRAINT fk_product_provider 
FOREIGN KEY (provider_id) REFERENCES public.master_insurance_providers(provider_id);