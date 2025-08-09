import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, User, Phone, Calendar, MapPin, Car, Heart, Plane, DollarSign } from 'lucide-react';

interface CustomerDetailsCollectionProps {
  lineOfBusiness: string;
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

export const CustomerDetailsCollection: React.FC<CustomerDetailsCollectionProps> = ({
  lineOfBusiness,
  context,
  existingData,
  onDataChange,
  onNext,
  onPrevious,
}) => {
  const [customerData, setCustomerData] = useState({
    // Basic Details
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    
    // LOB Specific Fields
    ...existingData,
  });

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    onDataChange(customerData);
    validateForm();
  }, [customerData, onDataChange]);

  const validateForm = () => {
    const basicValid = customerData.fullName && 
                      customerData.email && 
                      customerData.phone && 
                      customerData.dateOfBirth;
    
    let lobSpecificValid = true;
    
    switch (lineOfBusiness.toLowerCase()) {
      case 'motor':
        lobSpecificValid = !!(customerData.vehicleRegistration && customerData.vehicleManufacturer);
        break;
      case 'health':
        lobSpecificValid = !!(customerData.height && customerData.weight);
        break;
      case 'life':
        lobSpecificValid = !!(customerData.annualIncome && customerData.nomineeName);
        break;
      case 'travel':
        lobSpecificValid = !!(customerData.destination && customerData.travelStartDate);
        break;
    }
    
    setIsValid(!!(basicValid && lobSpecificValid));
  };

  const updateField = (field: string, value: any) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const renderBasicDetails = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={customerData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={customerData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={customerData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={customerData.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={customerData.gender} onValueChange={(value) => updateField('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAddressDetails = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="addressLine1">Address Line 1</Label>
          <Input
            id="addressLine1"
            value={customerData.addressLine1}
            onChange={(e) => updateField('addressLine1', e.target.value)}
            placeholder="Enter address"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={customerData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Enter city"
            />
          </div>
          
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={customerData.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="Enter state"
            />
          </div>
          
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={customerData.pincode}
              onChange={(e) => updateField('pincode', e.target.value)}
              placeholder="Enter pincode"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMotorSpecificFields = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Vehicle Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vehicleRegistration">Vehicle Registration Number *</Label>
            <Input
              id="vehicleRegistration"
              value={customerData.vehicleRegistration}
              onChange={(e) => updateField('vehicleRegistration', e.target.value)}
              placeholder="Enter registration number"
            />
          </div>
          
          <div>
            <Label htmlFor="vehicleManufacturer">Manufacturer *</Label>
            <Select value={customerData.vehicleManufacturer} onValueChange={(value) => updateField('vehicleManufacturer', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maruti">Maruti Suzuki</SelectItem>
                <SelectItem value="hyundai">Hyundai</SelectItem>
                <SelectItem value="tata">Tata Motors</SelectItem>
                <SelectItem value="mahindra">Mahindra</SelectItem>
                <SelectItem value="honda">Honda</SelectItem>
                <SelectItem value="toyota">Toyota</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="vehicleModel">Model</Label>
            <Input
              id="vehicleModel"
              value={customerData.vehicleModel}
              onChange={(e) => updateField('vehicleModel', e.target.value)}
              placeholder="Enter vehicle model"
            />
          </div>
          
          <div>
            <Label htmlFor="manufacturingYear">Manufacturing Year</Label>
            <Input
              id="manufacturingYear"
              type="number"
              value={customerData.manufacturingYear}
              onChange={(e) => updateField('manufacturingYear', e.target.value)}
              placeholder="Enter year"
              min="2000"
              max={new Date().getFullYear()}
            />
          </div>
          
          <div>
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select value={customerData.fuelType} onValueChange={(value) => updateField('fuelType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="cng">CNG</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="ncbPercent">No Claim Bonus (%)</Label>
            <Select value={customerData.ncbPercent} onValueChange={(value) => updateField('ncbPercent', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select NCB" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (New Policy)</SelectItem>
                <SelectItem value="20">20%</SelectItem>
                <SelectItem value="25">25%</SelectItem>
                <SelectItem value="35">35%</SelectItem>
                <SelectItem value="45">45%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderHealthSpecificFields = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Health Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="height">Height (cm) *</Label>
            <Input
              id="height"
              type="number"
              value={customerData.height}
              onChange={(e) => updateField('height', e.target.value)}
              placeholder="Enter height in cm"
            />
          </div>
          
          <div>
            <Label htmlFor="weight">Weight (kg) *</Label>
            <Input
              id="weight"
              type="number"
              value={customerData.weight}
              onChange={(e) => updateField('weight', e.target.value)}
              placeholder="Enter weight in kg"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Do you have any pre-existing medical conditions?</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="diabetes"
              checked={customerData.preExistingConditions?.includes('diabetes')}
              onCheckedChange={(checked) => {
                const conditions = customerData.preExistingConditions || [];
                if (checked) {
                  updateField('preExistingConditions', [...conditions, 'diabetes']);
                } else {
                  updateField('preExistingConditions', conditions.filter((c: string) => c !== 'diabetes'));
                }
              }}
            />
            <Label htmlFor="diabetes">Diabetes</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hypertension"
              checked={customerData.preExistingConditions?.includes('hypertension')}
              onCheckedChange={(checked) => {
                const conditions = customerData.preExistingConditions || [];
                if (checked) {
                  updateField('preExistingConditions', [...conditions, 'hypertension']);
                } else {
                  updateField('preExistingConditions', conditions.filter((c: string) => c !== 'hypertension'));
                }
              }}
            />
            <Label htmlFor="hypertension">Hypertension</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="smoker"
              checked={customerData.smoker}
              onCheckedChange={(checked) => updateField('smoker', checked)}
            />
            <Label htmlFor="smoker">I am a smoker</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLifeSpecificFields = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Life Insurance Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="annualIncome">Annual Income *</Label>
            <Select value={customerData.annualIncome} onValueChange={(value) => updateField('annualIncome', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select income range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="below-3">Below ₹3 Lakh</SelectItem>
                <SelectItem value="3-5">₹3-5 Lakh</SelectItem>
                <SelectItem value="5-10">₹5-10 Lakh</SelectItem>
                <SelectItem value="10-25">₹10-25 Lakh</SelectItem>
                <SelectItem value="above-25">Above ₹25 Lakh</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={customerData.occupation}
              onChange={(e) => updateField('occupation', e.target.value)}
              placeholder="Enter occupation"
            />
          </div>
          
          <div>
            <Label htmlFor="nomineeName">Nominee Name *</Label>
            <Input
              id="nomineeName"
              value={customerData.nomineeName}
              onChange={(e) => updateField('nomineeName', e.target.value)}
              placeholder="Enter nominee name"
            />
          </div>
          
          <div>
            <Label htmlFor="nomineeRelation">Nominee Relationship</Label>
            <Select value={customerData.nomineeRelation} onValueChange={(value) => updateField('nomineeRelation', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTravelSpecificFields = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="w-5 h-5" />
          Travel Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="destination">Destination Country *</Label>
            <Input
              id="destination"
              value={customerData.destination}
              onChange={(e) => updateField('destination', e.target.value)}
              placeholder="Enter destination"
            />
          </div>
          
          <div>
            <Label htmlFor="travelStartDate">Travel Start Date *</Label>
            <Input
              id="travelStartDate"
              type="date"
              value={customerData.travelStartDate}
              onChange={(e) => updateField('travelStartDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <Label htmlFor="travelEndDate">Travel End Date</Label>
            <Input
              id="travelEndDate"
              type="date"
              value={customerData.travelEndDate}
              onChange={(e) => updateField('travelEndDate', e.target.value)}
              min={customerData.travelStartDate}
            />
          </div>
          
          <div>
            <Label htmlFor="travelPurpose">Travel Purpose</Label>
            <Select value={customerData.travelPurpose} onValueChange={(value) => updateField('travelPurpose', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tourism">Tourism</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="study">Study</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLOBSpecificFields = () => {
    switch (lineOfBusiness.toLowerCase()) {
      case 'motor':
        return renderMotorSpecificFields();
      case 'health':
        return renderHealthSpecificFields();
      case 'life':
        return renderLifeSpecificFields();
      case 'travel':
        return renderTravelSpecificFields();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
        <p className="text-muted-foreground">
          Please provide the required details to get accurate insurance quotes
        </p>
      </div>

      {renderBasicDetails()}
      {renderAddressDetails()}
      {renderLOBSpecificFields()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="min-w-32"
        >
          Get Quotes
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};