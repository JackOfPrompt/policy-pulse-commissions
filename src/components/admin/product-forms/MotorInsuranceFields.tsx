import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MotorInsuranceFieldsProps {
  form: UseFormReturn<any>;
  productType: string;
}

// Dropdown data
const POLICY_TYPES = ["New Business", "Renewal"];
const POLICY_SUB_TYPES = {
  car: ["Comprehensive (OD + TP)", "Standalone OD", "Third Party Only", "Long-Term Third Party"],
  twoWheeler: ["Comprehensive (OD + TP)", "Standalone OD", "TP Only"],
  commercial: ["Comprehensive (OD + TP)", "TP Only"]
};

const FUEL_TYPES = {
  car: ["Petrol", "Diesel", "CNG", "LPG", "Electric", "Hybrid"],
  twoWheeler: ["Petrol", "Electric"],
  commercial: ["Petrol", "Diesel", "CNG", "LPG"]
};

const NCB_PERCENTAGES = ["0", "20", "25", "35", "45", "50"];

const VEHICLE_MAKES = {
  car: ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota", "Ford", "Volkswagen", "Skoda", "Renault"],
  twoWheeler: ["Hero", "Honda", "Bajaj", "TVS", "Yamaha", "Royal Enfield", "KTM", "Suzuki"],
  commercial: ["Tata", "Ashok Leyland", "Mahindra", "Eicher", "Force", "Isuzu", "Bharat Benz"]
};

const VEHICLE_TYPES = {
  twoWheeler: ["Scooter", "Motorcycle", "Moped"],
  commercial: ["Goods Carrier", "Passenger Carrier", "Taxi", "Bus", "Auto", "Delivery Van", "School Van"],
  miscellaneous: ["Ambulance", "Crane", "Excavator", "Forklift", "Agricultural Vehicle", "Fire Truck", "Construction Equipment"]
};

const BODY_TYPES = ["Truck", "Tanker", "Trailer", "Dumper", "Container", "Open Body", "Closed Body"];

const PERMIT_TYPES = ["National Permit", "State Permit", "Contract Carriage", "Private Carrier", "Tourist Permit"];

const INSURERS = ["ICICI Lombard", "HDFC ERGO", "Bajaj Allianz", "TATA AIG", "New India", "Oriental", "United India", "National"];

const ADD_ONS = {
  car: ["Zero Depreciation", "Engine Protection", "NCB Protection", "Consumables Cover", "Roadside Assistance", "Return to Invoice", "Key Replacement", "Tyre Protection", "Daily Allowance", "GAP Cover"],
  twoWheeler: ["Zero Depreciation", "NCB Protection", "Roadside Assistance", "Personal Belongings", "Pillion Rider Cover", "Consumables Cover"],
  commercial: ["Engine Protection", "Legal Liability Cover", "Roadside Assistance", "Personal Accident Cover (Owner/Driver)", "NCB Protection", "Downtime Allowance"]
};

// Sample RTO codes
const RTO_LOCATIONS = ["AP01", "AP02", "DL01", "DL02", "GJ01", "GJ02", "KA01", "KA02", "MH01", "MH02", "TN01", "TN02"];

// Helper functions
const getModels = (make: string, vehicleType: string) => {
  // Sample models for demonstration
  const models: Record<string, string[]> = {
    "Maruti Suzuki": ["Swift", "Baleno", "WagonR", "Alto", "Dzire"],
    "Hyundai": ["i10", "i20", "Creta", "Verna", "Santro"],
    "Hero": ["Splendor", "Passion", "HF Deluxe", "Xtreme"],
    "Honda": ["Activa", "Shine", "CB Hornet", "Unicorn"],
    "Tata": ["Ace", "407", "709", "1109", "LPT 1613"]
  };
  return models[make] || [];
};

const getVariants = (model: string) => {
  // Sample variants
  return ["Base", "Mid", "Top", "VXI", "ZXI"];
};

