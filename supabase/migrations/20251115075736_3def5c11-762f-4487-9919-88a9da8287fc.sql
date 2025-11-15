-- Add default_thumbnail_url column to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN default_thumbnail_url text DEFAULT NULL;