-- Add provider-LOB relationships for existing providers
INSERT INTO provider_line_of_business (insurance_provider_id, line_of_business_id, is_active) VALUES
-- Health providers
('17dfb18e-2cf5-4d93-adb1-8ea3929761af', 'fb677b07-9203-47d9-a86b-fb4560707999', true), -- HDFC ERGO - Health
('ed99381c-a1c9-4717-bb65-97cb50070434', 'fb677b07-9203-47d9-a86b-fb4560707999', true), -- Bajaj Allianz - Health
('78a6bd82-27a5-4214-b900-5046d7c33c06', 'fb677b07-9203-47d9-a86b-fb4560707999', true), -- ICICI Lombard - Health

-- Motor providers  
('51301873-979b-46eb-9ba6-782cd3434d22', 'ed7a2a15-8866-468f-913b-c969b0e77779', true), -- BAJAJ - Motor
('ed99381c-a1c9-4717-bb65-97cb50070434', 'ed7a2a15-8866-468f-913b-c969b0e77779', true), -- Bajaj Allianz - Motor
('78a6bd82-27a5-4214-b900-5046d7c33c06', 'ed7a2a15-8866-468f-913b-c969b0e77779', true), -- ICICI Lombard - Motor

-- Life providers
('7603aa63-5687-47f1-9937-3e9073a8234a', '6cb42baa-5b57-4797-b1dc-7816fd25f5ca', true), -- Bajaj Life - Life
('4d3cac2b-9fe7-4b20-a6ca-e9ae875d2b5f', '6cb42baa-5b57-4797-b1dc-7816fd25f5ca', true), -- ICICI Life - Life
('695323dc-9e79-40ae-a599-07008ad46871', '6cb42baa-5b57-4797-b1dc-7816fd25f5ca', true), -- HDFC Life - Life

-- Travel providers
('2849fef1-b8ab-4d1b-9520-6f63c72174af', 'cea63bf8-29d9-43ca-9be0-032b00846b42', true), -- Reliance General - Travel
('17dfb18e-2cf5-4d93-adb1-8ea3929761af', 'cea63bf8-29d9-43ca-9be0-032b00846b42', true), -- HDFC ERGO - Travel

-- Commercial providers
('517467c4-ed41-42ed-a27c-47084986a8ef', '1a8788f2-95cd-42cc-ba5d-121935e2dc8b', true), -- SHRIRAM - Commercial
('228b57db-8834-4270-83ee-a244110c6206', '1a8788f2-95cd-42cc-ba5d-121935e2dc8b', true); -- Shriram General - Commercial