import { Button } from '@/components/ui/button';
import { 
  List, 
  Grid3X3, 
  Grid2X2, 
  LayoutGrid, 
  Columns3 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/hooks/useViewMode';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export const ViewToggle = ({ viewMode, onViewModeChange, className }: ViewToggleProps) => {
  const viewOptions = [
    { 
      mode: 'list' as ViewMode, 
      icon: List, 
      label: 'List View',
      tooltip: 'List View - Detailed table format'
    },
    { 
      mode: 'grid-small' as ViewMode, 
      icon: Grid3X3, 
      label: 'Small Grid',
      tooltip: 'Small Grid - Compact cards'
    },
    { 
      mode: 'grid-medium' as ViewMode, 
      icon: Grid2X2, 
      label: 'Medium Grid',
      tooltip: 'Medium Grid - Balanced cards'
    },
    { 
      mode: 'grid-large' as ViewMode, 
      icon: LayoutGrid, 
      label: 'Large Grid',
      tooltip: 'Large Grid - Detailed cards'
    },
    { 
      mode: 'kanban' as ViewMode, 
      icon: Columns3, 
      label: 'Kanban View',
      tooltip: 'Kanban View - Status-based columns'
    }
  ];

  return (
    <div className={cn("flex items-center bg-muted rounded-lg p-1", className)}>
      {viewOptions.map(({ mode, icon: Icon, label, tooltip }) => (
        <Button
          key={mode}
          variant={viewMode === mode ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange(mode)}
          title={tooltip}
          className={cn(
            "h-8 px-3 transition-all duration-200",
            viewMode === mode 
              ? "bg-background shadow-sm text-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </Button>
      ))}
    </div>
  );
};