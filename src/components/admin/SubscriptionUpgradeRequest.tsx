import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileUp, X, Download } from 'lucide-react';
import { useSubscriptionRequests } from '@/hooks/useSubscriptionRequests';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const requestSchema = z.object({
  requested_plan_id: z.string().min(1, 'Please select a plan'),
  justification: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
}

export default function SubscriptionUpgradeRequest() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { createRequest, uploadFile, requests } = useSubscriptionRequests();

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  // Fetch plans and current subscription on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user's org subscription
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (userProfile?.org_id) {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select(`
              *,
              plan:plans!plan_id(*)
            `)
            .eq('org_id', userProfile.org_id)
            .single();

          setCurrentSubscription(subscription);
        }

        // Get available plans
        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .order('price_monthly', { ascending: true });

        setPlans(plansData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RequestFormData) => {
    if (pendingRequests.length > 0) {
      toast.error('You already have a pending upgrade request');
      return;
    }

    setUploading(true);
    try {
      // Upload files
      const uploadPromises = files.map(file => uploadFile(file));
      const uploadResults = await Promise.all(uploadPromises);
      const validUrls = uploadResults.filter(url => url !== null) as string[];

      // Create request
      const success = await createRequest({
        current_plan_id: currentSubscription?.plan_id,
        requested_plan_id: data.requested_plan_id,
        justification: data.justification,
        attachment_urls: validUrls
      });

      if (success) {
        form.reset();
        setFiles([]);
      }
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setUploading(false);
    }
  };

  if (!currentSubscription) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {currentSubscription.plan?.name}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Monthly: ₹{currentSubscription.plan?.price_monthly}
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingRequests.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Pending Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              You have a pending upgrade request. Please wait for admin review before submitting a new request.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request Plan Upgrade</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="requested_plan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Plan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {plans
                          .filter(plan => plan.id !== currentSubscription.plan_id)
                          .map(plan => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - ₹{plan.price_monthly}/month
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justification (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you need this upgrade..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Supporting Documents (Optional)</FormLabel>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary underline">Upload files</span>
                        <Input
                          id="file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF, DOC, DOCX, PNG, JPG up to 10MB each
                    </p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={uploading || pendingRequests.length > 0}
                className="w-full"
              >
                {uploading ? 'Submitting...' : 'Submit Upgrade Request'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Previous Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <div className="font-medium">
                      {request.current_plan?.name} → {request.requested_plan?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      request.status === 'approved' ? 'default' :
                      request.status === 'rejected' ? 'destructive' : 'secondary'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}