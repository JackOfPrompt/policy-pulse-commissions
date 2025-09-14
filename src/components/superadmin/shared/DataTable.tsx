import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive';
  disabled?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowActions?: RowAction<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchFields?: Array<keyof T>;
  filterable?: boolean;
  filters?: Array<{
    key: keyof T;
    label: string;
    options: Array<{ label: string; value: string }>;
  }>;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: T[]) => void;
    variant?: 'default' | 'destructive';
  }>;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sorting?: {
    field: keyof T;
    direction: 'asc' | 'desc';
    onSortChange: (field: keyof T, direction: 'asc' | 'desc') => void;
  };
  onExport?: () => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  rowActions = [],
  loading = false,
  searchable = true,
  searchFields = [],
  filterable = false,
  filters = [],
  selectable = false,
  onSelectionChange,
  bulkActions = [],
  pagination,
  sorting,
  onExport,
  emptyMessage = "No data found",
  className = "",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Handle row selection
  const handleRowSelection = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
    
    if (onSelectionChange) {
      const selectedData = data.filter(row => newSelected.has(row.id));
      onSelectionChange(selectedData);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(row => row.id));
      setSelectedRows(allIds);
      if (onSelectionChange) {
        onSelectionChange(data);
      }
    } else {
      setSelectedRows(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  // Filter data based on search and filters
  const filteredData = data.filter(row => {
    // Search filter
    if (searchQuery && searchFields.length > 0) {
      const searchMatch = searchFields.some(field => {
        const value = row[field];
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
      if (!searchMatch) return false;
    }

    // Column filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (value && row[key as keyof T] !== value) {
        return false;
      }
    }

    return true;
  });

  const isAllSelected = selectedRows.size > 0 && selectedRows.size === data.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      {(searchable || filterable || onExport || selectable) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {searchable && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {filterable && filters.map(filter => (
              <Select
                key={String(filter.key)}
                value={activeFilters[String(filter.key)] || ""}
                onValueChange={(value) =>
                  setActiveFilters(prev => ({
                    ...prev,
                    [String(filter.key)]: value
                  }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All {filter.label}</SelectItem>
                  {filter.options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            {selectable && selectedRows.size > 0 && bulkActions.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedRows.size} selected
                </Badge>
                {bulkActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const selectedData = data.filter(row => selectedRows.has(row.id));
                      action.onClick(selectedData);
                    }}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Export Button */}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el && 'indeterminate' in el) {
                        (el as any).indeterminate = isIndeterminate;
                      }
                    }}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)} 
                  className={column.width ? `w-[${column.width}]` : ''}
                >
                  {column.sortable && sorting ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-state-open:bg-accent"
                      onClick={() => {
                        const newDirection = 
                          sorting.field === column.key && sorting.direction === 'asc' 
                            ? 'desc' 
                            : 'asc';
                        sorting.onSortChange(column.key, newDirection);
                      }}
                    >
                      <span>{column.label}</span>
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
              {rowActions.length > 0 && (
                <TableHead className="w-12">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow 
                  key={row.id}
                  data-testid={`table-row-${row.id}`}
                  className={selectedRows.has(row.id) ? "bg-muted/50" : ""}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked) => 
                          handleRowSelection(row.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '')
                      }
                    </TableCell>
                  ))}
                  {rowActions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`actions-${row.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          {rowActions.map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={() => action.onClick(row)}
                              disabled={action.disabled?.(row)}
                              className={
                                action.variant === 'destructive' 
                                  ? 'text-destructive focus:text-destructive' 
                                  : ''
                              }
                            >
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}