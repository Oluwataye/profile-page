import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import * as Icons from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
}

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryChange: (categoryIds: string[]) => void;
}

export const CategoryFilter = ({ selectedCategories, onCategoryChange }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const clearFilters = () => {
    onCategoryChange([]);
  };

  if (categories.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filter by Category</h3>
        {selectedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const IconComponent = category.icon && (Icons as any)[category.icon] 
            ? (Icons as any)[category.icon] 
            : null;

          return (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer transition-all duration-200 hover:scale-105 flex items-center gap-1.5"
              style={{
                backgroundColor: selectedCategories.includes(category.id) ? category.color : 'transparent',
                borderColor: category.color,
                color: selectedCategories.includes(category.id) ? 'white' : category.color,
              }}
              onClick={() => toggleCategory(category.id)}
            >
              {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
              {category.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
