import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/hooks/useViewMode';

interface GridViewProps<T> {
  data: T[];
  loading?: boolean;
  onItemClick?: (item: T) => void;
  renderCard: (item: T, actions?: React.ReactNode) => React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  viewMode: 'grid-small' | 'grid-medium' | 'grid-large';
  className?: string;
}

export function GridView<T extends Record<string, any>>({ 
  data, 
  loading = false,
  onItemClick,
  renderCard,
  actions,
  viewMode,
  className 
}: GridViewProps<T>) {
  const getGridColumns = () => {
    switch (viewMode) {
      case 'grid-small':
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
      case 'grid-medium': 
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 'grid-large':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  if (loading) {
    return (
      <div className={cn("grid gap-4", getGridColumns(), className)}>
        {Array(8).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-16", className)}>
        <div className="text-center">
          <p className="text-muted-foreground">No data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", getGridColumns(), className)}>
      {data.map((item, index) => (
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
      ))}
    </div>
  );
}