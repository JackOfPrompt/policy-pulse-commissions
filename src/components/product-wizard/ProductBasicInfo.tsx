import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Product {
  product_name: string;
  product_code: string;
  description?: string;
  lob_id: string;
  provider_id?: string;
  status: 'Active' | 'Inactive';
}

interface ProductBasicInfoProps {
  data: Product;
  onUpdate: (updates: Partial<Product>) => void;
  lobs: Array<{ lob_id: string; lob_name: string }>;
  providers: Array<{ provider_id: string; provider_name: string }>;
}

export const ProductBasicInfo: React.FC<ProductBasicInfoProps> = ({
  data,
  onUpdate,
  lobs,
  providers,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Product Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lob_id">Line of Business *</Label>
            <Select 
              value={data.lob_id} 
              onValueChange={(value) => onUpdate({ lob_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select LOB" />
              </SelectTrigger>
              <SelectContent>
                {lobs.map((lob) => (
                  <SelectItem key={lob.lob_id} value={lob.lob_id}>
                    {lob.lob_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider_id">Insurance Provider</Label>
            <Select 
              value={data.provider_id || ''} 
              onValueChange={(value) => onUpdate({ provider_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
               <SelectContent>
                 <SelectItem value="none">None</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.provider_id} value={provider.provider_id}>
                    {provider.provider_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name *</Label>
            <Input
              id="product_name"
              value={data.product_name}
              onChange={(e) => onUpdate({ product_name: e.target.value })}
              placeholder="Enter product name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_code">Product Code *</Label>
            <Input
              id="product_code"
              value={data.product_code}
              onChange={(e) => onUpdate({ product_code: e.target.value })}
              placeholder="Enter product code"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Enter product description"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="status"
            checked={data.status === 'Active'}
            onCheckedChange={(checked) => onUpdate({ status: checked ? 'Active' : 'Inactive' })}
          />
          <Label htmlFor="status">Active</Label>
        </div>
      </CardContent>
    </Card>
  );
};