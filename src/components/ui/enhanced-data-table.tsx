import React, { useState, useEffect, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterPopover, FilterOption } from "@/components/ui/filter-popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowUpDown, 
  ChevronDown, 
  Download, 
  MoreHorizontal, 
  X, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUpDown 
} from "lucide-react";
import { downloadCSV, generateCSV } from "@/utils/shared/formatting/csv";
import { Badge } from "@/components/ui/badge";

// Add alignment property to the meta object in the ColumnDef type
// This approach uses the meta property which is explicitly designed for custom properties
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends unknown, TValue> {
    alignment?: 'left' | 'right' | 'center';
  }
}

export interface DataTableColumnOptions {
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableHiding?: boolean;
  dataType?: "text" | "number" | "date";
}

export interface EnhancedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowEditSave?: (rowData: TData) => Promise<void>;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  getRowId?: (row: TData) => string;
  initialSorting?: SortingState;
  initialFilters?: FilterOption[];
  paginationPageSize?: number;
  exportFilename?: string;
}

// Column header component for sortable columns
function SortableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: any;
  title: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.clearSorting()}>
            <ChevronsUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Clear
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <X className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function EnhancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  onRowEditSave,
  enableRowSelection = false,
  onRowSelectionChange,
  getRowId,
  initialSorting = [],
  initialFilters = [],
  paginationPageSize = 10,
  exportFilename = "export",
}: EnhancedDataTableProps<TData, TValue>) {
  // States
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [advancedFilters, setAdvancedFilters] = useState<FilterOption[]>(initialFilters);

  // Handle row selection changes
  useEffect(() => {
    if (onRowSelectionChange) {
      onRowSelectionChange(rowSelection);
    }
  }, [rowSelection, onRowSelectionChange]);

  // Apply advanced filters to columnFilters
  useEffect(() => {
    if (advancedFilters.length === 0) {
      // If there are no advanced filters, we only need to keep the search filter
      const searchFilter = columnFilters.find(cf => cf.id === searchKey);
      setColumnFilters(searchFilter ? [searchFilter] : []);
      return;
    }

    // Convert advanced filters to column filters for TanStack Table
    const newColumnFilters: ColumnFiltersState = advancedFilters.map(filter => {
      const { column, operator, value, value2 } = filter;
      // The filter function will be applied in the column def
      return {
        id: column,
        value: { operator, value, value2 }
      };
    });

    setColumnFilters(prev => {
      // Keep search filter if it exists
      const searchFilter = searchKey ? prev.find(cf => cf.id === searchKey) : null;
      
      // Start with advanced filters
      let updatedFilters = [...newColumnFilters];
      
      // Add search filter if it exists
      if (searchFilter) {
        updatedFilters.push(searchFilter);
      }
      
      return updatedFilters;
    });
  }, [advancedFilters, searchKey]);

  // Convert columns to include filtering options
  const enhancedColumns = useMemo(() => {
    return columns.map(column => {
      const originalColumn = { ...column } as any; // Use any to bypass type checking for properties we need to access
      
      // Add filter function if not already defined
      if (!originalColumn.filterFn) {
        originalColumn.filterFn = (row, columnId, filterValue) => {
          if (!filterValue) return true;
          
          // Handle different types of filter values
          if (typeof filterValue === 'string') {
            // This is a simple string filter (like from the search box)
            const cellValue = row.getValue(columnId);
            if (cellValue === null || cellValue === undefined) return false;
            
            return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
          }
          
          // Handle advanced filter objects
          const { operator, value, value2 } = filterValue as { 
            operator: string; 
            value: string | number | null;
            value2?: string | number | null;
          };
          
          // Get the cell value
          const rawCellValue = row.getValue(columnId);
          
          // Handle null, undefined, or empty values
          if (rawCellValue === null || rawCellValue === undefined || rawCellValue === '') {
            return ["isNull", "notNull"].includes(operator) 
              ? operator === "isNull" 
              : false;
          }
          
          // Convert to string for string operations
          const cellValue = String(rawCellValue).toLowerCase();
          const stringValue = value !== null ? String(value).toLowerCase() : '';
          
          // If we have empty value and not checking for null, return false
          if (!cellValue && !["isNull", "notNull"].includes(operator)) {
            return false;
          }

          // Handle different operators
          switch (operator) {
            case "contains":
              return cellValue.includes(stringValue);
            case "equals":
              return cellValue === stringValue;
            case "startsWith":
              return cellValue.startsWith(stringValue);
            case "endsWith":
              return cellValue.endsWith(stringValue);
            case "greaterThan":
              // Use numeric comparison for numbers
              const gtCellNum = typeof rawCellValue === 'number' ? rawCellValue : parseFloat(cellValue);
              const gtValueNum = typeof value === 'number' ? value : parseFloat(stringValue);
              return !isNaN(gtCellNum) && !isNaN(gtValueNum) && gtCellNum > gtValueNum;
            case "lessThan":
              const ltCellNum = typeof rawCellValue === 'number' ? rawCellValue : parseFloat(cellValue);
              const ltValueNum = typeof value === 'number' ? value : parseFloat(stringValue);
              return !isNaN(ltCellNum) && !isNaN(ltValueNum) && ltCellNum < ltValueNum;
            case "between":
              if (value === null || value2 === null) return false;
              
              const btCellNum = typeof rawCellValue === 'number' ? rawCellValue : parseFloat(cellValue);
              const btValueNum1 = typeof value === 'number' ? value : parseFloat(String(value));
              const btValueNum2 = typeof value2 === 'number' ? value2 : parseFloat(String(value2));
              
              return !isNaN(btCellNum) && !isNaN(btValueNum1) && !isNaN(btValueNum2) && 
                     btCellNum >= btValueNum1 && btCellNum <= btValueNum2;
            case "isNull":
              return !cellValue || cellValue.trim() === "";
            case "notNull":
              return cellValue && cellValue.trim() !== "";
            default:
              return true;
          }
        };
      }

      // Add enhanced sorting UI to header if enableSorting
      if (originalColumn.enableSorting !== false && !originalColumn.header) {
        originalColumn.header = ({ column }) => (
          <SortableColumnHeader 
            column={column} 
            title={String(originalColumn.id || originalColumn.accessorKey || "")} 
          />
        );
      }

      return originalColumn;
    });
  }, [columns]);

  // Table instance
  const table = useReactTable({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId: getRowId,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: paginationPageSize,
      },
    },
  });

  // Filter handling
  const handleAddFilter = (filter: FilterOption) => {
    setAdvancedFilters(prev => [...prev, filter]);
  };

  const handleRemoveFilter = (index: number) => {
    // Create a new array without the removed filter
    const updatedFilters = [...advancedFilters.filter((_, i) => i !== index)];
    setAdvancedFilters(updatedFilters);
    
    // If we've removed all filters, clear column filters that are from advanced filtering
    if (updatedFilters.length === 0) {
      const searchFilter = searchKey ? columnFilters.find(cf => cf.id === searchKey) : null;
      setColumnFilters(searchFilter ? [searchFilter] : []);
    }
  };

  // Filterable columns for advanced filtering
  const filterableColumns = useMemo(() => {
    return enhancedColumns
      .filter(col => (col as any).enableFiltering !== false)
      .map(col => {
        const column = col as any; // Use type assertion to access properties
        return {
          id: String(column.id || (typeof column.accessorKey === 'string' ? column.accessorKey : '')),
          header: typeof column.header === 'string' 
            ? column.header 
            : String(column.id || (typeof column.accessorKey === 'string' ? column.accessorKey : '')),
          dataType: column.dataType || "text"
        };
      });
  }, [enhancedColumns]);

  // Export table data
  const handleExport = () => {
    // Get visible and filtered rows
    const rows = table.getFilteredRowModel().rows;
    
    // Get headers from visible columns
    const visibleColumns = table.getVisibleLeafColumns();
    const headers = visibleColumns.map(col => col.id);
    
    // Get data from rows
    const exportData = rows.map(row => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => {
        rowData[col.id] = row.getValue(col.id);
      });
      return rowData;
    });
    
    // Generate and download CSV
    const csvContent = generateCSV(exportData, headers);
    downloadCSV(csvContent, `${exportFilename}.csv`);
  };

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex justify-between items-center">
        {/* Search input */}
        {searchKey && (
          <div className="flex items-center w-2/3">
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="w-full"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Advanced filters - Moved to right side */}
          <FilterPopover
            columns={filterableColumns}
            activeFilters={advancedFilters}
            onAddFilter={handleAddFilter}
            onRemoveFilter={handleRemoveFilter}
          />
          
          {/* Export */}
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Active filters display - Kept below the toolbar */}
      {advancedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 py-2">
          {advancedFilters.map((filter, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <span>{filterableColumns.find(col => col.id === filter.column)?.header || filter.column}</span>
              <span className="text-xs px-1">{filter.operator}</span>
              <span>{filter.value}</span>
              {filter.operator === "between" && filter.value2 && (
                <span>and {filter.value2}</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => handleRemoveFilter(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div className={
                        // Apply alignment class based on column meta
                        `${header.column.columnDef.meta?.alignment === 'right' ? 'text-right' : 
                           header.column.columnDef.meta?.alignment === 'center' ? 'text-center' : 'text-left'}`
                      }>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={
                      // Apply alignment class based on column meta
                      `${cell.column.columnDef.meta?.alignment === 'right' ? 'text-right' : 
                         cell.column.columnDef.meta?.alignment === 'center' ? 'text-center' : 'text-left'}`
                    }>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-16 rounded-md border border-input bg-background"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 