import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, GripVertical, Upload } from "lucide-react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";

interface ImageUploadManagerProps {
  images: File[];
  existingImages?: string[];
  onImagesChange: (images: File[]) => void;
  onExistingImagesChange?: (images: string[]) => void;
}

export const ImageUploadManager = ({
  images,
  existingImages = [],
  onImagesChange,
  onExistingImagesChange,
}: ImageUploadManagerProps) => {
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    images.map(file => URL.createObjectURL(file))
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onImagesChange([...images, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeNewImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
    
    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const removeExistingImage = (index: number) => {
    if (onExistingImagesChange) {
      const newExisting = [...existingImages];
      newExisting.splice(index, 1);
      onExistingImagesChange(newExisting);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const allImages = [...existingImages, ...imagePreviews];
    const [reorderedItem] = allImages.splice(result.source.index, 1);
    allImages.splice(result.destination.index, 0, reorderedItem);

    const existingCount = existingImages.length;
    if (onExistingImagesChange) {
      onExistingImagesChange(allImages.slice(0, existingCount));
    }
    
    const newImagePreviews = allImages.slice(existingCount);
    setImagePreviews(newImagePreviews);
    
    // Reorder the actual files
    const reorderedFiles = newImagePreviews.map((preview) => {
      const index = imagePreviews.indexOf(preview);
      return images[index];
    });
    onImagesChange(reorderedFiles);
  };

  const allDisplayImages = [...existingImages, ...imagePreviews];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="gallery-images" className="cursor-pointer">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Upload className="w-4 h-4" />
            Project Gallery Images
          </div>
        </Label>
        <Input
          id="gallery-images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="cursor-pointer"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Upload multiple images for the project gallery. Drag to reorder.
        </p>
      </div>

      {allDisplayImages.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {allDisplayImages.map((image, index) => {
                  const isExisting = index < existingImages.length;
                  return (
                    <Draggable key={`image-${index}`} draggableId={`image-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative aspect-video rounded-lg border-2 overflow-hidden ${
                            snapshot.isDragging ? 'border-primary shadow-lg' : 'border-border'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 left-2 p-1 bg-background/80 rounded cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() =>
                              isExisting
                                ? removeExistingImage(index)
                                : removeNewImage(index - existingImages.length)
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                            {index + 1}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};
