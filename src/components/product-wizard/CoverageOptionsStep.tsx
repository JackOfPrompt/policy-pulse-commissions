import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

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

interface CoverageOptionsStepProps {
  planTypes: PlanType[];
  onUpdate: (planTypes: PlanType[]) => void;
}

const sumInsuredOptions = [
  { value: 300000, label: '3 Lakh' },
  { value: 500000, label: '5 Lakh' },
  { value: 1000000, label: '10 Lakh' },
  { value: 1500000, label: '15 Lakh' },
  { value: 2000000, label: '20 Lakh' },
  { value: 2500000, label: '25 Lakh' },
  { value: 5000000, label: '50 Lakh' },
  { value: 10000000, label: '1 Crore' },
];

const termOptions = [
  { value: 1, label: '1 Year' },
  { value: 2, label: '2 Years' },
  { value: 3, label: '3 Years' },
  { value: 5, label: '5 Years' },
  { value: 10, label: '10 Years' },
  { value: 15, label: '15 Years' },
  { value: 20, label: '20 Years' },
];

export const CoverageOptionsStep: React.FC<CoverageOptionsStepProps> = ({
  planTypes,
  onUpdate,
}) => {
  const [newCoverages, setNewCoverages] = useState<Record<string, Coverage>>({});
  const [editingCoverage, setEditingCoverage] = useState<string | null>(null);

  const addCoverage = (planTypeId: string, variantId: string) => {
    const key = `${planTypeId}-${variantId}`;
    const newCoverage = newCoverages[key];
    
    if (!newCoverage?.sum_insured || !newCoverage?.policy_term || !newCoverage?.premium_payment_term) return;

    const coverage: Coverage = {
      id: Date.now().toString(),
      ...newCoverage,
    };

    const updated = planTypes.map(pt => {
      if (pt.id === planTypeId) {
        return {
          ...pt,
          variants: pt.variants?.map(v => {
            if (v.id === variantId) {
              return {
                ...v,
                coverages: [...(v.coverages || []), coverage],
              };
            }
            return v;
          }),
        };
      }
      return pt;
    });

    onUpdate(updated);
    setNewCoverages(prev => ({ 
      ...prev, 
      [key]: { 
        sum_insured: 0, 
        policy_term: 1, 
        premium_payment_term: 1, 
        premium_min: 0, 
        premium_max: 0 
      } 
    }));
  };

  const updateCoverage = (planTypeId: string, variantId: string, coverageId: string, updates: Partial<Coverage>) => {
    const updated = planTypes.map(pt => {
      if (pt.id === planTypeId) {
        return {
          ...pt,
          variants: pt.variants?.map(v => {
            if (v.id === variantId) {
              return {
                ...v,
                coverages: v.coverages?.map(c => 
                  c.id === coverageId ? { ...c, ...updates } : c
                ),
              };
            }
            return v;
          }),
        };
      }
      return pt;
    });
    onUpdate(updated);
  };

  const deleteCoverage = (planTypeId: string, variantId: string, coverageId: string) => {
    const updated = planTypes.map(pt => {
      if (pt.id === planTypeId) {
        return {
          ...pt,
          variants: pt.variants?.map(v => {
            if (v.id === variantId) {
              return {
                ...v,
                coverages: v.coverages?.filter(c => c.id !== coverageId),
              };
            }
            return v;
          }),
        };
      }
      return pt;
    });
    onUpdate(updated);
  };

  const getNewCoverage = (planTypeId: string, variantId: string): Coverage => {
    const key = `${planTypeId}-${variantId}`;
    return newCoverages[key] || { 
      sum_insured: 0, 
      policy_term: 1, 
      premium_payment_term: 1, 
      premium_min: 0, 
      premium_max: 0 
    };
  };

  const updateNewCoverage = (planTypeId: string, variantId: string, updates: Partial<Coverage>) => {
    const key = `${planTypeId}-${variantId}`;
    setNewCoverages(prev => ({
      ...prev,
      [key]: { ...getNewCoverage(planTypeId, variantId), ...updates },
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coverage Options</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define coverage options for each variant including sum insured, policy terms, and premium ranges
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {planTypes.map((planType) => (
            <AccordionItem key={planType.id} value={planType.id!}>
              <AccordionTrigger className="text-left">
                <span className="font-medium">{planType.name}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {planType.variants?.map((variant) => (
                    <Card key={variant.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{variant.name} ({variant.code})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Add New Coverage */}
                        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                          <h6 className="font-medium text-sm">Add Coverage Option</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Sum Insured *</Label>
                              <Select
                                value={getNewCoverage(planType.id!, variant.id!).sum_insured.toString()}
                                onValueChange={(value) => updateNewCoverage(planType.id!, variant.id!, { sum_insured: Number(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sum insured" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sumInsuredOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Policy Term *</Label>
                              <Select
                                value={getNewCoverage(planType.id!, variant.id!).policy_term.toString()}
                                onValueChange={(value) => updateNewCoverage(planType.id!, variant.id!, { policy_term: Number(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select policy term" />
                                </SelectTrigger>
                                <SelectContent>
                                  {termOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Premium Payment Term *</Label>
                              <Select
                                value={getNewCoverage(planType.id!, variant.id!).premium_payment_term.toString()}
                                onValueChange={(value) => updateNewCoverage(planType.id!, variant.id!, { premium_payment_term: Number(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select PPT" />
                                </SelectTrigger>
                                <SelectContent>
                                  {termOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value.toString()}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Min Premium (₹) *</Label>
                              <Input
                                type="number"
                                value={getNewCoverage(planType.id!, variant.id!).premium_min}
                                onChange={(e) => updateNewCoverage(planType.id!, variant.id!, { premium_min: Number(e.target.value) })}
                                placeholder="Minimum premium"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Premium (₹) *</Label>
                              <Input
                                type="number"
                                value={getNewCoverage(planType.id!, variant.id!).premium_max}
                                onChange={(e) => updateNewCoverage(planType.id!, variant.id!, { premium_max: Number(e.target.value) })}
                                placeholder="Maximum premium"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                onClick={() => addCoverage(planType.id!, variant.id!)}
                                disabled={!getNewCoverage(planType.id!, variant.id!).sum_insured}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Coverage
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Existing Coverages */}
                        {(variant.coverages?.length || 0) > 0 && (
                          <div className="space-y-4">
                            <h6 className="font-medium text-sm">Coverage Options</h6>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Sum Insured</TableHead>
                                  <TableHead>Policy Term</TableHead>
                                  <TableHead>PPT</TableHead>
                                  <TableHead>Premium Range</TableHead>
                                  <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {variant.coverages?.map((coverage) => (
                                  <TableRow key={coverage.id}>
                                    <TableCell>
                                      {formatCurrency(coverage.sum_insured)}
                                    </TableCell>
                                    <TableCell>
                                      {coverage.policy_term} Year{coverage.policy_term > 1 ? 's' : ''}
                                    </TableCell>
                                    <TableCell>
                                      {coverage.premium_payment_term} Year{coverage.premium_payment_term > 1 ? 's' : ''}
                                    </TableCell>
                                    <TableCell>
                                      {formatCurrency(coverage.premium_min)} - {formatCurrency(coverage.premium_max)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteCoverage(planType.id!, variant.id!, coverage.id!)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
