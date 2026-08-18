-- Migration: Add internal_notes column to jewelry_certificates
-- Date: 2026-08-18
-- Description: Add internal_notes column for internal use only

ALTER TABLE jewelry_certificates ADD COLUMN internal_notes TEXT;

-- Add index for faster queries if needed
CREATE INDEX idx_jewelry_certificates_internal_notes ON jewelry_certificates(internal_notes);
