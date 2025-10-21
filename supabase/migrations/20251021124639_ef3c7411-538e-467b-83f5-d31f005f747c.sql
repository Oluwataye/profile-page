-- Expand site_settings table to include all page content
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS hero_heading TEXT DEFAULT 'TAYE-NOCODE',
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT 'Nocode Expert in Lovable, Bolt, V0, Replit @Taye David Ibukun',
ADD COLUMN IF NOT EXISTS about_title TEXT DEFAULT 'About Me',
ADD COLUMN IF NOT EXISTS about_left_heading TEXT DEFAULT 'Nocode Development Expert',
ADD COLUMN IF NOT EXISTS about_left_paragraph1 TEXT DEFAULT 'Specializing in rapid application development using cutting-edge nocode platforms including Lovable, Bolt, V0, and Replit. I transform ideas into functional, scalable applications without traditional coding barriers.',
ADD COLUMN IF NOT EXISTS about_left_paragraph2 TEXT DEFAULT 'With expertise in modern development workflows, I deliver high-quality solutions for startups, enterprises, and individual clients looking to innovate quickly and efficiently.',
ADD COLUMN IF NOT EXISTS about_right_heading TEXT DEFAULT 'What I Offer',
ADD COLUMN IF NOT EXISTS about_services JSONB DEFAULT '["Rapid MVP Development & Prototyping", "Full-Stack Application Development", "Database Design & Integration", "UI/UX Implementation", "Consulting & Technical Partnership"]',
ADD COLUMN IF NOT EXISTS contact_title TEXT DEFAULT 'Get In Touch',
ADD COLUMN IF NOT EXISTS contact_heading TEXT DEFAULT 'Let''s Work Together',
ADD COLUMN IF NOT EXISTS contact_description TEXT DEFAULT 'Whether you''re a startup looking to build your MVP, an enterprise seeking innovation, or an investor exploring opportunities, I''d love to hear from you.',
ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT 'contact@taye-nocode.com',
ADD COLUMN IF NOT EXISTS contact_availability TEXT DEFAULT 'Projects • Partnerships • Consulting',
ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT 'T-Tech Solutions';

-- Update the existing row with default values if it exists
UPDATE public.site_settings 
SET 
  hero_heading = COALESCE(hero_heading, 'TAYE-NOCODE'),
  hero_subtitle = COALESCE(hero_subtitle, 'Nocode Expert in Lovable, Bolt, V0, Replit @Taye David Ibukun'),
  about_title = COALESCE(about_title, 'About Me'),
  about_left_heading = COALESCE(about_left_heading, 'Nocode Development Expert'),
  about_left_paragraph1 = COALESCE(about_left_paragraph1, 'Specializing in rapid application development using cutting-edge nocode platforms including Lovable, Bolt, V0, and Replit. I transform ideas into functional, scalable applications without traditional coding barriers.'),
  about_left_paragraph2 = COALESCE(about_left_paragraph2, 'With expertise in modern development workflows, I deliver high-quality solutions for startups, enterprises, and individual clients looking to innovate quickly and efficiently.'),
  about_right_heading = COALESCE(about_right_heading, 'What I Offer'),
  about_services = COALESCE(about_services, '["Rapid MVP Development & Prototyping", "Full-Stack Application Development", "Database Design & Integration", "UI/UX Implementation", "Consulting & Technical Partnership"]'::jsonb),
  contact_title = COALESCE(contact_title, 'Get In Touch'),
  contact_heading = COALESCE(contact_heading, 'Let''s Work Together'),
  contact_description = COALESCE(contact_description, 'Whether you''re a startup looking to build your MVP, an enterprise seeking innovation, or an investor exploring opportunities, I''d love to hear from you.'),
  contact_email = COALESCE(contact_email, 'contact@taye-nocode.com'),
  contact_availability = COALESCE(contact_availability, 'Projects • Partnerships • Consulting'),
  footer_text = COALESCE(footer_text, 'T-Tech Solutions')
WHERE id = '00000000-0000-0000-0000-000000000001';