import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, FileText, Search, Filter } from 'lucide-react';
import { PolicyList } from '@/components/policy/PolicyList';
import { AddPolicyWizard } from '@/components/policy/AddPolicyWizard';
import { BackButton } from '@/components/ui/back-button';
import { BulkUploadModal } from '@/components/policy/BulkUploadModal';
import { PolicyReports } from '@/components/policy/PolicyReports';

interface PolicyManagementProps {
  tenantId: string;
}

export const PolicyManagement: React.FC<PolicyManagementProps> = ({ tenantId }) => {
  const [activeView, setActiveView] = useState<'grid' | 'list' | 'reports'>('grid');
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const ManagementIconGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card 
        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary"
        onClick={() => setActiveView('list')}
      >
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Policy Management</CardTitle>
          <CardDescription>
            Manage policies, renewals, and documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• View & Edit Policies</div>
            <div>• Process Renewals</div>
            <div>• Bulk Operations</div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary"
        onClick={() => setActiveView('reports')}
      >
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-secondary" />
          </div>
          <CardTitle>Reports & Analytics</CardTitle>
          <CardDescription>
            View revenue, commission, and performance reports
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• Revenue (GWP) Reports</div>
            <div>• Commission Analytics</div>
            <div>• Renewal Tracking</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (activeView === 'grid') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/admin-dashboard" />
            <div>
              <h1 className="text-3xl font-bold">Management</h1>
              <p className="text-muted-foreground">Manage your insurance operations</p>
            </div>
          </div>
        </div>
        <ManagementIconGrid />
      </div>
    );
  }

  if (activeView === 'reports') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <p className="text-muted-foreground">Comprehensive policy and financial reporting</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setActiveView('grid')}
          >
            Back to Management
          </Button>
        </div>
        <PolicyReports tenantId={tenantId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Policy Management</h1>
            <p className="text-muted-foreground">Manage policies and process renewals</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowAddWizard(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Policy
          </Button>
        </div>
      </div>

      <PolicyList tenantId={tenantId} />

      {showAddWizard && (
        <AddPolicyWizard
          tenantId={tenantId}
          isOpen={showAddWizard}
          onClose={() => setShowAddWizard(false)}
        />
      )}

      {showBulkUpload && (
        <BulkUploadModal
          tenantId={tenantId}
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
};

export default PolicyManagement;