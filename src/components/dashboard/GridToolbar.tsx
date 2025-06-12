import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Trash2,
  Edit,
  ChevronDown,
  Calendar,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { investorTypeCategories } from "@/utils/compliance/investorTypes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface GridToolbarProps {
  setShowAddToGroupDialog?: (show: boolean) => void;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onBulkEdit?: () => void;
  onBulkDelete?: () => void;
  selectedCount?: number;
  onFilterByType?: (typeIds: string[]) => void;
  onFilterByStatus?: (statusIds: string[]) => void;
  onFilterByDateRange?: (
    field: string,
    dateRange: { from: Date | undefined; to: Date | undefined },
  ) => void;
}

const GridToolbar = ({
  setShowAddToGroupDialog = () => {},
  onSearch = () => {},
  onFilter = () => {},
  onBulkEdit = () => {},
  onBulkDelete = () => {},
  selectedCount = 0,
  onFilterByType = () => {},
  onFilterByStatus = () => {},
  onFilterByDateRange = () => {},
}: GridToolbarProps) => {
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const kycStatusOptions = [
    { id: "approved", name: "Approved" },
    { id: "pending", name: "Pending" },
    { id: "failed", name: "Failed" },
    { id: "not_started", name: "Not Started" },
    { id: "expired", name: "Expired" },
  ];
  return (
    <div className="w-full h-14 bg-white border-b flex items-center px-4 justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="pl-10 w-full"
            placeholder="Search investors..."
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>KYC Status</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {kycStatusOptions.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.id}
                    checked={selectedStatuses.includes(status.id)}
                    onCheckedChange={(checked) => {
                      let newSelectedStatuses;
                      if (checked) {
                        newSelectedStatuses = [...selectedStatuses, status.id];
                      } else {
                        newSelectedStatuses = selectedStatuses.filter(
                          (id) => id !== status.id,
                        );
                      }
                      setSelectedStatuses(newSelectedStatuses);
                      onFilterByStatus(newSelectedStatuses);
                    }}
                  >
                    <span className="text-sm">{status.name}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            {investorTypeCategories.map((category) => (
              <DropdownMenuGroup key={category.id}>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {category.name}
                </DropdownMenuLabel>
                {category.types.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type.id}
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={(checked) => {
                      let newSelectedTypes;
                      if (checked) {
                        newSelectedTypes = [...selectedTypes, type.id];
                      } else {
                        newSelectedTypes = selectedTypes.filter(
                          (id) => id !== type.id,
                        );
                      }
                      setSelectedTypes(newSelectedTypes);
                      onFilterByType(newSelectedTypes);
                    }}
                  >
                    <span className="text-sm">{type.name}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                "Date Range"
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <h4 className="font-medium">Filter by Date</h4>
              <p className="text-sm text-muted-foreground">
                KYC Status Last Updated
              </p>
            </div>
            <div className="p-3">
              <CalendarComponent
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from) {
                    setDateRange({ 
                      from: range.from, 
                      to: range.to || undefined 
                    });
                    onFilterByDateRange("lastUpdated", { 
                      from: range.from, 
                      to: range.to || undefined 
                    });
                  } else {
                    setDateRange({ from: undefined, to: undefined });
                    onFilterByDateRange("lastUpdated", { 
                      from: undefined, 
                      to: undefined 
                    });
                  }
                }}
                numberOfMonths={2}
                defaultMonth={new Date()}
              />
            </div>
            <div className="p-3 border-t flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateRange({ from: undefined, to: undefined });
                  onFilterByDateRange("lastUpdated", {
                    from: undefined,
                    to: undefined,
                  });
                }}
              >
                Clear
              </Button>
              <Button size="sm" onClick={() => setIsCalendarOpen(false)}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {selectedCount} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedCount > 0) {
                  setShowAddToGroupDialog(true);
                }
              }}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Groups
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GridToolbar;
