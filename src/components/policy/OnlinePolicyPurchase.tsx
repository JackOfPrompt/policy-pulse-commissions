import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generatePolicyNumber } from '@/utils/policyNumberGenerator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Check, FileText, User, Building, CreditCard, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuoteSession } from '@/hooks/useQuoteSession';
import { ResumeQuoteModal } from './ResumeQuoteModal';
import { SelectLOB } from './purchase-steps/SelectLOB';
import { CustomerDetailsCollection } from './purchase-steps/CustomerDetailsCollection';
import { SelectProvider } from './purchase-steps/SelectProvider';
import { SelectProduct } from './purchase-steps/SelectProduct';
import { QuoteComparison } from './purchase-steps/QuoteComparison';
import { AddOnsSelection } from './purchase-steps/AddOnsSelection';
import { PolicyProposalForm } from './purchase-steps/PolicyProposalForm';
import { PaymentSimulation } from './purchase-steps/PaymentSimulation';
import { ReviewSubmit } from './purchase-steps/ReviewSubmit';

interface PurchaseContextType {
  initiatedByRole: 'admin' | 'employee' | 'agent' | 'customer';
  initiatedById: string;
  canSelectOnBehalf?: boolean;
}

interface OnlinePolicyPurchaseProps {
  context: PurchaseContextType;
}

interface PurchaseData {
  lineOfBusiness?: string;
  providerId?: string;
  providerName?: string;
  productId?: string;
  productName?: string;
  customerDetails?: any;
  selectedQuote?: any;
  selectedAddOns?: any[];
  policyData?: any;
  paymentResult?: any;
  onBehalfOf?: {
    type: 'employee' | 'agent' | 'customer';
    id: string;
    name: string;
  };
}

const steps = [
  { id: 1, name: 'Line of Business', icon: Shield },
  { id: 2, name: 'Customer Details', icon: User },
  { id: 3, name: 'Insurance Provider', icon: Building },
  { id: 4, name: 'Product Selection', icon: FileText },
  { id: 5, name: 'Get Quotes', icon: CreditCard },
  { id: 6, name: 'Add-ons', icon: Shield },
  { id: 7, name: 'Payment', icon: CreditCard },
  { id: 8, name: 'Review & Submit', icon: Check },
];

