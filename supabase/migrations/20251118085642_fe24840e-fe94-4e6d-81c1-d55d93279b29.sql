-- Add display_order column to categories table
ALTER TABLE public.categories 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update existing categories with incremental order
UPDATE public.categories 
SET display_order = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.categories
) AS subquery
WHERE categories.id = subquery.id;