import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_TYPES } from "./DynamicProductForm";

interface LineOfBusiness {
  id: string;
  name: string;
}

interface CoreProductFieldsProps {
  form: UseFormReturn<any>;
  availableLOBs: LineOfBusiness[];
  lobName?: string;
}

export const CoreProductFields = ({ form, availableLOBs, lobName }: CoreProductFieldsProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">📋 Core Product Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name*</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="line_of_business_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Line of Business*</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  // Reset dependent fields when LOB changes
                  form.setValue("product_type", "");
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select line of business" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableLOBs.map((lob) => (
                    <SelectItem key={lob.id} value={lob.id}>
                      {lob.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="product_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Type*</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={!lobName}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !lobName 
                        ? "Select LOB first" 
                        : "Select product type"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lobName && PRODUCT_TYPES[lobName as keyof typeof PRODUCT_TYPES] ? (
                    PRODUCT_TYPES[lobName as keyof typeof PRODUCT_TYPES].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-types" disabled>
                      No product types available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter product code (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IRDAI UIN Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter UIN code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status*</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter product description..." 
                rows={3}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};