-- Update user passwords with correct BCrypt hash for "Password123!"
-- This hash was verified to work with Spring Security BCrypt
UPDATE users 
SET password = '$$2a$$12$$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi'
WHERE username IN ('health.worker', 'facility.manager', 'gov.official');
