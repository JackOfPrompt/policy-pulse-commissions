-- Populate line_of_business table with enum values
INSERT INTO public.line_of_business (name, code, description, is_active) VALUES
('Health', 'HEALTH', 'Health Insurance products including individual and family health plans', true),
('Motor', 'MOTOR', 'Motor Insurance products including car, bike, and commercial vehicle insurance', true),
('Life', 'LIFE', 'Life Insurance products including term, whole life, and endowment plans', true),
('Travel', 'TRAVEL', 'Travel Insurance products for domestic and international travel', true),
('Loan', 'LOAN', 'Loan Insurance products including home loan and personal loan protection', true),
('Pet', 'PET', 'Pet Insurance products for dogs, cats, and other domestic animals', true),
('Commercial', 'COMMERCIAL', 'Commercial Insurance products for businesses and enterprises', true);