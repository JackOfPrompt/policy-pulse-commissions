import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useOfflinePolicyEntry } from '@/hooks/useOfflinePolicyEntry';
import { useToast } from '@/hooks/use-toast';
import { 
  Wifi, 
  WifiOff, 
  Save, 
   
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface OfflinePolicyFormProps {
  onClose?: () => void;
}

export const OfflinePolicyForm: React.FC<OfflinePolicyFormProps> = ({ onClose }) => {
  const { toast } = useToast();
  const {
    isOnline,
    offlinePolicies,
    pendingSyncCount,
    syncInProgress,
    createOfflinePolicy,
    syncOfflinePolicies,
    deleteOfflinePolicy,
    clearSyncedPolicies,
  } = useOfflinePolicyEntry();

  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    line_of_business: '',
    premium_amount: '',
    product_id: '',
    remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createOfflinePolicy({
        customer_name: formData.customer_name,
        phone_number: formData.phone_number,
        line_of_business: formData.line_of_business,
        premium_amount: parseFloat(formData.premium_amount) || 0,
        product_id: formData.product_id || undefined,
      });

      toast({
        title: isOnline ? "Policy Created" : "Policy Saved Offline",
        description: isOnline 
          ? "Policy has been created and synced to server"
          : "Policy saved locally and will sync when online",
      });

      // Reset form
      setFormData({
        customer_name: '',
        phone_number: '',
        line_of_business: '',
        premium_amount: '',
        product_id: '',
        remarks: '',
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create policy",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    try {
      await syncOfflinePolicies();
      toast({
        title: "Sync Complete",
        description: "All policies have been synced to server",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Some policies could not be synced",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={`${isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-orange-600" />
              )}
              <span className={`font-medium ${isOnline ? 'text-green-700' : 'text-orange-700'}`}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
            
            {pendingSyncCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {pendingSyncCount} pending sync
                </Badge>
                {isOnline && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSync}
                    disabled={syncInProgress}
                  >
                    {syncInProgress ? (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Policy Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Policy</CardTitle>
          <CardDescription>
            {isOnline 
              ? "Policy will be created immediately and synced to server"
              : "Policy will be saved locally and synced when connection is restored"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="line_of_business">Line of Business *</Label>
                <Select 
                  value={formData.line_of_business} 
                  onValueChange={(value) => handleInputChange('line_of_business', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select LOB" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Motor">Motor Insurance</SelectItem>
                    <SelectItem value="Health">Health Insurance</SelectItem>
                    <SelectItem value="Life">Life Insurance</SelectItem>
                    <SelectItem value="Travel">Travel Insurance</SelectItem>
                    <SelectItem value="Commercial">Commercial Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="premium_amount">Premium Amount *</Label>
                <Input
                  id="premium_amount"
                  type="number"
                  value={formData.premium_amount}
                  onChange={(e) => handleInputChange('premium_amount', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Additional notes or comments..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isOnline ? 'Create Policy' : 'Save Offline'}
              </Button>
              
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Offline Policies List */}
      {offlinePolicies.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Offline Policies</CardTitle>
                <CardDescription>Policies created locally</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearSyncedPolicies}>
                Clear Synced
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offlinePolicies.map((policy) => (
                <div 
                  key={policy.tempId} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{policy.customer_name}</span>
                      <Badge 
                        variant={policy.synced ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {policy.synced ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Synced</>
                        ) : policy.sync_error ? (
                          <><AlertTriangle className="h-3 w-3 mr-1" /> Sync Failed</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Pending</>
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {policy.line_of_business} • ₹{policy.premium_amount.toLocaleString()}
                    </div>
                    {policy.sync_error && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {policy.sync_error}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteOfflinePolicy(policy.tempId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};