import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { History, User, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface PolicyStatusHistoryProps {
  policyId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StatusHistoryEntry {
  id: string;
  previous_status: string;
  new_status: string;
  updated_by: string;
  changed_by_role: string;
  updated_at: string;
  remarks?: string;
  user_name?: string;
}

export const PolicyStatusHistory = ({ policyId, isOpen, onClose }: PolicyStatusHistoryProps) => {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && policyId) {
      fetchStatusHistory();
    }
  }, [isOpen, policyId]);

  const fetchStatusHistory = async () => {
    setLoading(true);
    try {
      // Fetch status history with user details
      const { data: historyData, error: historyError } = await supabase
        .from('policy_status_history')
        .select('*')
        .eq('policy_id', policyId)
        .order('updated_at', { ascending: false });

      if (historyError) throw historyError;

      // Enrich with user names
      const enrichedHistory = await Promise.all(
        historyData.map(async (entry) => {
          let user_name = 'Unknown User';
          
          if (entry.updated_by) {
            // Try to get employee name first
            const { data: employeeData } = await supabase
              .from('employees')
              .select('name')
              .eq('user_id', entry.updated_by)
              .single();
            
            if (employeeData?.name) {
              user_name = employeeData.name;
            } else {
              // Try to get agent name
              const { data: agentData } = await supabase
                .from('agents')
                .select('name')
                .eq('user_id', entry.updated_by)
                .single();
              
              if (agentData?.name) {
                user_name = agentData.name;
              }
            }
          }
          
          return {
            ...entry,
            user_name
          };
        })
      );

      setHistory(enrichedHistory);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch policy status history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Underwriting': return 'secondary';
      case 'Issued': return 'default';
      case 'Rejected': return 'destructive';
      case 'Cancelled': return 'outline';
      case 'Free Look Cancellation': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Policy Status History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No status changes recorded
              </p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
                
                {history.map((entry, index) => (
                  <div key={entry.id} className="relative flex gap-4 pb-6">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center z-10">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-card border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {entry.previous_status && (
                              <>
                                <Badge variant={getStatusColor(entry.previous_status)}>
                                  {entry.previous_status}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                              </>
                            )}
                            <Badge variant={getStatusColor(entry.new_status)}>
                              {entry.new_status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(entry.updated_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{entry.user_name}</span>
                            {entry.changed_by_role && (
                              <Badge variant="outline" className="text-xs">
                                {entry.changed_by_role}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {entry.remarks && (
                          <div className="flex items-start gap-1 text-sm">
                            <MessageSquare className="h-3 w-3 mt-1 text-muted-foreground" />
                            <span className="text-muted-foreground">{entry.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};