import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";

interface EditableCellProps<T> {
  value: string | number;
  row: T;
  column: string;
  onSave: (row: T, column: string, value: string | number) => Promise<void>;
  editable?: boolean;
  type?: "text" | "number" | "date";
  displayValue?: string;
  formatter?: (value: string | number) => string;
}

export function EditableCell<T>({
  value,
  row,
  column,
  onSave,
  editable = true,
  type = "text",
  displayValue,
  formatter
}: EditableCellProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string | number>(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onSave(row, column, editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving cell value:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const displayFormattedValue = () => {
    if (formatter) {
      return formatter(value);
    }
    return displayValue || value;
  };

  if (!editable) {
    return <div>{displayFormattedValue()}</div>;
  }

  return isEditing ? (
    <div className="flex items-center space-x-2">
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(type === "number" ? Number(e.target.value) : e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 w-full"
        disabled={isSaving}
      />
      <div className="flex space-x-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  ) : (
    <div
      className="group flex items-center space-x-2"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex-1">{displayFormattedValue()}</div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
} 