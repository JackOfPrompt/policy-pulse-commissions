import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Search, FileText, AlertTriangle, Calendar, User, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllErrorReportsByEntity, getErrorReportsBySession } from "@/utils/bulkUploadUtils";
import { supabase } from "@/integrations/supabase/client";

interface ErrorLog {
  id: string;
  upload_session_id: string;
  entity_type: string;
  row_number: number;
  row_data: any;
  errors: string[];
  uploaded_by: string;
  created_at: string;
}

interface SessionSummary {
  sessionId: string;
  entityType: string;
  totalErrors: number;
  uploadedBy: string;
  createdAt: string;
  firstRowNumber: number;
  lastRowNumber: number;
}

const BulkUploadErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const { toast } = useToast();

  const entityTypes = ["all", "Product", "LOB", "Agent", "Branch", "Employee", "Provider", "Lead", "Policy", "Renewal"];

  useEffect(() => {
    loadErrorLogs();
  }, [selectedEntityType]);

  const loadErrorLogs = async () => {
    setIsLoading(true);
    try {
      let data: ErrorLog[] = [];
      
      if (selectedEntityType === "all") {
        // Load all error logs
        const { data: allLogs, error } = await (supabase as any)
          .from('upload_error_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) throw error;
        data = allLogs || [];
      } else {
        data = await getAllErrorReportsByEntity(selectedEntityType);
      }

      setErrorLogs(data);
      generateSessionSummaries(data);
    } catch (error) {
      console.error('Failed to load error logs:', error);
      toast({
        title: "Error",
        description: "Failed to load error logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSessionSummaries = (logs: ErrorLog[]) => {
    const sessionMap = new Map<string, SessionSummary>();
    
    logs.forEach(log => {
      const existing = sessionMap.get(log.upload_session_id);
      if (existing) {
        existing.totalErrors++;
        existing.firstRowNumber = Math.min(existing.firstRowNumber, log.row_number);
        existing.lastRowNumber = Math.max(existing.lastRowNumber, log.row_number);
      } else {
        sessionMap.set(log.upload_session_id, {
          sessionId: log.upload_session_id,
          entityType: log.entity_type,
          totalErrors: 1,
          uploadedBy: log.uploaded_by,
          createdAt: log.created_at,
          firstRowNumber: log.row_number,
          lastRowNumber: log.row_number
        });
      }
    });

    const summaries = Array.from(sessionMap.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setSessionSummaries(summaries);
  };

  const filteredSummaries = sessionSummaries.filter(summary => {
    if (searchTerm) {
      return summary.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
             summary.sessionId.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const downloadSessionErrors = async (sessionId: string) => {
    try {
      const sessionLogs = await getErrorReportsBySession(sessionId);
      if (sessionLogs.length === 0) {
        toast({
          title: "No data",
          description: "No error logs found for this session",
        });
        return;
      }

      const headers = ['Row Number', 'Error Details', ...Object.keys(sessionLogs[0]?.row_data || {})];
      const rows = sessionLogs.map(log => [
        log.row_number.toString(),
        log.errors.join('; '),
        ...Object.values(log.row_data || {}).map(v => String(v || ''))
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error_report_${sessionId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: "Error report has been downloaded",
      });
    } catch (error) {
      console.error('Failed to download error report:', error);
      toast({
        title: "Error",
        description: "Failed to download error report",
        variant: "destructive",
      });
    }
  };

  const showSessionDetailsModal = async (sessionId: string) => {
    setSelectedSession(sessionId);
    setShowSessionDetails(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Bulk Upload Error Logs
          </CardTitle>
          <CardDescription>
            View and manage error logs from bulk upload operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by entity type or session ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by entity type" />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Entity Types" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{sessionSummaries.length}</div>
              <div className="text-sm text-muted-foreground">Error Sessions</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {errorLogs.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Errors</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(sessionSummaries.map(s => s.entityType)).size}
              </div>
              <div className="text-sm text-muted-foreground">Entity Types</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(sessionSummaries.map(s => s.uploadedBy)).size}
              </div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
          </div>

          {/* Error Sessions Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading error logs...</div>
          ) : filteredSummaries.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No error logs found for the selected criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Error Count</TableHead>
                    <TableHead>Row Range</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.map((summary) => (
                    <TableRow key={summary.sessionId}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {summary.sessionId.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {summary.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          {summary.totalErrors}
                        </div>
                      </TableCell>
                      <TableCell>
                        {summary.firstRowNumber === summary.lastRowNumber
                          ? `Row ${summary.firstRowNumber}`
                          : `Rows ${summary.firstRowNumber}-${summary.lastRowNumber}`
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {formatDate(summary.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showSessionDetailsModal(summary.sessionId)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadSessionErrors(summary.sessionId)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Details Modal */}
      <Dialog open={showSessionDetails} onOpenChange={setShowSessionDetails}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Session Error Details</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {selectedSession && (
              <SessionErrorDetails
                sessionId={selectedSession}
                onDownload={() => downloadSessionErrors(selectedSession)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Component to show detailed errors for a specific session
const SessionErrorDetails = ({ sessionId, onDownload }: { sessionId: string; onDownload: () => void }) => {
  const [sessionLogs, setSessionLogs] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  const loadSessionDetails = async () => {
    setIsLoading(true);
    try {
      const logs = await getErrorReportsBySession(sessionId);
      setSessionLogs(logs);
    } catch (error) {
      console.error('Failed to load session details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading session details...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Session: {sessionId.slice(0, 12)}...</h3>
          <p className="text-sm text-muted-foreground">{sessionLogs.length} errors found</p>
        </div>
        <Button variant="outline" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row #</TableHead>
              <TableHead>Errors</TableHead>
              <TableHead>Data Preview</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionLogs.map((log, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono">{log.row_number}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {log.errors.map((error, i) => (
                      <div key={i} className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-1 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {Object.entries(log.row_data || {})
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <div key={key} className="truncate">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))
                    }
                    {Object.keys(log.row_data || {}).length > 3 && (
                      <div className="text-muted-foreground">
                        +{Object.keys(log.row_data || {}).length - 3} more fields...
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BulkUploadErrorLogs;