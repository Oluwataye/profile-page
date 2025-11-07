-- Add logo and favicon URL columns to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS favicon_url text;