export const OnlinePolicyPurchase: React.FC<OnlinePolicyPurchaseProps> = ({ context }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [purchaseData, setPurchaseData] = useState<PurchaseData>({});
  const [loading, setLoading] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const { toast } = useToast();
  const { session, createSession, updateSession, completeSession, clearSession } = useQuoteSession();

  // Check for existing session on mount
  useEffect(() => {
    if (session && !session.is_complete) {
      setShowResumeModal(true);
    }
  }, [session]);

  const updatePurchaseData = async (data: Partial<PurchaseData>) => {
    setPurchaseData(prev => ({ ...prev, ...data }));
    
    // Auto-save to session if it exists
    if (session) {
      const sessionUpdates: any = {};
      
      if (data.lineOfBusiness) sessionUpdates.line_of_business = data.lineOfBusiness;
      if (data.productId) sessionUpdates.product_id = data.productId;
      if (data.providerId) sessionUpdates.selected_insurer_id = data.providerId;
      if (data.selectedQuote) sessionUpdates.selected_quote = data.selectedQuote;
      if (data.selectedAddOns) sessionUpdates.addons_selected = data.selectedAddOns;
      if (data.customerDetails) sessionUpdates.proposal_data = data.customerDetails;
      
      await updateSession(sessionUpdates);
    }
  };

  const handleNext = async () => {
    if (currentStep < 8) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Update session step
      if (session) {
        const stepNames = ['product-selection', 'customer-details', 'quote-result', 'addon-selection', 'proposal-form', 'payment', 'complete'];
        await updateSession({ current_step: stepNames[nextStep - 1] });
      }
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // Update session step
      if (session) {
        const stepNames = ['product-selection', 'customer-details', 'quote-result', 'addon-selection', 'proposal-form', 'payment', 'complete'];
        await updateSession({ current_step: stepNames[prevStep - 1] });
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Generate unique policy number
      const policyNumber = await generatePolicyNumber();
      
      // Create policy record
      const policyPayload = {
        policy_number: policyNumber,
        line_of_business: purchaseData.lineOfBusiness,
        insurer_id: purchaseData.providerId,
        product_id: purchaseData.productId,
        policy_status: 'Issued', // Set to Issued after successful payment
        source: 'Online Purchase',
        initiated_by_role: context.initiatedByRole,
        initiated_by_id: context.initiatedById,
        premium_amount: purchaseData.selectedQuote?.totalPremium || 0,
        // Role-specific tagging
        ...(context.initiatedByRole === 'employee' && { employee_id: context.initiatedById }),
        ...(context.initiatedByRole === 'agent' && { agent_id: context.initiatedById }),
        ...(purchaseData.onBehalfOf && {
          [`${purchaseData.onBehalfOf.type}_id`]: purchaseData.onBehalfOf.id
        }),
        ...purchaseData.policyData,
      };

      const { data: policy, error: policyError } = await supabase
        .from('policies_new')
        .insert(policyPayload)
        .select()
        .single();

      if (policyError) throw policyError;

      // Step 2: Trigger automatic commission calculation
      try {
        const { data: commissionResult, error: commissionError } = await supabase.functions.invoke(
          'auto-commission-calculator',
          {
            body: {
              policyId: policy.id,
              lineOfBusiness: purchaseData.lineOfBusiness,
              insurerId: purchaseData.providerId,
              productId: purchaseData.productId,
              premiumAmount: purchaseData.selectedQuote?.totalPremium || 0,
              agentId: context.initiatedByRole === 'agent' ? context.initiatedById : null,
              employeeId: context.initiatedByRole === 'employee' ? context.initiatedById : null,
              policyType: 'New'
            }
          }
        );

        if (commissionError) {
          console.error('Commission calculation error:', commissionError);
        } else {
          console.log('Commission calculation triggered:', commissionResult);
        }
      } catch (commissionErr) {
        console.error('Failed to trigger commission calculation:', commissionErr);
        // Don't fail the policy creation if commission calculation fails
      }

      // Step 3: Create status history entry
      await supabase
        .from('policy_status_history')
        .insert({
          policy_id: policy.id,
          previous_status: null,
          new_status: 'Issued', // Changed to Issued after successful payment
          updated_by: context.initiatedById,
          changed_by_role: context.initiatedByRole,
        });

      // Step 4: Create audit log
      await supabase
        .from('audit_logs')
        .insert({
          event: 'Online Policy Purchase Initiated',
          entity_type: 'policy',
          entity_id: policy.id,
          policy_id: policy.id,
          metadata: {
            initiated_by_role: context.initiatedByRole,
            initiated_by_id: context.initiatedById,
            source: 'Online Purchase',
            provider_name: purchaseData.providerName,
            product_name: purchaseData.productName,
            line_of_business: purchaseData.lineOfBusiness,
            payment_result: purchaseData.paymentResult,
            commission_triggered: true,
            final_premium: purchaseData.selectedQuote?.totalPremium || 0,
            add_ons_selected: purchaseData.selectedAddOns?.length || 0,
          } as any,
        });

      toast({
        title: "Policy Purchased Successfully!",
        description: `Policy ${policy.policy_number} has been issued. Commission calculation initiated.`,
      });

      // Complete session and reset form
      if (session) {
        await completeSession(policy.id);
      }
      setPurchaseData({});
      setCurrentStep(1);

    } catch (error) {
      console.error('Error creating policy:', error);
      toast({
        title: "Error",
        description: "Failed to create policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SelectLOB
            selectedLOB={purchaseData.lineOfBusiness}
            onSelect={async (lob) => {
              await updatePurchaseData({ lineOfBusiness: lob });
              // Create session if it doesn't exist
              if (!session) {
                await createSession({
                  line_of_business: lob,
                  phone_number: 'unknown', // Will be updated in customer details
                  current_step: 'product-selection'
                });
              }
            }}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <CustomerDetailsCollection
            lineOfBusiness={purchaseData.lineOfBusiness!}
            context={context}
            existingData={purchaseData.customerDetails}
            onDataChange={(data) => updatePurchaseData({ customerDetails: data })}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <SelectProvider
            lineOfBusiness={purchaseData.lineOfBusiness!}
            selectedProvider={purchaseData.providerId}
            onSelect={(providerId, providerName) => 
              updatePurchaseData({ providerId, providerName })
            }
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <SelectProduct
            providerId={purchaseData.providerId!}
            lineOfBusiness={purchaseData.lineOfBusiness!}
            selectedProduct={purchaseData.productId}
            onSelect={(productId, productName) => 
              updatePurchaseData({ productId, productName })
            }
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 5:
        return (
          <QuoteComparison
            lineOfBusiness={purchaseData.lineOfBusiness!}
            providerId={purchaseData.providerId!}
            productId={purchaseData.productId!}
            customerDetails={purchaseData.customerDetails}
            context={context}
            onSelect={(quote) => updatePurchaseData({ selectedQuote: quote })}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 6:
        return (
          <AddOnsSelection
            lineOfBusiness={purchaseData.lineOfBusiness!}
            productId={purchaseData.productId!}
            selectedQuote={purchaseData.selectedQuote}
            selectedAddOns={purchaseData.selectedAddOns || []}
            onAddOnsChange={(addOns) => updatePurchaseData({ selectedAddOns: addOns })}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 7:
        const addOnsPremium = (purchaseData.selectedAddOns || []).reduce(
          (total: number, addOn: any) => total + addOn.premium, 0
        );
        const finalPremium = (purchaseData.selectedQuote?.totalPremium || 0) + addOnsPremium;
        
        return (
          <PaymentSimulation
            selectedQuote={purchaseData.selectedQuote}
            selectedAddOns={purchaseData.selectedAddOns || []}
            finalPremium={finalPremium}
            onPaymentSuccess={async (paymentResult) => {
              await updatePurchaseData({ paymentResult });
              if (session) {
                await updateSession({ payment_status: 'success' });
              }
              handleNext();
            }}
            onPrevious={handlePrevious}
          />
        );
      case 8:
        return (
          <ReviewSubmit
            purchaseData={purchaseData}
            context={context}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  const handleResumeSession = () => {
    if (session) {
      // Restore data from session
      setPurchaseData({
        lineOfBusiness: session.line_of_business,
        productId: session.product_id,
        providerId: session.selected_insurer_id,
        selectedQuote: session.selected_quote,
        selectedAddOns: session.addons_selected || [],
        customerDetails: session.proposal_data
      });
      
      // Navigate to appropriate step
      const stepMap: Record<string, number> = {
        'product-selection': 1,
        'customer-details': 2,
        'quote-result': 3,
        'addon-selection': 4,
        'proposal-form': 5,
        'payment': 6,
        'complete': 7
      };
      setCurrentStep(stepMap[session.current_step] || 1);
    }
    setShowResumeModal(false);
  };

  const handleStartNewQuote = () => {
    clearSession();
    setPurchaseData({});
    setCurrentStep(1);
    setShowResumeModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Resume Quote Modal */}
      {session && (
        <ResumeQuoteModal
          isOpen={showResumeModal}
          onClose={() => setShowResumeModal(false)}
          onResume={handleResumeSession}
          onStartNew={handleStartNewQuote}
          session={session}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Online Policy Purchase</h1>
          <p className="text-muted-foreground">
            Complete your policy purchase in simple steps
          </p>
        </div>
        <Badge variant="outline">
          {context.initiatedByRole.charAt(0).toUpperCase() + context.initiatedByRole.slice(1)} Portal
        </Badge>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Step {currentStep} of {steps.length}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center space-y-2 ${
                      isCompleted || isCurrent ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isCurrent
                          ? 'border-primary bg-background'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="text-xs text-center font-medium hidden sm:block">
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
            {steps[currentStep - 1].name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};