-- Add new settings columns to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS site_title TEXT DEFAULT 'Portfolio',
ADD COLUMN IF NOT EXISTS site_description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS site_keywords TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_github TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_linkedin TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS social_twitter TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS google_analytics TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;