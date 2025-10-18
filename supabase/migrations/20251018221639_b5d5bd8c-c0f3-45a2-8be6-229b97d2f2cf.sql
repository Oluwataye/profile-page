-- Add foreign key from comments to profiles for better querying
ALTER TABLE public.comments 
ADD CONSTRAINT comments_profile_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;