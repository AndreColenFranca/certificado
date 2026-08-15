-- Add images column to jewelry_certificates table
ALTER TABLE jewelry_certificates
ADD COLUMN images text[] DEFAULT '{}';
