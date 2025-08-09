import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface Lead {
  id: string;
  leadNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  productInterest: string;
  leadSource: string;
  assignedTo: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'In Discussion' | 'Converted' | 'Dropped';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  estimatedValue?: number;
  remarks?: string;
  daysSinceLastContact?: number;
}

interface LeadCardProps {
  lead: Lead;
  onViewDetails: (lead: Lead) => void;
  onAddTask: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: Lead['status']) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onViewDetails,
  onAddTask,
  onConvert,
  onStatusChange
}) => {
  const getStatusBadgeVariant = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'secondary';
      case 'Contacted': return 'outline';
      case 'Quoted': return 'default';
      case 'In Discussion': return 'default';
      case 'Converted': return 'default';
      case 'Dropped': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: Lead['priority']) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const isOverdue = lead.daysSinceLastContact && lead.daysSinceLastContact > 2;
  const needsFollowUp = lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date();

  return (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{lead.leadNumber}</span>
            <Badge variant={getStatusBadgeVariant(lead.status)} className="text-xs">
              {lead.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${getPriorityColor(lead.priority)}`}>
              {lead.priority}
            </span>
            {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
            {needsFollowUp && <Clock className="h-4 w-4 text-orange-500" />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div onClick={() => onViewDetails(lead)}>
          <h3 className="font-semibold text-foreground">{lead.customerName}</h3>
          <p className="text-sm text-muted-foreground">{lead.productInterest}</p>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span>{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              <span>{lead.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>Source: {lead.leadSource}</span>
          </div>
          {lead.estimatedValue && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Est. Value: ₹{lead.estimatedValue.toLocaleString()}</span>
            </div>
          )}
        </div>

        {lead.nextFollowUp && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="h-3 w-3" />
            <span className={needsFollowUp ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
              Follow-up: {new Date(lead.nextFollowUp).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask(lead);
            }}
          >
            <Clock className="h-3 w-3 mr-1" />
            Task
          </Button>
          
          {(lead.status === 'Quoted' || lead.status === 'In Discussion') && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onConvert(lead);
              }}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Convert
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Created: {new Date(lead.createdAt).toLocaleDateString()}
          {lead.lastContactDate && (
            <span className="ml-2">
              Last contact: {new Date(lead.lastContactDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};