export const MotorInsuranceFields = ({ form, productType }: MotorInsuranceFieldsProps) => {
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const handleAddOnChange = (addOn: string, checked: boolean) => {
    setSelectedAddOns(prev => 
      checked ? [...prev, addOn] : prev.filter(item => item !== addOn)
    );
  };

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-yellow-800">🚗 Motor Insurance - {productType}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="car" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="car">Private Car</TabsTrigger>
            <TabsTrigger value="twoWheeler">Two Wheeler</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="miscellaneous">Miscellaneous</TabsTrigger>
          </TabsList>

          <TabsContent value="car" className="space-y-6">
            <PrivateCarForm form={form} selectedMake={selectedMake} setSelectedMake={setSelectedMake} selectedAddOns={selectedAddOns} handleAddOnChange={handleAddOnChange} />
          </TabsContent>

          <TabsContent value="twoWheeler" className="space-y-6">
            <TwoWheelerForm form={form} selectedMake={selectedMake} setSelectedMake={setSelectedMake} selectedAddOns={selectedAddOns} handleAddOnChange={handleAddOnChange} />
          </TabsContent>

          <TabsContent value="commercial" className="space-y-6">
            <CommercialVehicleForm form={form} selectedMake={selectedMake} setSelectedMake={setSelectedMake} selectedAddOns={selectedAddOns} handleAddOnChange={handleAddOnChange} />
          </TabsContent>

          <TabsContent value="miscellaneous" className="space-y-6">
            <MiscellaneousVehicleForm form={form} selectedMake={selectedMake} setSelectedMake={setSelectedMake} selectedAddOns={selectedAddOns} handleAddOnChange={handleAddOnChange} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Private Car Form Component
const PrivateCarForm = ({ form, selectedMake, setSelectedMake, selectedAddOns, handleAddOnChange }: any) => (
  <div className="space-y-6">
    {/* Policy Details */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Policy Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="policyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLICY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="policySubType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Sub Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLICY_SUB_TYPES.car.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>

    {/* Vehicle Details */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vehicle Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="rtoLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RTO Location</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RTO" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {RTO_LOCATIONS.map((rto) => (
                    <SelectItem key={rto} value={rto}>{rto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleMake"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Make</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); setSelectedMake(value); }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_MAKES.car.map((make) => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Model</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedMake}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getModels(selectedMake, "car").map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fuelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FUEL_TYPES.car.map((fuel) => (
                    <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter registration number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="idv"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IDV (₹)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter IDV" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>

    {/* Previous Policy Details */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Previous Policy Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="previousClaim"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous Claim</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ncbPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NCB (%)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select NCB %" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {NCB_PERCENTAGES.map((ncb) => (
                    <SelectItem key={ncb} value={ncb}>{ncb}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previousInsurer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Previous Policy Company</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select insurer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INSURERS.map((insurer) => (
                    <SelectItem key={insurer} value={insurer}>{insurer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>

    {/* Add-ons */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add-ons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {ADD_ONS.car.map((addOn) => (
            <div key={addOn} className="flex items-center space-x-2">
              <Checkbox
                id={addOn}
                checked={selectedAddOns.includes(addOn)}
                onCheckedChange={(checked) => handleAddOnChange(addOn, checked as boolean)}
              />
              <label htmlFor={addOn} className="text-sm font-medium">
                {addOn}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Two Wheeler Form Component
const TwoWheelerForm = ({ form, selectedMake, setSelectedMake, selectedAddOns, handleAddOnChange }: any) => (
  <div className="space-y-6">
    {/* Policy Details */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Policy Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="policyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLICY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="policySubType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Sub Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLICY_SUB_TYPES.twoWheeler.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>

    {/* Vehicle Details */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bike Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_TYPES.twoWheeler.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleMake"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Make</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); setSelectedMake(value); }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_MAKES.twoWheeler.map((make) => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fuelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FUEL_TYPES.twoWheeler.map((fuel) => (
                    <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter registration number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>

    {/* Add-ons for Two Wheeler */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add-ons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {ADD_ONS.twoWheeler.map((addOn) => (
            <div key={addOn} className="flex items-center space-x-2">
              <Checkbox
                id={addOn}
                checked={selectedAddOns.includes(addOn)}
                onCheckedChange={(checked) => handleAddOnChange(addOn, checked as boolean)}
              />
              <label htmlFor={addOn} className="text-sm font-medium">
                {addOn}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Commercial Vehicle Form Component
const CommercialVehicleForm = ({ form, selectedMake, setSelectedMake, selectedAddOns, handleAddOnChange }: any) => (
  <div className="space-y-6">
    {/* Policy Details */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Policy Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="policyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLICY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="policySubType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Sub Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POLICY_SUB_TYPES.commercial.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>

    {/* Commercial Vehicle Details */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Commercial Vehicle Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_TYPES.commercial.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bodyType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select body type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BODY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permitType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Permit Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select permit type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PERMIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleMake"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Make</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); setSelectedMake(value); }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_MAKES.commercial.map((make) => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>

    {/* Add-ons for Commercial */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add-ons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {ADD_ONS.commercial.map((addOn) => (
            <div key={addOn} className="flex items-center space-x-2">
              <Checkbox
                id={addOn}
                checked={selectedAddOns.includes(addOn)}
                onCheckedChange={(checked) => handleAddOnChange(addOn, checked as boolean)}
              />
              <label htmlFor={addOn} className="text-sm font-medium">
                {addOn}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Miscellaneous Vehicle Form Component
const MiscellaneousVehicleForm = ({ form, selectedMake, setSelectedMake, selectedAddOns, handleAddOnChange }: any) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Miscellaneous Vehicle Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VEHICLE_TYPES.miscellaneous.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter registration number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  </div>
);