-- Update the test user with a properly hashed password
UPDATE users_auth 
SET password_hash = '$2b$10$QZFllJ4XZfdILbMGCKJ/oeKjVvG5qMV2YVVz.0uqS3TbRzW/oKPRe'
WHERE phone_number = '9999999999';

-- The new hash corresponds to 'Admin@123'