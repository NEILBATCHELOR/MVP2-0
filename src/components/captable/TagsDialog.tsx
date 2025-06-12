import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/infrastructure/database/client";

interface TagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInvestorIds: string[];
  onTagsApplied: () => void;
  existingTags?: string[];
}

const TagsDialog = ({
  open,
  onOpenChange,
  selectedInvestorIds,
  onTagsApplied,
  existingTags = [],
}: TagsDialogProps) => {
  const [availableTags, setAvailableTags] = useState<string[]>([
    "VIP",
    "Strategic",
    "Early Investor",
    "Advisor",
    "Lead Investor",
    "Follow-on",
    "Institutional",
    "Angel",
    ...existingTags.filter(
      (tag) =>
        ![
          "VIP",
          "Strategic",
          "Early Investor",
          "Advisor",
          "Lead Investor",
          "Follow-on",
          "Institutional",
          "Angel",
        ].includes(tag),
    ),
  ]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  const handleAddNewTag = () => {
    if (!newTag.trim()) return;
    if (availableTags.includes(newTag.trim())) {
      // If tag already exists, just select it
      setSelectedTags((prev) =>
        prev.includes(newTag.trim()) ? prev : [...prev, newTag.trim()],
      );
    } else {
      // Add to available tags and select it
      setAvailableTags((prev) => [...prev, newTag.trim()]);
      setSelectedTags((prev) => [...prev, newTag.trim()]);
    }
    setNewTag("");
  };

  const handleTagSelection = (tag: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTags((prev) => [...prev, tag]);
    } else {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    }
  };

  const handleApplyTags = async () => {
    if (selectedTags.length === 0 || selectedInvestorIds.length === 0) return;

    try {
      setIsApplying(true);

      // In a real implementation, this would update the tags for each investor in Supabase
      // For now, we'll simulate the API call

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Log the operation for demonstration
      console.log("Applying tags:", {
        tags: selectedTags,
        investorIds: selectedInvestorIds,
      });

      // Create a bulk operation record
      const { data, error } = await supabase.from("bulk_operations").insert({
        id: crypto.randomUUID(),
        operation_type: "apply_tags",
        target_ids: selectedInvestorIds,
        status: "completed",
        created_by: "current_user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { tags: selectedTags },
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Tags Applied",
        description: `Applied ${selectedTags.length} tags to ${selectedInvestorIds.length} investors.`,
      });

      // Call the callback to notify parent component
      onTagsApplied();

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error applying tags:", error);
      toast({
        title: "Error",
        description: "Failed to apply tags. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <span>Apply Tags</span>
          </DialogTitle>
          <DialogDescription>
            Apply tags to {selectedInvestorIds.length} selected investor
            {selectedInvestorIds.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Add New Tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter new tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddNewTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Available Tags</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto rounded-md border p-4">
              {availableTags.map((tag) => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={(checked) =>
                      handleTagSelection(tag, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`tag-${tag}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Tags</Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApplyTags}
            disabled={selectedTags.length === 0 || isApplying}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply Tags"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TagsDialog;
