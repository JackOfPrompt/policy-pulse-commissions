import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLOBs } from '@/hooks/useLOBs';

interface AddPolicyWizardProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CorePolicyData {
  policyNumber: string;
  holderName: string;
  product: string;
  lob: string;
  policyType: string;
  channelType: string;
  issueDate: Date | undefined;
  expiryDate: Date | undefined;
  premiumAmount: string;
  commissionStructure: string;
  customCommission: string;
  revenueAmount: string;
}

interface LOBSpecificData {
  // Health
  sumInsured?: string;
  insuredPersons?: string;
  planType?: string;
  preExistingConditions?: string[];
  roomRentLimit?: string;
  coPayment?: string;
  
  // Motor
  vehicleType?: string;
  vehicleNumber?: string;
  engineNumber?: string;
  chassisNumber?: string;
  makeModel?: string;
  yearOfManufacture?: string;
  fuelType?: string;
  coverageType?: string;
  addOns?: string[];
  
  // Life
  sumAssured?: string;
  policyTerm?: string;
  maturityDate?: Date;
  nomineeName?: string;
  nomineeRelation?: string;
  premiumFrequency?: string;
  riders?: string[];
}

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export const AddPolicyWizard: React.FC<AddPolicyWizardProps> = ({
  tenantId,
  isOpen,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [coreData, setCoreData] = useState<CorePolicyData>({
    policyNumber: '',
    holderName: '',
    product: '',
    lob: '',
    policyType: '',
    channelType: '',
    issueDate: undefined,
    expiryDate: undefined,
    premiumAmount: '',
    commissionStructure: '',
    customCommission: '',
    revenueAmount: ''
  });
  const [lobData, setLobData] = useState<LOBSpecificData>({});
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { lobs } = useLOBs();

  const products = [
    { id: 'health-plus', name: 'Health Plus', lob: 'Health' },
    { id: 'motor-comprehensive', name: 'Motor Comprehensive', lob: 'Motor' },
    { id: 'term-life', name: 'Term Life Insurance', lob: 'Life' }
  ];

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setCoreData(prev => ({
      ...prev,
      product: productId,
      lob: product?.lob || ''
    }));
  };

  const calculateRevenue = () => {
    const premium = parseFloat(coreData.premiumAmount) || 0;
    const commission = coreData.commissionStructure === 'Custom' 
      ? parseFloat(coreData.customCommission) || 0
      : 10; // Default 10%
    
    const commissionAmount = (premium * commission) / 100;
    const revenue = premium - commissionAmount;
    
    setCoreData(prev => ({
      ...prev,
      revenueAmount: revenue.toString()
    }));
  };

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const documentId = Math.random().toString(36).substr(2, 9);
      const newDoc: UploadedDocument = {
        id: documentId,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading'
      };
      
      setDocuments(prev => [...prev, newDoc]);
      
      // Simulate file upload
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setDocuments(prev => prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, progress: 100, status: 'completed' }
              : doc
          ));
        } else {
          setDocuments(prev => prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, progress }
              : doc
          ));
        }
      }, 200);
    });
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Step 1: Create policy
      // const policyResponse = await fetch(`/api/v1/tenant-admin/${tenantId}/policies`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(coreData)
      // });
      // const policyResult = await policyResponse.json();
      
      // Step 2: Add LOB-specific details
      // if (Object.keys(lobData).length > 0) {
      //   await fetch(`/api/v1/tenant-admin/${tenantId}/policies/${policyResult.policyId}/details`, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(lobData)
      //   });
      // }
      
      // Step 3: Upload documents
      // for (const document of documents) {
      //   if (document.status === 'completed') {
      //     // Upload document logic here
      //   }
      // }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Policy created successfully",
        description: `Policy ${coreData.policyNumber} has been created for ${coreData.holderName}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Failed to create policy",
        description: "Please check all fields and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="policy-number">Policy Number *</Label>
          <Input
            id="policy-number"
            value={coreData.policyNumber}
            onChange={(e) => setCoreData(prev => ({ ...prev, policyNumber: e.target.value }))}
            placeholder="Enter policy number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="holder-name">Policy Holder Name *</Label>
          <Input
            id="holder-name"
            value={coreData.holderName}
            onChange={(e) => setCoreData(prev => ({ ...prev, holderName: e.target.value }))}
            placeholder="Enter holder name"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Product *</Label>
          <Select value={coreData.product} onValueChange={handleProductChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Line of Business</Label>
          <Input value={coreData.lob} disabled className="bg-muted" />
        </div>
        
        <div className="space-y-2">
          <Label>Policy Type *</Label>
          <Select value={coreData.policyType} onValueChange={(value) => setCoreData(prev => ({ ...prev, policyType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select policy type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Renewal">Renewal</SelectItem>
              <SelectItem value="Ported">Ported</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Channel Type *</Label>
          <Select value={coreData.channelType} onValueChange={(value) => setCoreData(prev => ({ ...prev, channelType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="POSP">POSP</SelectItem>
              <SelectItem value="MISP">MISP</SelectItem>
              <SelectItem value="Bancassurance">Bancassurance</SelectItem>
              <SelectItem value="Direct">Direct</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Broker">Broker</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Issue Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {coreData.issueDate ? format(coreData.issueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={coreData.issueDate}
                onSelect={(date) => setCoreData(prev => ({ ...prev, issueDate: date }))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label>Expiry Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {coreData.expiryDate ? format(coreData.expiryDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={coreData.expiryDate}
                onSelect={(date) => setCoreData(prev => ({ ...prev, expiryDate: date }))}
                disabled={(date) => coreData.issueDate ? date <= coreData.issueDate : false}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="premium">Premium Amount (₹) *</Label>
          <Input
            id="premium"
            type="number"
            value={coreData.premiumAmount}
            onChange={(e) => {
              setCoreData(prev => ({ ...prev, premiumAmount: e.target.value }));
              setTimeout(calculateRevenue, 100);
            }}
            placeholder="Enter premium amount"
            min="0"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Commission Structure *</Label>
          <Select 
            value={coreData.commissionStructure} 
            onValueChange={(value) => {
              setCoreData(prev => ({ ...prev, commissionStructure: value }));
              setTimeout(calculateRevenue, 100);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select commission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fixed">Fixed %</SelectItem>
              <SelectItem value="Slab">Slab</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {coreData.commissionStructure === 'Custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom-commission">Custom Commission (%)</Label>
            <Input
              id="custom-commission"
              type="number"
              value={coreData.customCommission}
              onChange={(e) => {
                setCoreData(prev => ({ ...prev, customCommission: e.target.value }));
                setTimeout(calculateRevenue, 100);
              }}
              placeholder="Enter commission percentage"
              min="0"
              max="100"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="revenue">Revenue Amount (₹)</Label>
          <Input
            id="revenue"
            type="number"
            value={coreData.revenueAmount}
            onChange={(e) => setCoreData(prev => ({ ...prev, revenueAmount: e.target.value }))}
            placeholder="Calculated automatically"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (coreData.lob === 'Health') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Health Insurance Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sum Insured (₹)</Label>
              <Input
                value={lobData.sumInsured || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, sumInsured: e.target.value }))}
                placeholder="Enter sum insured"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Insured Persons</Label>
              <Input
                value={lobData.insuredPersons || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, insuredPersons: e.target.value }))}
                placeholder="Enter number"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Plan Type</Label>
              <Select value={lobData.planType} onValueChange={(value) => setLobData(prev => ({ ...prev, planType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Family Floater">Family Floater</SelectItem>
                  <SelectItem value="Group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room Rent Limit (%)</Label>
              <Input
                value={lobData.roomRentLimit || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, roomRentLimit: e.target.value }))}
                placeholder="Enter percentage"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Co-payment (%)</Label>
              <Input
                value={lobData.coPayment || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, coPayment: e.target.value }))}
                placeholder="Enter percentage"
                type="number"
              />
            </div>
          </div>
        </div>
      );
    }

    if (coreData.lob === 'Motor') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Motor Insurance Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={lobData.vehicleType} onValueChange={(value) => setLobData(prev => ({ ...prev, vehicleType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Bike">Bike</SelectItem>
                  <SelectItem value="Commercial">Commercial Vehicle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input
                value={lobData.vehicleNumber || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                placeholder="Enter vehicle number"
              />
            </div>
            <div className="space-y-2">
              <Label>Engine Number</Label>
              <Input
                value={lobData.engineNumber || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, engineNumber: e.target.value }))}
                placeholder="Enter engine number"
              />
            </div>
            <div className="space-y-2">
              <Label>Chassis Number</Label>
              <Input
                value={lobData.chassisNumber || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, chassisNumber: e.target.value }))}
                placeholder="Enter chassis number"
              />
            </div>
            <div className="space-y-2">
              <Label>Make & Model</Label>
              <Input
                value={lobData.makeModel || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, makeModel: e.target.value }))}
                placeholder="Enter make and model"
              />
            </div>
            <div className="space-y-2">
              <Label>Year of Manufacture</Label>
              <Input
                value={lobData.yearOfManufacture || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, yearOfManufacture: e.target.value }))}
                placeholder="Enter year"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Coverage Type</Label>
              <Select value={lobData.coverageType} onValueChange={(value) => setLobData(prev => ({ ...prev, coverageType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Third Party">Third Party</SelectItem>
                  <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                  <SelectItem value="Own Damage">Own Damage</SelectItem>
                  <SelectItem value="Zero Dep">Zero Depreciation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    if (coreData.lob === 'Life') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Life Insurance Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sum Assured (₹)</Label>
              <Input
                value={lobData.sumAssured || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, sumAssured: e.target.value }))}
                placeholder="Enter sum assured"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Policy Term (Years)</Label>
              <Input
                value={lobData.policyTerm || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, policyTerm: e.target.value }))}
                placeholder="Enter policy term"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label>Nominee Name</Label>
              <Input
                value={lobData.nomineeName || ''}
                onChange={(e) => setLobData(prev => ({ ...prev, nomineeName: e.target.value }))}
                placeholder="Enter nominee name"
              />
            </div>
            <div className="space-y-2">
              <Label>Nominee Relation</Label>
              <Select value={lobData.nomineeRelation} onValueChange={(value) => setLobData(prev => ({ ...prev, nomineeRelation: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spouse">Spouse</SelectItem>
                  <SelectItem value="Child">Child</SelectItem>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Premium Payment Frequency</Label>
              <Select value={lobData.premiumFrequency} onValueChange={(value) => setLobData(prev => ({ ...prev, premiumFrequency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Half-yearly">Half-yearly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">LOB-Specific Details</h3>
        <p className="text-muted-foreground">
          Please select a product to view relevant fields for this line of business.
        </p>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Document Upload</h3>
      
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium">Drag and drop files here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Supported formats: PDF, JPG, PNG, DOCX (Max 10MB per file, 50MB total)
        </p>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Documents</h4>
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(doc.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                {doc.status === 'uploading' && (
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${doc.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(doc.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return !!(
          coreData.policyNumber &&
          coreData.holderName &&
          coreData.product &&
          coreData.policyType &&
          coreData.channelType &&
          coreData.issueDate &&
          coreData.expiryDate &&
          coreData.premiumAmount
        );
      case 2:
        return true; // LOB-specific fields are optional
      case 3:
        return true; // Documents are optional
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Policy</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step}
              </div>
              <div className="ml-2 text-sm">
                {step === 1 && "Core Details"}
                {step === 2 && "LOB Specific"}
                {step === 3 && "Documents"}
              </div>
              {step < 3 && (
                <div className="w-12 h-px bg-muted mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(prev => prev - 1) : onClose()}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep > 1 ? "Previous" : "Cancel"}
          </Button>
          
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!isStepValid(currentStep)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !isStepValid(currentStep)}
            >
              {loading ? "Creating Policy..." : "Create Policy"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};