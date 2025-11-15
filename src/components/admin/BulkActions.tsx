import { Button } from "@/components/ui/button";
import { Trash2, Eye, EyeOff, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkActionsProps {
  selectedCount: number;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onAssignCategories: () => void;
}

export const BulkActions = ({
  selectedCount,
  onPublish,
  onUnpublish,
  onDelete,
  onAssignCategories,
}: BulkActionsProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border-2 border-primary/30">
      <span className="text-sm font-medium">
        {selectedCount} project{selectedCount > 1 ? 's' : ''} selected
      </span>
      <div className="flex gap-2 ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={onPublish}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          Publish
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onUnpublish}
          className="gap-2"
        >
          <EyeOff className="w-4 h-4" />
          Unpublish
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onAssignCategories}
          className="gap-2"
        >
          <Tag className="w-4 h-4" />
          Assign Categories
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
    </div>
  );
};
