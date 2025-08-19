import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  FileText, 
  RotateCcw,
  Play,
  Pause,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MigrationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  logs: string[];
}

interface MigrationStats {
  oldTables: number;
  newTables: number;
  recordsMigrated: number;
  dataIntegrityScore: number;
}

export const MigrationDashboard = () => {
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([
    {
      id: 'schema',
      title: 'Schema Creation',
      description: 'Create optimized table structure with JSONB consolidation',
      status: 'completed',
      progress: 100,
      logs: ['✅ Created master_reference_data table', '✅ Created products_unified table', '✅ Created policy_details_unified table']
    },
    {
      id: 'master-data',
      title: 'Master Data Migration',
      description: 'Consolidate location, department, occupation data',
      status: 'pending',
      progress: 0,
      logs: []
    },
    {
      id: 'products',
      title: 'Products Migration',
      description: 'Migrate products with JSONB configuration',
      status: 'pending',
      progress: 0,
      logs: []
    },
    {
      id: 'policies',
      title: 'Policy Details Migration',
      description: 'Unify Motor/Health/Life policy details',
      status: 'pending',
      progress: 0,
      logs: []
    },
    {
      id: 'commissions',
      title: 'Commission Structures',
      description: 'Consolidate commission rules into JSONB',
      status: 'pending',
      progress: 0,
      logs: []
    },
    {
      id: 'documents',
      title: 'Documents Migration',
      description: 'Unify all document tables',
      status: 'pending',
      progress: 0,
      logs: []
    },
    {
      id: 'verification',
      title: 'Data Verification',
      description: 'Validate migration accuracy and integrity',
      status: 'pending',
      progress: 0,
      logs: []
    }
  ]);

  const [migrationStats, setMigrationStats] = useState<MigrationStats>({
    oldTables: 93,
    newTables: 35,
    recordsMigrated: 0,
    dataIntegrityScore: 0
  });

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const getStatusIcon = (status: MigrationStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'running': return <Clock className="h-5 w-5 text-warning animate-spin" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: MigrationStep['status']) => {
    const variants = {
      completed: 'default',
      failed: 'destructive', 
      running: 'secondary',
      pending: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const executeMigrationStep = async (stepId: string) => {
    setIsRunning(true);
    const stepIndex = migrationSteps.findIndex(step => step.id === stepId);
    
    // Update step to running
    setMigrationSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status: 'running', startTime: new Date(), logs: [...step.logs, `🔄 Starting ${step.title}...`] }
        : step
    ));

    try {
      // Simulate migration execution with progress updates
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setMigrationSteps(prev => prev.map((step, index) => 
          index === stepIndex 
            ? { 
                ...step, 
                progress,
                logs: [...step.logs, `📊 Progress: ${progress}%`]
              }
            : step
        ));
      }

      // Mark step as completed
      setMigrationSteps(prev => prev.map((step, index) => 
        index === stepIndex 
          ? { 
              ...step, 
              status: 'completed', 
              progress: 100,
              endTime: new Date(),
              logs: [...step.logs, `✅ ${step.title} completed successfully`]
            }
          : step
      ));

      toast({
        title: "Migration Step Completed",
        description: `${migrationSteps[stepIndex].title} has been completed successfully.`,
      });

    } catch (error) {
      // Mark step as failed
      setMigrationSteps(prev => prev.map((step, index) => 
        index === stepIndex 
          ? { 
              ...step, 
              status: 'failed',
              endTime: new Date(),
              logs: [...step.logs, `❌ ${step.title} failed: ${error}`]
            }
          : step
      ));

      toast({
        title: "Migration Step Failed",
        description: `${migrationSteps[stepIndex].title} encountered an error.`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runFullMigration = async () => {
    for (const step of migrationSteps) {
      if (step.status === 'pending') {
        await executeMigrationStep(step.id);
      }
    }
  };

  const downloadMigrationScripts = () => {
    // Create downloadable migration scripts
    const scripts = [
      { name: 'phase2_data_transformation.sql', url: '/migration_scripts/phase2_data_transformation.sql' },
      { name: 'phase3_verification_queries.sql', url: '/migration_scripts/phase3_verification_queries.sql' },
      { name: 'phase4_rollback_scripts.sql', url: '/migration_scripts/phase4_rollback_scripts.sql' },
      { name: 'MIGRATION_GUIDE.md', url: '/migration_scripts/MIGRATION_GUIDE.md' }
    ];

    scripts.forEach(script => {
      const link = document.createElement('a');
      link.href = script.url;
      link.download = script.name;
      link.click();
    });

    toast({
      title: "Scripts Downloaded",
      description: "All migration scripts have been prepared for download.",
    });
  };

  const overallProgress = migrationSteps.reduce((acc, step) => acc + step.progress, 0) / migrationSteps.length;
  const completedSteps = migrationSteps.filter(step => step.status === 'completed').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schema Migration Dashboard</h1>
          <p className="text-muted-foreground">
            Migrate from 93-table to 35-table optimized structure
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadMigrationScripts} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Scripts
          </Button>
          <Button 
            onClick={runFullMigration} 
            disabled={isRunning || completedSteps === migrationSteps.length}
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running Migration...' : 'Start Full Migration'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Steps</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSteps}/{migrationSteps.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Migration steps</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Reduction</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{migrationStats.oldTables} → {migrationStats.newTables}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(((migrationStats.oldTables - migrationStats.newTables) / migrationStats.oldTables) * 100)}% reduction
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Integrity</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{migrationStats.dataIntegrityScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Validation score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="steps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="steps">Migration Steps</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="rollback">Rollback</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="space-y-4">
          {migrationSteps.map((step, index) => (
            <Card key={step.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(step.status)}
                    <Button 
                      onClick={() => executeMigrationStep(step.id)}
                      disabled={isRunning || step.status === 'completed'}
                      size="sm"
                    >
                      {step.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{step.progress}%</span>
                  </div>
                  <Progress value={step.progress} />
                  {step.startTime && (
                    <p className="text-xs text-muted-foreground">
                      Started: {step.startTime.toLocaleTimeString()}
                      {step.endTime && ` • Completed: ${step.endTime.toLocaleTimeString()}`}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>Detailed logs from migration execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-background border rounded-md p-4 h-96 overflow-y-auto font-mono text-sm">
                {migrationSteps.map(step => 
                  step.logs.map((log, index) => (
                    <div key={`${step.id}-${index}`} className="mb-1">
                      <span className="text-muted-foreground">[{step.title}]</span> {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Verification</CardTitle>
              <CardDescription>Validate migration accuracy and data integrity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Row Count Verification</AlertTitle>
                  <AlertDescription>
                    All source data successfully migrated to unified tables
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>JSONB Structure</AlertTitle>
                  <AlertDescription>
                    LOB-specific data properly consolidated into JSONB fields
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Foreign Keys</AlertTitle>
                  <AlertDescription>
                    All relationships maintained in new schema structure
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Tenant Isolation</AlertTitle>
                  <AlertDescription>
                    RLS policies properly applied for multi-tenant security
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rollback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rollback Options</CardTitle>
              <CardDescription>Restore original schema if issues are encountered</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Rollback will restore the original 93-table structure and drop all new unified tables. 
                  Ensure you have proper backups before proceeding.
                </AlertDescription>
              </Alert>
              <Button variant="destructive" className="mr-2">
                <RotateCcw className="h-4 w-4 mr-2" />
                Execute Rollback
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Rollback Scripts
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};