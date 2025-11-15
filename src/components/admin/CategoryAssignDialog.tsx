import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoryAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectIds: string[];
  onSuccess: () => void;
}

export const CategoryAssignDialog = ({
  open,
  onOpenChange,
  projectIds,
  onSuccess,
}: CategoryAssignDialogProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleAssign = async () => {
    setLoading(true);
    try {
      // First, remove all existing category assignments for these projects
      const { error: deleteError } = await supabase
        .from("project_categories")
        .delete()
        .in("project_id", projectIds);

      if (deleteError) throw deleteError;

      // Then add the new category assignments
      if (selectedCategories.length > 0) {
        const assignments = projectIds.flatMap(projectId =>
          selectedCategories.map(categoryId => ({
            project_id: projectId,
            category_id: categoryId,
          }))
        );

        const { error: insertError } = await supabase
          .from("project_categories")
          .insert(assignments);

        if (insertError) throw insertError;
      }

      toast.success(`Categories assigned to ${projectIds.length} project(s)`);
      onSuccess();
      onOpenChange(false);
      setSelectedCategories([]);
    } catch (error: any) {
      console.error("Error assigning categories:", error);
      toast.error("Failed to assign categories");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Categories</DialogTitle>
          <DialogDescription>
            Select categories to assign to {projectIds.length} selected project(s)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <Label
                htmlFor={category.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </Label>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? "Assigning..." : "Assign Categories"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
