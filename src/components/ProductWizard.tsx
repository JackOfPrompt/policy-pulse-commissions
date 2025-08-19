import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { ProductBasicInfo } from './product-wizard/ProductBasicInfo';
import { PlanTypesStep } from './product-wizard/PlanTypesStep';
import { VariantsStep } from './product-wizard/VariantsStep';
import { CoverageOptionsStep } from './product-wizard/CoverageOptionsStep';
import { ReviewStep } from './product-wizard/ReviewStep';
import { useToast } from '@/hooks/use-toast';

interface Product {
  product_id?: string;
  product_name: string;
  product_code: string;
  description?: string;
  lob_id: string;
  provider_id?: string;
  status: 'Active' | 'Inactive';
  plan_types?: PlanType[];
}

interface PlanType {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  variants?: Variant[];
}

interface Variant {
  id?: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
  coverages?: Coverage[];
}

interface Coverage {
  id?: string;
  sum_insured: number;
  policy_term: number;
  premium_payment_term: number;
  premium_min: number;
  premium_max: number;
  metadata?: Record<string, any>;
}

interface ProductWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
  lobs: Array<{ lob_id: string; lob_name: string }>;
  providers: Array<{ provider_id: string; provider_name: string }>;
}

const steps = [
  { id: 1, title: 'Basic Info', description: 'LOB & Provider Details' },
  { id: 2, title: 'Plan Types', description: 'Define Plan Categories' },
  { id: 3, title: 'Variants', description: 'Add Product Variants' },
  { id: 4, title: 'Coverage', description: 'Coverage Options' },
  { id: 5, title: 'Review', description: 'Review & Save' },
];

export const ProductWizard: React.FC<ProductWizardProps> = ({
  isOpen,
  onOpenChange,
  product,
  onSuccess,
  lobs,
  providers,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [productData, setProductData] = useState<Product>(() => ({
    product_name: product?.product_name || '',
    product_code: product?.product_code || '',
    description: product?.description || '',
    lob_id: product?.lob_id || '',
    provider_id: product?.provider_id || '',
    status: product?.status || 'Active',
    plan_types: product?.plan_types || [],
  }));
  const { toast } = useToast();

  const updateProductData = (updates: Partial<Product>) => {
    setProductData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setProductData({
      product_name: '',
      product_code: '',
      description: '',
      lob_id: '',
      provider_id: '',
      status: 'Active',
      plan_types: [],
    });
    onOpenChange(false);
  };

  const handleSave = async () => {
    try {
      // Here you would implement the actual save logic
      // For now, we'll just simulate a successful save
      toast({
        title: "Success",
        description: "Product saved successfully",
      });
      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProductBasicInfo
            data={productData}
            onUpdate={updateProductData}
            lobs={lobs}
            providers={providers}
          />
        );
      case 2:
        return (
          <PlanTypesStep
            planTypes={productData.plan_types || []}
            onUpdate={(planTypes) => updateProductData({ plan_types: planTypes })}
          />
        );
      case 3:
        return (
          <VariantsStep
            planTypes={productData.plan_types || []}
            onUpdate={(planTypes) => updateProductData({ plan_types: planTypes })}
          />
        );
      case 4:
        return (
          <CoverageOptionsStep
            planTypes={productData.plan_types || []}
            onUpdate={(planTypes) => updateProductData({ plan_types: planTypes })}
          />
        );
      case 5:
        return <ReviewStep data={productData} lobs={lobs} providers={providers} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return productData.product_name && productData.product_code && productData.lob_id;
      case 2:
        return (productData.plan_types?.length || 0) > 0;
      case 3:
        return productData.plan_types?.some(pt => (pt.variants?.length || 0) > 0);
      case 4:
        return productData.plan_types?.some(pt => 
          pt.variants?.some(v => (v.coverages?.length || 0) > 0)
        );
      default:
        return true;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep === step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep > step.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="text-center mt-2">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] px-4">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep === steps.length ? (
              <Button onClick={handleSave} className="gap-2">
                <Check className="h-4 w-4" />
                Save Product
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};