import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DrawerField {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}

export interface DrawerSection {
  title: string;
  fields: DrawerField[];
}

export interface DrawerAction {
  label: string;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface EntityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  status?: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  sections: DrawerSection[];
  actions?: DrawerAction[];
  loading?: boolean;
}

export function EntityDrawer({
  open,
  onOpenChange,
  title,
  description,
  status,
  sections,
  actions = [],
  loading = false,
}: EntityDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl">{title}</SheetTitle>
              {description && (
                <SheetDescription className="text-sm text-muted-foreground">
                  {description}
                </SheetDescription>
              )}
            </div>
            {status && (
              <Badge variant={status.variant} className="ml-2">
                {status.label}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)] pr-6">
            <div className="space-y-6 py-6">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {section.title}
                  </h3>
                  
                  <div className="grid gap-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div
                        key={fieldIndex}
                        className={`grid gap-2 ${
                          field.fullWidth ? 'col-span-2' : 'grid-cols-3'
                        }`}
                      >
                        <div className="text-sm font-medium text-muted-foreground">
                          {field.label}
                        </div>
                        <div className={`text-sm ${field.fullWidth ? '' : 'col-span-2'}`}>
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {sectionIndex < sections.length - 1 && (
                    <Separator className="my-6" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  disabled={action.disabled || loading}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Utility function to format common field types
export const formatDrawerValue = (value: any, type?: 'date' | 'currency' | 'boolean' | 'list' | 'json'): ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString();
    
    case 'currency':
      if (typeof value === 'object' && value.amount && value.currency) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: value.currency,
        }).format(value.amount);
      }
      return String(value);
    
    case 'boolean':
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    
    case 'list':
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((item, index) => (
              <Badge key={index} variant="outline">
                {String(item)}
              </Badge>
            ))}
          </div>
        );
      }
      return String(value);
    
    case 'json':
      return (
        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    
    default:
      return String(value);
  }
};