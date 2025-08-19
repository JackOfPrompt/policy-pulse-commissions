import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KanbanColumn<T> {
  id: string;
  title: string;
  color?: string;
  items: T[];
}

interface KanbanViewProps<T> {
  data: T[];
  loading?: boolean;
  onItemClick?: (item: T) => void;
  renderCard: (item: T, actions?: React.ReactNode) => React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  getItemStatus: (item: T) => string;
  statusConfig: {
    [key: string]: {
      label: string;
      color: string;
      bgColor?: string;
    };
  };
  className?: string;
}

export function KanbanView<T extends Record<string, any>>({ 
  data, 
  loading = false,
  onItemClick,
  renderCard,
  actions,
  getItemStatus,
  statusConfig,
  className 
}: KanbanViewProps<T>) {
  const columns: KanbanColumn<T>[] = Object.entries(statusConfig).map(([status, config]) => ({
    id: status,
    title: config.label,
    color: config.color,
    items: data.filter(item => getItemStatus(item) === status)
  }));

  if (loading) {
    return (
      <div className={cn("flex gap-6 overflow-x-auto pb-4", className)}>
        {Object.keys(statusConfig).map((status) => (
          <div key={status} className="flex-shrink-0 w-80">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="h-5 bg-muted rounded w-32 animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-6 overflow-x-auto pb-4", className)}>
      {columns.map((column) => {
        const config = statusConfig[column.id];
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    {column.title}
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", config.bgColor)}
                    >
                      {column.items.length}
                    </Badge>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {column.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No items in {column.title.toLowerCase()}
                  </div>
                ) : (
                  column.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className={cn(
                        "transition-all duration-200",
                        onItemClick && "cursor-pointer hover:scale-105"
                      )}
                      onClick={onItemClick ? () => onItemClick(item) : undefined}
                    >
                      {renderCard(item, actions ? actions(item) : undefined)}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}