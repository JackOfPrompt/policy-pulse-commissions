import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Car, 
  MapPin, 
  Shield, 
  Heart, 
  Gift,
  DollarSign,
  Building,
  Users,
  Briefcase,
  FileText,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterDataTable } from "@/components/admin/master-data/MasterDataTable";
import { MasterDataUpload } from "@/components/admin/master-data/MasterDataUpload";
import { EnhancedVehicleUpload } from "@/components/admin/master-data/EnhancedVehicleUpload";
import { UINCodeUpload } from "@/components/admin/master-data/UINCodeUpload";
import { StorageBasedUpload } from "@/components/admin/master-data/StorageBasedUpload";
import EnhancedBulkUploadModal from "@/components/admin/EnhancedBulkUploadModal";
import { supabase } from "@/integrations/supabase/client";

// Master data entity configurations
const masterDataEntities = [
  {
    id: "vehicle_data",
    name: "Vehicle Data",
    table: "master_vehicle_data",
    icon: Car,
    description: "Vehicle makes, models, variants and specifications with provider-specific data",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    fields: [
      { name: "provider_id", label: "Insurance Provider", type: "select", required: true, options: [] },
      { name: "vehicle_type", label: "Vehicle Type", type: "select", required: true, options: ["Private Car", "Commercial Vehicle", "Two Wheeler", "Three Wheeler", "Tractor", "Goods Carrying Vehicle"] },
      { name: "make", label: "Make", type: "text", required: true },
      { name: "model", label: "Model", type: "text", required: true },
      { name: "variant", label: "Variant", type: "text" },
      { name: "fuel_type", label: "Fuel Type", type: "select", options: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"] },
      { name: "vehicle_category", label: "Vehicle Category", type: "select", options: ["M1", "M2", "M3", "N1", "N2", "N3", "L1", "L2", "L3", "L4", "L5"] },
      { name: "cubic_capacity", label: "Cubic Capacity (cc)", type: "number" },
      { name: "seating_capacity", label: "Seating Capacity", type: "number" },
      { name: "manufacturing_year_start", label: "Manufacturing Year Start", type: "number" },
      { name: "manufacturing_year_end", label: "Manufacturing Year End", type: "number" },
      { name: "body_type", label: "Body Type", type: "select", options: ["Sedan", "Hatchback", "SUV", "MUV", "Convertible", "Coupe", "Station Wagon", "Pickup", "Van", "Bus", "Truck"] },
      { name: "transmission_type", label: "Transmission Type", type: "select", options: ["Manual", "Automatic", "CVT", "AMT"] },
      { name: "ex_showroom_price", label: "Ex-Showroom Price", type: "number" },
      { name: "max_gvw", label: "Max GVW (kg)", type: "number" },
      { name: "max_payload", label: "Max Payload (kg)", type: "number" },
      { name: "wheelbase", label: "Wheelbase (mm)", type: "number" },
      { name: "ground_clearance", label: "Ground Clearance (mm)", type: "number" },
      { name: "safety_rating", label: "Safety Rating", type: "select", options: ["1 Star", "2 Star", "3 Star", "4 Star", "5 Star", "Not Rated"] },
      { name: "airbags_count", label: "Number of Airbags", type: "number" },
      { name: "abs_available", label: "ABS Available", type: "checkbox" },
      { name: "ebd_available", label: "EBD Available", type: "checkbox" },
      { name: "esp_available", label: "ESP Available", type: "checkbox" },
      { name: "isofix_available", label: "ISOFIX Available", type: "checkbox" },
      { name: "reverse_camera", label: "Reverse Camera", type: "checkbox" },
      { name: "reverse_sensors", label: "Reverse Sensors", type: "checkbox" },
      { name: "tpms_available", label: "TPMS Available", type: "checkbox" },
      { name: "engine_capacity_litres", label: "Engine Capacity (Litres)", type: "number" },
      { name: "max_power_bhp", label: "Max Power (BHP)", type: "number" },
      { name: "max_torque_nm", label: "Max Torque (Nm)", type: "number" },
      { name: "mileage_kmpl", label: "Mileage (KMPL)", type: "number" },
      { name: "fuel_tank_capacity", label: "Fuel Tank Capacity (Litres)", type: "number" },
      { name: "boot_space_litres", label: "Boot Space (Litres)", type: "number" },
      { name: "turning_radius", label: "Turning Radius (m)", type: "number" },
      { name: "ncap_rating", label: "NCAP Rating", type: "text" },
      { name: "registration_type", label: "Registration Type", type: "select", options: ["Private", "Commercial", "Taxi"] },
      { name: "rto_applicable", label: "RTO Applicable", type: "text" },
      { name: "depreciation_rate", label: "Depreciation Rate (%)", type: "number" },
      { name: "idv_percentage", label: "IDV Percentage", type: "number" },
      { name: "zone_classification", label: "Zone Classification", type: "select", options: ["Zone A", "Zone B", "Zone C"] },
      { name: "provider_vehicle_code", label: "Provider Vehicle Code", type: "text" },
      { name: "api_mapping_key", label: "API Mapping Key", type: "text" },
      { name: "is_commercial_use", label: "Commercial Use Allowed", type: "checkbox" },
      { name: "special_attributes", label: "Special Attributes", type: "textarea" },
      { name: "remarks", label: "Remarks", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "cities",
    name: "Cities & Pincodes",
    table: "pincode_data",
    icon: MapPin,
    description: "Master list of cities, states and pincode mapping",
    color: "bg-green-50 text-green-700 border-green-200",
    fields: [
      { name: "city_name", label: "City Name", type: "text", required: true },
      { name: "state_name", label: "State Name", type: "text", required: true },
      { name: "pincode", label: "Pincode", type: "text", required: true },
      { name: "district_name", label: "District", type: "text" },
      { name: "region", label: "Region", type: "text" },
      { name: "tier", label: "Tier", type: "select", options: ["Tier 1", "Tier 2", "Tier 3"] },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "addons",
    name: "Add-ons & Riders",
    table: "master_addons",
    icon: Shield,
    description: "Insurance add-ons, riders and additional covers",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    fields: [
      { name: "addon_name", label: "Add-on Name", type: "text", required: true },
      { name: "addon_code", label: "Add-on Code", type: "text" },
      { name: "line_of_business", label: "Line of Business", type: "text", required: true },
      { name: "addon_type", label: "Add-on Type", type: "select", options: ["rider", "addon", "cover"] },
      { name: "description", label: "Description", type: "textarea" },
      { name: "base_premium", label: "Base Premium", type: "number" },
      { name: "premium_percentage", label: "Premium Percentage", type: "number" },
      { name: "sum_insured_limit", label: "Sum Insured Limit", type: "number" },
      { name: "applicable_age_min", label: "Min Age", type: "number" },
      { name: "applicable_age_max", label: "Max Age", type: "number" },
      { name: "is_mandatory", label: "Is Mandatory", type: "checkbox" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "health_conditions",
    name: "Health Conditions",
    table: "master_health_conditions",
    icon: Heart,
    description: "Medical conditions, waiting periods and coverage rules",
    color: "bg-red-50 text-red-700 border-red-200",
    fields: [
      { name: "condition_name", label: "Condition Name", type: "text", required: true },
      { name: "condition_code", label: "Condition Code", type: "text" },
      { name: "category", label: "Category", type: "select", options: ["pre-existing", "critical", "minor"] },
      { name: "waiting_period_months", label: "Waiting Period (Months)", type: "number" },
      { name: "exclusion_period_months", label: "Exclusion Period (Months)", type: "number" },
      { name: "coverage_percentage", label: "Coverage Percentage", type: "number" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "benefits",
    name: "Benefit Lists",
    table: "master_benefits",
    icon: Gift,
    description: "Insurance benefits and coverage details",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    fields: [
      { name: "benefit_name", label: "Benefit Name", type: "text", required: true },
      { name: "benefit_code", label: "Benefit Code", type: "text" },
      { name: "line_of_business", label: "Line of Business", type: "text", required: true },
      { name: "benefit_type", label: "Benefit Type", type: "select", options: ["cash", "cashless", "reimbursement"] },
      { name: "benefit_amount", label: "Benefit Amount", type: "number" },
      { name: "benefit_percentage", label: "Benefit Percentage", type: "number" },
      { name: "coverage_limit", label: "Coverage Limit", type: "number" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "premium_bands",
    name: "Premium Bands",
    table: "master_premium_bands",
    icon: DollarSign,
    description: "Premium calculation bands and rates",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    fields: [
      { name: "band_name", label: "Band Name", type: "text", required: true },
      { name: "line_of_business", label: "Line of Business", type: "text", required: true },
      { name: "product_type", label: "Product Type", type: "text" },
      { name: "age_group_start", label: "Age Group Start", type: "number" },
      { name: "age_group_end", label: "Age Group End", type: "number" },
      { name: "sum_insured_start", label: "Sum Insured Start", type: "number" },
      { name: "sum_insured_end", label: "Sum Insured End", type: "number" },
      { name: "base_premium", label: "Base Premium", type: "number" },
      { name: "premium_rate", label: "Premium Rate", type: "number" },
      { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "All"] },
      { name: "zone", label: "Zone", type: "text" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "business_categories",
    name: "Business Categories",
    table: "master_business_categories",
    icon: Building,
    description: "Commercial business categories and risk classifications",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    fields: [
      { name: "category_name", label: "Category Name", type: "text", required: true },
      { name: "category_code", label: "Category Code", type: "text" },
      { name: "industry_type", label: "Industry Type", type: "text" },
      { name: "risk_category", label: "Risk Category", type: "select", options: ["low", "medium", "high"] },
      { name: "hazard_class", label: "Hazard Class", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "relationship_types",
    name: "Relationship Types",
    table: "master_relationship_types",
    icon: Users,
    description: "Nominee and beneficiary relationship types",
    color: "bg-pink-50 text-pink-700 border-pink-200",
    fields: [
      { name: "relationship_name", label: "Relationship Name", type: "text", required: true },
      { name: "relationship_code", label: "Relationship Code", type: "text" },
      { name: "applicable_for", label: "Applicable For", type: "multiselect", options: ["nominee", "beneficiary", "insured"] },
      { name: "is_blood_relation", label: "Is Blood Relation", type: "checkbox" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "occupations",
    name: "Occupation Lists",
    table: "master_occupations",
    icon: Briefcase,
    description: "Occupations with risk classifications and loadings",
    color: "bg-teal-50 text-teal-700 border-teal-200",
    fields: [
      { name: "occupation_name", label: "Occupation Name", type: "text", required: true },
      { name: "occupation_code", label: "Occupation Code", type: "text" },
      { name: "occupation_category", label: "Occupation Category", type: "text" },
      { name: "risk_class", label: "Risk Class", type: "select", options: ["low", "medium", "high", "hazardous"] },
      { name: "loading_percentage", label: "Loading Percentage", type: "number" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "departments",
    name: "Departments",
    table: "departments",
    icon: Building,
    description: "Company departments and organizational units",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    fields: [
      { name: "name", label: "Department Name", type: "text", required: true },
      { name: "code", label: "Department Code", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  },
  {
    id: "uin_codes",
    name: "UIN/IRDAI Codes",
    table: "master_uin_codes",
    icon: FileText,
    description: "IRDAI UIN codes and product registrations",
    color: "bg-slate-50 text-slate-700 border-slate-200",
    fields: [
      { name: "uin_code", label: "UIN Code", type: "text", required: true },
      { name: "product_name", label: "Product Name", type: "text", required: true },
      { name: "insurer_name", label: "Insurer Name", type: "text", required: true },
      { name: "line_of_business", label: "Line of Business", type: "text", required: true },
      { name: "product_type", label: "Product Type", type: "text" },
      { name: "effective_date", label: "Effective Date", type: "date" },
      { name: "expiry_date", label: "Expiry Date", type: "date" },
      { name: "filing_date", label: "Filing Date", type: "date" },
      { name: "approval_date", label: "Approval Date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["active", "inactive", "withdrawn"] },
      { name: "is_active", label: "Active", type: "checkbox" }
    ]
  }
];

const MasterData = () => {
  const [activeTab, setActiveTab] = useState("vehicle_data");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Master Data Management</h2>
          <p className="text-muted-foreground">
            Centralized management of master data entities across all insurance modules
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          MDM Module
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 h-auto p-1 bg-muted">
          {masterDataEntities.map((entity) => {
            const IconComponent = entity.icon;
            return (
              <TabsTrigger
                key={entity.id}
                value={entity.id}
                className="flex flex-col items-center gap-2 p-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-xs font-medium leading-none">{entity.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {masterDataEntities.map((entity) => (
          <TabsContent key={entity.id} value={entity.id} className="space-y-6">
            <Card className={`border-l-4 ${entity.color}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <entity.icon className="h-6 w-6" />
                  <div>
                    <CardTitle>{entity.name}</CardTitle>
                    <CardDescription>{entity.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {entity.id === "vehicle_data" ? (
                  <EnhancedVehicleUpload />
                ) : entity.id === "cities" ? (
                  <>
                    <StorageBasedUpload 
                      entityType={entity.id}
                      tableName={entity.table}
                      fields={entity.fields}
                    />
                    <MasterDataUpload 
                      entityType={entity.id}
                      tableName={entity.table}
                      fields={entity.fields}
                    />
                    <MasterDataTable 
                      entityType={entity.id}
                      tableName={entity.table}
                      fields={entity.fields}
                      primaryKey="pincode_id"
                    />
                  </>
                ) : entity.id === "departments" ? (
                  <>
                    <MasterDataUpload 
                      entityType={entity.id}
                      tableName={entity.table}
                      fields={entity.fields}
                    />
                    <MasterDataTable 
                      entityType={entity.id}
                      tableName={entity.table}
                      fields={entity.fields}
                      primaryKey="department_id"
                    />
                  </>
                ) : entity.id === "uin_codes" ? (
                  <>
                    <UINCodeUpload />
                    <MasterDataTable 
                      entityType={entity.id}
                      tableName={entity.table}
                      fields={entity.fields}
                    />
                  </>
                 ) : (
                   <>
                     <MasterDataUpload 
                       entityType={entity.id}
                       tableName={entity.table}
                       fields={entity.fields}
                     />
                     <MasterDataTable 
                       entityType={entity.id}
                       tableName={entity.table}
                       fields={entity.fields}
                     />
                   </>
                 )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MasterData;