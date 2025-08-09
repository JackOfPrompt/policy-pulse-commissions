import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Core form components
import { CoreProductFields } from "./CoreProductFields";
import { HealthInsuranceFields } from "./HealthInsuranceFields";
import { MotorInsuranceFields } from "./MotorInsuranceFields";
import { LifeInsuranceFields } from "./LifeInsuranceFields";
import { TravelInsuranceFields } from "./TravelInsuranceFields";
import { LoanInsuranceFields } from "./LoanInsuranceFields";
import { ProviderSubNameTable } from "./ProviderSubNameTable";

// Base schema for core fields (removed provider_id from core schema)
const coreSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  line_of_business_id: z.string().min(1, "Line of business is required"),
  product_type: z.string().min(1, "Product type is required"),
  status: z.enum(["Active", "Inactive"]),
  code: z.string().optional(),
  uin: z.string().optional(),
  description: z.string().optional()
});

// Extended schemas for different LOBs
const healthSchema = coreSchema.extend({
  min_entry_age: z.number().min(0).max(100).optional(),
  max_entry_age: z.number().min(0).max(100).optional(),
  min_sum_insured: z.number().positive(),
  max_sum_insured: z.number().positive(),
  waiting_period_months: z.number().min(0).optional(),
  preexisting_disease_waiting_period: z.number().min(0).optional(),
  network_hospitals_count: z.number().min(0).optional(),
  room_rent_limit: z.string().optional(),
  maternity_cover: z.boolean().optional(),
  day_care_treatments: z.boolean().optional(),
  opd_benefit: z.boolean().optional()
});

const motorSchema = coreSchema.extend({
  fuel_type: z.enum(["Petrol", "Diesel", "Electric", "Hybrid"]).optional(),
  vehicle_category: z.enum(["Private", "Commercial"]).optional(),
  coverage_type: z.enum(["Third-Party", "OD Only", "Comprehensive"]).optional(),
  min_cubic_capacity: z.number().min(0).optional(),
  max_cubic_capacity: z.number().min(0).optional(),
  depreciation_cover: z.boolean().optional(),
  engine_protection: z.boolean().optional(),
  zero_depreciation: z.boolean().optional(),
  rti_cover: z.boolean().optional(),
  personal_accident_cover: z.boolean().optional()
});

const lifeSchema = coreSchema.extend({
  min_policy_term: z.number().min(1).optional(),
  max_policy_term: z.number().min(1).optional(),
  maturity_benefit: z.boolean().optional(),
  death_benefit_type: z.enum(["Fixed", "Increasing", "Decreasing"]).optional(),
  tax_saving_80c: z.boolean().optional()
});

const travelSchema = coreSchema.extend({
  max_duration_days: z.number().min(1).optional(),
  coverage_region: z.enum(["India", "Global", "Schengen", "Asia"]).optional(),
  baggage_loss_cover: z.boolean().optional(),
  trip_cancellation_cover: z.boolean().optional(),
  emergency_evacuation: z.boolean().optional()
});

const loanSchema = coreSchema.extend({
  loan_types: z.array(z.enum(["Personal", "Auto", "Home", "Business"])).optional(),
  min_tenure_months: z.number().min(1).optional(),
  max_tenure_months: z.number().min(1).optional(),
  critical_illness_rider: z.boolean().optional(),
  job_loss_cover: z.boolean().optional(),
  group_individual: z.enum(["Group", "Individual"]).optional()
});

// Product type mappings
export const PRODUCT_TYPES = {
  Health: ["Individual Health", "Family Floater", "Group Health", "Critical Illness", "Arogya Sanjeevani"],
  Motor: ["Two-Wheeler", "Private Car", "Commercial Vehicle", "Miscellaneous Vehicle"],
  Life: ["Term", "Endowment", "ULIP", "Money-back", "Annuity", "Whole Life"],
  Travel: ["Bharat Yatra Suraksha Plan A", "Bharat Yatra Suraksha Plan B", "Bharat Yatra Suraksha Plan C", "Bharat Yatra Suraksha Plan D", "Bharat Yatra Suraksha Plan E", "International Travel", "Student Travel"],
  Loan: ["Loan Protection", "Balance Protection", "Trade Credit", "Credit Life"],
  Pet: ["Individual Pet", "Family Pet", "Exotic Pet"],
  Commercial: ["Property", "Liability", "Marine", "Engineering"]
};

interface Provider {
  id: string;
  provider_name: string;
}

interface LineOfBusiness {
  id: string;
  name: string;
}

