-- Add administration_site column to vaccinations table
ALTER TABLE vaccinations 
ADD COLUMN IF NOT EXISTS administration_site VARCHAR(50);

-- Update existing records with default value if column was just added
UPDATE vaccinations 
SET administration_site = 'LEFT_ARM' 
WHERE administration_site IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE vaccinations 
ALTER COLUMN administration_site SET NOT NULL;




