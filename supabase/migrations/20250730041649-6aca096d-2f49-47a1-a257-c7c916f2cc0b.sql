-- Create table for product-provider relationships with sub-names
CREATE TABLE IF NOT EXISTS public.product_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  sub_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, provider_id)
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_product_providers_updated_at
  BEFORE UPDATE ON public.product_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();