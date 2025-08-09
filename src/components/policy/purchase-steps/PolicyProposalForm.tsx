import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { HealthInsuranceFields } from '@/components/admin/product-forms/HealthInsuranceFields';
import { LifeInsuranceFields } from '@/components/admin/product-forms/LifeInsuranceFields';
import { MotorInsuranceFields } from '@/components/admin/product-forms/MotorInsuranceFields';
import { TravelInsuranceFields } from '@/components/admin/product-forms/TravelInsuranceFields';
import { LoanInsuranceFields } from '@/components/admin/product-forms/LoanInsuranceFields';

interface PolicyProposalFormProps {
  lineOfBusiness: string;
  productId: string;
  context: {
    initiatedByRole: 'admin' | 'employee' | 'agent' | 'customer';
    initiatedById: string;
    canSelectOnBehalf?: boolean;
  };
  existingData?: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const PolicyProposalForm: React.FC<PolicyProposalFormProps> = ({
  lineOfBusiness,
  productId,
  context,
  existingData,
  onDataChange,
  onNext,
  onPrevious,
}) => {
  const form = useForm({
    defaultValues: existingData || {},
  });
  
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const subscription = form.watch((data) => {
      onDataChange(data);
      // Basic validation - can be enhanced based on LOB requirements
      setIsValid(!!data.grossPremium && data.grossPremium > 0);
    });
    return () => subscription.unsubscribe();
  }, [form, onDataChange]);

  const renderFormFields = () => {
    const commonProps = {
      form,
      productType: lineOfBusiness,
    };

    switch (lineOfBusiness.toLowerCase()) {
      case 'health':
        return <HealthInsuranceFields {...commonProps} />;
      case 'life':
        return <LifeInsuranceFields {...commonProps} />;
      case 'motor':
        return <MotorInsuranceFields {...commonProps} />;
      case 'travel':
        return <TravelInsuranceFields {...commonProps} />;
      case 'loan':
        return <LoanInsuranceFields {...commonProps} />;
      default:
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">Form Under Development</h3>
              <p className="text-muted-foreground">
                The policy form for {lineOfBusiness} insurance is being developed. 
                Please contact support for assistance.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Policy Proposal Details</h3>
        <p className="text-muted-foreground">
          Fill in the required information for your {lineOfBusiness} insurance policy
        </p>
      </div>

      {/* Context Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Initiated by: {context.initiatedByRole.charAt(0).toUpperCase() + context.initiatedByRole.slice(1)}
            </span>
            <span className="text-muted-foreground">
              Source: Online Purchase Portal
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Form Fields */}
      <Form {...form}>
        <form className="space-y-6">
          {renderFormFields()}
        </form>
      </Form>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="min-w-32"
        >
          Review Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};