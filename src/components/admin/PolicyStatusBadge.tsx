import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PolicyStatusBadgeProps {
  status: string;
  daysInStatus?: number;
  alertFlag?: boolean;
  className?: string;
}

export const PolicyStatusBadge = ({ 
  status, 
  daysInStatus, 
  alertFlag, 
  className 
}: PolicyStatusBadgeProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Underwriting':
        return alertFlag ? 'destructive' : 'secondary';
      case 'Issued':
        return 'default';
      case 'Rejected':
        return 'destructive';
      case 'Cancelled':
        return 'outline';
      case 'Free Look Cancellation':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={getStatusColor(status)}
        className={cn(className)}
      >
        {status}
      </Badge>
      {daysInStatus && (
        <span className={cn(
          "text-xs text-muted-foreground",
          alertFlag && "text-destructive font-medium"
        )}>
          {daysInStatus}d
        </span>
      )}
      {alertFlag && (
        <Badge variant="destructive" className="text-xs">
          !
        </Badge>
      )}
    </div>
  );
};

export default PolicyStatusBadge;