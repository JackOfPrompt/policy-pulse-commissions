import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeadStatusBadgeProps {
  status: string;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'In Progress':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'Converted':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Dropped':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(getStatusColor(status), className)}
    >
      {status}
    </Badge>
  );
}