interface DynamicProductFormProps {
  product?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ProviderSubName {
  providerId: string;
  providerName: string;
  subName: string;
}

export const DynamicProductForm = ({ product, onSuccess, onCancel }: DynamicProductFormProps) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableLOBs, setAvailableLOBs] = useState<LineOfBusiness[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<ProviderSubName[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Determine which schema to use based on LOB
  const getSchemaForLOB = (lobName: string) => {
    switch (lobName) {
      case 'Health': return healthSchema;
      case 'Motor': return motorSchema;
      case 'Life': return lifeSchema;
      case 'Travel': return travelSchema;
      case 'Loan': return loanSchema;
      default: return coreSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(coreSchema),
    defaultValues: {
      name: product?.name || "",
      line_of_business_id: product?.line_of_business_id || "",
      product_type: product?.product_type || "",
      status: product?.status || "Active",
      code: product?.code || "",
      uin: product?.uin || "",
      description: product?.description || "",
      // Dynamic fields defaults
      min_entry_age: product?.min_entry_age || undefined,
      max_entry_age: product?.max_entry_age || undefined,
      min_sum_insured: product?.min_sum_insured || undefined,
      max_sum_insured: product?.max_sum_insured || undefined,
      waiting_period_months: product?.waiting_period_months || undefined,
      preexisting_disease_waiting_period: product?.preexisting_disease_waiting_period || undefined,
      network_hospitals_count: product?.network_hospitals_count || undefined,
      room_rent_limit: product?.room_rent_limit || "",
      maternity_cover: product?.maternity_cover || false,
      day_care_treatments: product?.day_care_treatments || false,
      opd_benefit: product?.opd_benefit || false,
      fuel_type: product?.fuel_type || undefined,
      vehicle_category: product?.vehicle_category || undefined,
      coverage_type: product?.coverage_type || undefined,
      min_cubic_capacity: product?.min_cubic_capacity || undefined,
      max_cubic_capacity: product?.max_cubic_capacity || undefined,
      depreciation_cover: product?.depreciation_cover || false,
      engine_protection: product?.engine_protection || false,
      zero_depreciation: product?.zero_depreciation || false,
      rti_cover: product?.rti_cover || false,
      personal_accident_cover: product?.personal_accident_cover || false,
      min_policy_term: product?.min_policy_term || undefined,
      max_policy_term: product?.max_policy_term || undefined,
      maturity_benefit: product?.maturity_benefit || false,
      death_benefit_type: product?.death_benefit_type || undefined,
      tax_saving_80c: product?.tax_saving_80c || false,
      max_duration_days: product?.max_duration_days || undefined,
      coverage_region: product?.coverage_region || undefined,
      baggage_loss_cover: product?.baggage_loss_cover || false,
      trip_cancellation_cover: product?.trip_cancellation_cover || false,
      emergency_evacuation: product?.emergency_evacuation || false,
      loan_types: product?.loan_types || [],
      min_tenure_months: product?.min_tenure_months || undefined,
      max_tenure_months: product?.max_tenure_months || undefined,
      critical_illness_rider: product?.critical_illness_rider || false,
      job_loss_cover: product?.job_loss_cover || false,
      group_individual: product?.group_individual || undefined
    }
  });

  const selectedLOBId = form.watch("line_of_business_id");
  const selectedProductType = form.watch("product_type");

  const selectedLOB = availableLOBs.find(lob => lob.id === selectedLOBId);
  const lobName = selectedLOB?.name;

  // Update form resolver when LOB changes
  useEffect(() => {
    if (lobName) {
      const newSchema = getSchemaForLOB(lobName);
      form.clearErrors();
    }
  }, [lobName, form]);

  useEffect(() => {
    fetchAllLOBs();
  }, []);

  useEffect(() => {
    if (selectedLOBId) {
      fetchProvidersForLOB(selectedLOBId);
      if (!product || product.line_of_business_id !== selectedLOBId) {
        form.setValue("product_type", "");
        setSelectedProviders([]);
      }
    } else {
      setProviders([]);
      setSelectedProviders([]);
    }
  }, [selectedLOBId, form, product]);

  const fetchAllLOBs = async () => {
    try {
      const { data, error } = await supabase
        .from('line_of_business')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setAvailableLOBs(data || []);
    } catch (error) {
      console.error('Error fetching LOBs:', error);
    }
  };

  const fetchProvidersForLOB = async (lobId: string) => {
    try {
      const { data, error } = await supabase
        .from('provider_line_of_business')
        .select(`
          insurance_provider_id,
          insurance_provider:insurance_provider_id (
            id,
            provider_name
          )
        `)
        .eq('line_of_business_id', lobId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const uniqueProviders = data
        ?.map((item: any) => item.insurance_provider)
        .filter((provider, index, self) => 
          provider && self.findIndex(p => p?.id === provider.id) === index
        ) || [];
      
      setProviders(uniqueProviders);
    } catch (error) {
      console.error('Error fetching providers for LOB:', error);
      setProviders([]);
    }
  };

  const onSubmit = async (data: any) => {
    if (selectedProviders.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one provider",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // For new products, create without provider_id in main table
      const productData = {
        name: data.name,
        line_of_business_id: data.line_of_business_id,
        product_type: data.product_type,
        code: data.code || null,
        uin: data.uin || null,
        category: lobName || null,
        status: data.status,
        description: data.description || null,
        // Dynamic fields based on LOB
        min_entry_age: data.min_entry_age || null,
        max_entry_age: data.max_entry_age || null,
        min_sum_insured: data.min_sum_insured || null,
        max_sum_insured: data.max_sum_insured || null,
        waiting_period_months: data.waiting_period_months || null,
        preexisting_disease_waiting_period: data.preexisting_disease_waiting_period || null,
        network_hospitals_count: data.network_hospitals_count || null,
        room_rent_limit: data.room_rent_limit || null,
        maternity_cover: data.maternity_cover || false,
        day_care_treatments: data.day_care_treatments || false,
        opd_benefit: data.opd_benefit || false,
        fuel_type: data.fuel_type || null,
        vehicle_category: data.vehicle_category || null,
        motor_coverage_type: data.coverage_type || null,
        min_cubic_capacity: data.min_cubic_capacity || null,
        max_cubic_capacity: data.max_cubic_capacity || null,
        depreciation_cover: data.depreciation_cover || false,
        engine_protection: data.engine_protection || false,
        zero_depreciation: data.zero_depreciation || false,
        rti_cover: data.rti_cover || false,
        personal_accident_cover: data.personal_accident_cover || false,
        min_policy_term: data.min_policy_term || null,
        max_policy_term: data.max_policy_term || null,
        maturity_benefit: data.maturity_benefit || false,
        death_benefit_type: data.death_benefit_type || null,
        tax_saving_80c: data.tax_saving_80c || false,
        max_duration_days: data.max_duration_days || null,
        coverage_region: data.coverage_region || null,
        baggage_loss_cover: data.baggage_loss_cover || false,
        trip_cancellation_cover: data.trip_cancellation_cover || false,
        emergency_evacuation: data.emergency_evacuation || false,
        loan_types: data.loan_types?.length ? data.loan_types : null,
        min_tenure_months: data.min_tenure_months || null,
        max_tenure_months: data.max_tenure_months || null,
        critical_illness_rider: data.critical_illness_rider || false,
        job_loss_cover: data.job_loss_cover || false,
        group_individual: data.group_individual || null,
        // Default values for backward compatibility
        premium_type: "Fixed",
        coverage_type: data.coverage_type || "Individual",
        // Use first provider as primary for backward compatibility
        provider_id: selectedProviders[0]?.providerId || null
      };

      let productId: string;

      if (product) {
        const { error } = await supabase
          .from('insurance_products')
          .update(productData)
          .eq('id', product.id);
        
        if (error) throw error;
        productId = product.id;
      } else {
        const { data: newProduct, error } = await supabase
          .from('insurance_products')
          .insert([productData])
          .select('id')
          .single();
        
        if (error) throw error;
        productId = newProduct.id;
      }

      // Insert/update provider relationships
      if (productId) {
        // Delete existing relationships if updating
        if (product) {
          await supabase
            .from('product_providers')
            .delete()
            .eq('product_id', productId);
        }

        // Insert new provider relationships
        const providerInserts = selectedProviders.map(provider => ({
          product_id: productId,
          provider_id: provider.providerId,
          sub_name: provider.subName || null
        }));

        const { error: providerError } = await supabase
          .from('product_providers')
          .insert(providerInserts);

        if (providerError) throw providerError;
      }

      toast({ title: product ? "Product updated successfully!" : "Product created successfully!" });
      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderDynamicFields = () => {
    if (!lobName || !selectedProductType) return null;

    switch (lobName) {
      case 'Health':
        return <HealthInsuranceFields form={form} productType={selectedProductType} />;
      case 'Motor':
        return <MotorInsuranceFields form={form} productType={selectedProductType} />;
      case 'Life':
        return <LifeInsuranceFields form={form} productType={selectedProductType} />;
      case 'Travel':
        return <TravelInsuranceFields form={form} productType={selectedProductType} />;
      case 'Loan':
        return <LoanInsuranceFields form={form} productType={selectedProductType} />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>
          {product ? "Edit Product" : "Add New Product"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Core Fields */}
            <CoreProductFields 
              form={form} 
              availableLOBs={availableLOBs}
              lobName={lobName}
            />

            {/* Provider Selection */}
            {selectedLOBId && (
              <ProviderSubNameTable
                providers={providers}
                selectedProviders={selectedProviders}
                onProvidersChange={setSelectedProviders}
              />
            )}

            {/* Dynamic Fields based on LOB + Product Type */}
            {renderDynamicFields()}

            <div className="flex gap-3 pt-6">
              <Button 
                type="submit" 
                disabled={submitting || !selectedLOBId || !selectedProductType || selectedProviders.length === 0} 
                className="flex-1"
              >
                {submitting ? "Saving..." : (product ? "Update Product" : "Create Product")}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};