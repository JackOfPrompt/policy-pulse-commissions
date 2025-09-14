import { Activity, Filter, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import users from "@/data/users.json";
import auditLogs from "@/data/audit-logs.json";

export default function AuditLogs() {
  const user = users.superadmin;

  const getActionVariant = (action: string) => {
    if (action.toLowerCase().includes('create')) return 'success';
    if (action.toLowerCase().includes('delete')) return 'destructive';
    if (action.toLowerCase().includes('update')) return 'info';
    return 'secondary';
  };

  return (
    <DashboardLayout role="superadmin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Activity Log</CardTitle>
            <CardDescription>
              Complete audit trail of all system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input 
                placeholder="Search logs by action, actor, or target..." 
                className="max-w-sm"
              />
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusChip variant={getActionVariant(log.action)}>
                        {log.action}
                      </StatusChip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>{log.actor}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.target}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}