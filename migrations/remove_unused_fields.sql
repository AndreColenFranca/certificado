-- Remove unused fields from jewelry_certificates table
-- These fields were never being saved or used in the application

ALTER TABLE jewelry_certificates
DROP COLUMN IF EXISTS frames_360,
DROP COLUMN IF EXISTS video_360_url;
