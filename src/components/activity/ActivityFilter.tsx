import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  ActivitySource, 
  ActivityCategory, 
  ActivityStatus,
  ActivitySeverity 
} from "@/types/domain/activity/ActivityTypes";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface ActivityFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: {
    action_type: string;
    entity_type: string;
    status: string;
    start_date: string;
    end_date: string;
    source: string;
    category: string;
    severity: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  actionTypes: string[];
  entityTypes: string[];
  sources: string[];
}

const ActivityFilter: React.FC<ActivityFilterProps> = ({
  searchQuery,
  setSearchQuery,
  filters,
  onFilterChange,
  onSearch,
  onReset,
  actionTypes,
  entityTypes,
  sources
}) => {
  // Format category names for display
  const formatCategoryName = (category: string) => {
    return category
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format action type names for display
  const formatActionType = (actionType: string) => {
    if (!actionType) return "";
    return actionType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get all categories from enum
  const categories = Object.values(ActivityCategory);

  // Get all sources from enum
  const allSources = Object.values(ActivitySource);

  // Get all statuses from enum
  const statuses = Object.values(ActivityStatus);

  // Get all severities from enum
  const severities = Object.values(ActivitySeverity);

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="pl-8"
          />
        </div>
        <Button onClick={onSearch}>Search</Button>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-md">
        {/* Action Type */}
        <div className="space-y-2">
          <Label htmlFor="action-type">Action Type</Label>
          <Select
            value={filters.action_type}
            onValueChange={(value) => onFilterChange("action_type", value)}
          >
            <SelectTrigger id="action-type">
              <SelectValue placeholder="Select action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {formatActionType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type */}
        <div className="space-y-2">
          <Label htmlFor="entity-type">Entity Type</Label>
          <Select
            value={filters.entity_type}
            onValueChange={(value) => onFilterChange("entity_type", value)}
          >
            <SelectTrigger id="entity-type">
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Entities</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatCategoryName(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Source */}
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select
            value={filters.source}
            onValueChange={(value) => onFilterChange("source", value)}
          >
            <SelectTrigger id="source">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sources</SelectItem>
              {allSources.map((source) => (
                <SelectItem key={source} value={source}>
                  {formatCategoryName(source)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => onFilterChange("category", value)}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {formatCategoryName(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <Label htmlFor="severity">Severity</Label>
          <Select
            value={filters.severity}
            onValueChange={(value) => onFilterChange("severity", value)}
          >
            <SelectTrigger id="severity">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Severities</SelectItem>
              {severities.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {formatCategoryName(severity)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <DatePicker
            date={filters.start_date ? new Date(filters.start_date) : undefined}
            onSelect={(date) =>
              onFilterChange("start_date", date ? date.toISOString() : "")
            }
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <DatePicker
            date={filters.end_date ? new Date(filters.end_date) : undefined}
            onSelect={(date) =>
              onFilterChange("end_date", date ? date.toISOString() : "")
            }
          />
        </div>

        {/* Reset Button */}
        <div className="md:col-span-3 flex justify-end">
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityFilter; 