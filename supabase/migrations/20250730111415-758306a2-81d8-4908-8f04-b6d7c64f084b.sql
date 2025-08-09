-- Create provider-LOB relationships for LIC India
INSERT INTO provider_line_of_business (insurance_provider_id, line_of_business_id, is_active, effective_from)
SELECT 
  '3bef1b0d-3fd9-4092-8109-4cb8cc060ddf' as insurance_provider_id,
  lob.id as line_of_business_id,
  true as is_active,
  CURRENT_DATE as effective_from
FROM line_of_business lob
WHERE lob.name IN ('Life', 'Health', 'Motor', 'Travel') 
  AND lob.is_active = true;

-- Create provider-LOB relationships for HDFC Life Insurance (Life and Health focused)
INSERT INTO provider_line_of_business (insurance_provider_id, line_of_business_id, is_active, effective_from)
SELECT 
  ip.id as insurance_provider_id,
  lob.id as line_of_business_id,
  true as is_active,
  CURRENT_DATE as effective_from
FROM insurance_providers ip
CROSS JOIN line_of_business lob
WHERE ip.provider_name = 'HDFC Life Insurance'
  AND lob.name IN ('Life', 'Health', 'Travel')
  AND lob.is_active = true;

-- Create provider-LOB relationships for Bajaj Allianz General (General insurance focused)
INSERT INTO provider_line_of_business (insurance_provider_id, line_of_business_id, is_active, effective_from)
SELECT 
  ip.id as insurance_provider_id,
  lob.id as line_of_business_id,
  true as is_active,
  CURRENT_DATE as effective_from
FROM insurance_providers ip
CROSS JOIN line_of_business lob
WHERE ip.provider_name = 'Bajaj Allianz General'
  AND lob.name IN ('Motor', 'Health', 'Travel', 'Commercial')
  AND lob.is_active = true;

-- Create provider-LOB relationships for SBI Life Insurance (Life insurance focused)
INSERT INTO provider_line_of_business (insurance_provider_id, line_of_business_id, is_active, effective_from)
SELECT 
  ip.id as insurance_provider_id,
  lob.id as line_of_business_id,
  true as is_active,
  CURRENT_DATE as effective_from
FROM insurance_providers ip
CROSS JOIN line_of_business lob
WHERE ip.provider_name = 'SBI Life Insurance'
  AND lob.name IN ('Life', 'Health')
  AND lob.is_active = true;

-- Create provider-LOB relationships for ICICI Lombard (General insurance focused)
INSERT INTO provider_line_of_business (insurance_provider_id, line_of_business_id, is_active, effective_from)
SELECT 
  ip.id as insurance_provider_id,
  lob.id as line_of_business_id,
  true as is_active,
  CURRENT_DATE as effective_from
FROM insurance_providers ip
CROSS JOIN line_of_business lob
WHERE ip.provider_name = 'ICICI Lombard'
  AND lob.name IN ('Motor', 'Health', 'Travel', 'Commercial')
  AND lob.is_active = true;