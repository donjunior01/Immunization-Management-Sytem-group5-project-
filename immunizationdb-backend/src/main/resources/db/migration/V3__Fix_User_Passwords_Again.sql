-- Fix user passwords with properly formatted BCrypt hash for "Password123!"
-- Using dollar-quote syntax to avoid escaping issues
UPDATE users 
SET password = '$2a$12$.4qFisHXCJZsQog8d8iYveyZJg7dVasFEy1/zJzShHvvkDubdpwqi'
WHERE username IN ('health.worker', 'facility.manager', 'gov.official');
