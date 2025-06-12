import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/utils";

export type FilterOperator = "contains" | "equals" | "startsWith" | "endsWith" | 
  "greaterThan" | "lessThan" | "between" | "isNull" | "notNull";

export interface FilterOption {
  column: string;
  operator: FilterOperator;
  value: string | number | null;
  value2?: string | number | null; // For "between" operator
}

interface FilterPopoverProps {
  columns: { id: string; header: React.ReactNode; dataType?: "text" | "number" | "date" }[];
  activeFilters: FilterOption[];
  onAddFilter: (filter: FilterOption) => void;
  onRemoveFilter: (index: number) => void;
}

export function FilterPopover({
  columns,
  activeFilters,
  onAddFilter,
  onRemoveFilter,
}: FilterPopoverProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("contains");
  const [filterValue, setFilterValue] = useState<string>("");
  const [filterValue2, setFilterValue2] = useState<string>("");
  const [open, setOpen] = useState(false);

  const selectedColumnDef = columns.find(col => col.id === selectedColumn);
  const dataType = selectedColumnDef?.dataType || "text";

  const resetForm = () => {
    setFilterValue("");
    setFilterValue2("");
  };

  const handleAddFilter = () => {
    if (!selectedColumn || (!filterValue && !["isNull", "notNull"].includes(selectedOperator))) {
      return;
    }

    // Prepare value based on data type
    let processedValue: string | number | null = filterValue;
    let processedValue2: string | number | null = filterValue2;
    
    if (dataType === "number") {
      // Make sure we have valid numbers
      processedValue = filterValue === "" ? null : Number(filterValue);
      processedValue2 = filterValue2 === "" ? null : Number(filterValue2);
      
      // Ensure the values are numbers and not NaN
      if (processedValue !== null && isNaN(Number(processedValue))) {
        processedValue = 0;
      }
      if (processedValue2 !== null && isNaN(Number(processedValue2))) {
        processedValue2 = 0;
      }
    }

    onAddFilter({
      column: selectedColumn,
      operator: selectedOperator,
      value: processedValue,
      value2: selectedOperator === "between" ? processedValue2 : undefined
    });

    resetForm();
    
    // Close the popover after a slight delay to ensure the filter is applied
    setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  const getOperatorOptions = () => {
    if (dataType === "text") {
      return [
        { value: "contains", label: "Contains" },
        { value: "equals", label: "Equals" },
        { value: "startsWith", label: "Starts with" },
        { value: "endsWith", label: "Ends with" },
        { value: "isNull", label: "Is empty" },
        { value: "notNull", label: "Is not empty" }
      ];
    } else if (dataType === "number") {
      return [
        { value: "equals", label: "Equals" },
        { value: "greaterThan", label: "Greater than" },
        { value: "lessThan", label: "Less than" },
        { value: "between", label: "Between" },
        { value: "isNull", label: "Is empty" },
        { value: "notNull", label: "Is not empty" }
      ];
    } else if (dataType === "date") {
      return [
        { value: "equals", label: "On" },
        { value: "greaterThan", label: "After" },
        { value: "lessThan", label: "Before" },
        { value: "between", label: "Between" },
        { value: "isNull", label: "Is empty" },
        { value: "notNull", label: "Is not empty" }
      ];
    }
    return [];
  };

  const getOperatorLabel = (operator: FilterOperator) => {
    return getOperatorOptions().find(op => op.value === operator)?.label || operator;
  };

  const getColumnLabel = (columnId: string) => {
    return columns.find(col => col.id === columnId)?.header || columnId;
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3.5 w-3.5 mr-2" />
              Add Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filter</h4>
                <p className="text-sm text-muted-foreground">
                  Create a custom filter for this column.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="column">Column</Label>
                  <Select
                    value={selectedColumn}
                    onValueChange={setSelectedColumn}
                  >
                    <SelectTrigger id="column">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.header as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedColumn && (
                  <>
                    <div className="grid grid-cols-1 gap-2">
                      <Label htmlFor="operator">Operator</Label>
                      <Select
                        value={selectedOperator}
                        onValueChange={(value) => setSelectedOperator(value as FilterOperator)}
                      >
                        <SelectTrigger id="operator">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorOptions().map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {!["isNull", "notNull"].includes(selectedOperator) && (
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="value">Value</Label>
                        <Input
                          id="value"
                          type={dataType === "number" ? "number" : dataType === "date" ? "date" : "text"}
                          value={filterValue}
                          onChange={(e) => setFilterValue(e.target.value)}
                          placeholder="Enter value"
                        />
                      </div>
                    )}
                    
                    {selectedOperator === "between" && (
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="value2">Second Value</Label>
                        <Input
                          id="value2"
                          type={dataType === "number" ? "number" : dataType === "date" ? "date" : "text"}
                          value={filterValue2}
                          onChange={(e) => setFilterValue2(e.target.value)}
                          placeholder="Enter second value"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <Button onClick={handleAddFilter} disabled={!selectedColumn || (!filterValue && !["isNull", "notNull"].includes(selectedOperator))} className="w-full">
                Add Filter
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {activeFilters.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2" 
            onClick={() => {
              // Remove filters from the last to first to avoid index shifting issues
              for (let i = activeFilters.length - 1; i >= 0; i--) {
                onRemoveFilter(i);
              }
            }}
          >
            Clear All
          </Button>
        )}
      </div>
      
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 py-2">
          {activeFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <span className="font-medium">{getColumnLabel(filter.column)}</span>
              <span className="text-xs px-1">{getOperatorLabel(filter.operator)}</span>
              {!["isNull", "notNull"].includes(filter.operator) && (
                <span>{filter.value}</span>
              )}
              {filter.operator === "between" && filter.value2 && (
                <span>and {filter.value2}</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onRemoveFilter(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 