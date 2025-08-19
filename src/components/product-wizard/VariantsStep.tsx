import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

interface VariantsStepProps {
  planTypes: PlanType[];
  onUpdate: (planTypes: PlanType[]) => void;
}

export const VariantsStep: React.FC<VariantsStepProps> = ({
  planTypes,
  onUpdate,
}) => {
  const [newVariants, setNewVariants] = useState<Record<string, Variant>>({});
  const [editingVariant, setEditingVariant] = useState<string | null>(null);

  const addVariant = (planTypeId: string) => {
    const newVariant = newVariants[planTypeId];
    if (!newVariant?.name.trim() || !newVariant?.code.trim()) return;

    const variant: Variant = {
      id: Date.now().toString(),
      ...newVariant,
      coverages: [],
    };

    const updated = planTypes.map(pt => {
      if (pt.id === planTypeId) {
        return {
          ...pt,
          variants: [...(pt.variants || []), variant],
        };
      }
      return pt;
    });

    onUpdate(updated);
    setNewVariants(prev => ({ ...prev, [planTypeId]: { name: '', code: '', active: true } }));
  };

  const updateVariant = (planTypeId: string, variantId: string, updates: Partial<Variant>) => {
    const updated = planTypes.map(pt => {
      if (pt.id === planTypeId) {
        return {
          ...pt,
          variants: pt.variants?.map(v => 
            v.id === variantId ? { ...v, ...updates } : v
          ),
        };
      }
      return pt;
    });
    onUpdate(updated);
  };

  const deleteVariant = (planTypeId: string, variantId: string) => {
    const updated = planTypes.map(pt => {
      if (pt.id === planTypeId) {
        return {
          ...pt,
          variants: pt.variants?.filter(v => v.id !== variantId),
        };
      }
      return pt;
    });
    onUpdate(updated);
  };

  const getNewVariant = (planTypeId: string): Variant => {
    return newVariants[planTypeId] || { name: '', code: '', active: true };
  };

  const updateNewVariant = (planTypeId: string, updates: Partial<Variant>) => {
    setNewVariants(prev => ({
      ...prev,
      [planTypeId]: { ...getNewVariant(planTypeId), ...updates },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variants</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add variants for each plan type (e.g., Silver, Gold, Platinum)
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {planTypes.map((planType) => (
            <AccordionItem key={planType.id} value={planType.id!}>
              <AccordionTrigger className="text-left">
                <div>
                  <span className="font-medium">{planType.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({planType.variants?.length || 0} variant(s))
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {/* Add New Variant */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h5 className="font-medium text-sm">Add Variant to {planType.name}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Variant Name *</Label>
                        <Input
                          value={getNewVariant(planType.id!).name}
                          onChange={(e) => updateNewVariant(planType.id!, { name: e.target.value })}
                          placeholder="e.g., Silver, Gold, Platinum"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Variant Code *</Label>
                        <Input
                          value={getNewVariant(planType.id!).code}
                          onChange={(e) => updateNewVariant(planType.id!, { code: e.target.value })}
                          placeholder="e.g., SLV, GLD, PLT"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={getNewVariant(planType.id!).description || ''}
                          onChange={(e) => updateNewVariant(planType.id!, { description: e.target.value })}
                          placeholder="Enter description"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={getNewVariant(planType.id!).active}
                          onCheckedChange={(checked) => updateNewVariant(planType.id!, { active: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                      <Button
                        onClick={() => addVariant(planType.id!)}
                        disabled={!getNewVariant(planType.id!).name.trim() || !getNewVariant(planType.id!).code.trim()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                      </Button>
                    </div>
                  </div>

                  {/* Existing Variants */}
                  {(planType.variants?.length || 0) > 0 && (
                    <div className="space-y-4">
                      <h5 className="font-medium text-sm">Existing Variants</h5>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Coverage Options</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {planType.variants?.map((variant) => (
                            <TableRow key={variant.id}>
                              <TableCell>
                                {editingVariant === variant.id ? (
                                  <Input
                                    value={variant.name}
                                    onChange={(e) => updateVariant(planType.id!, variant.id!, { name: e.target.value })}
                                  />
                                ) : (
                                  <span className="font-medium">{variant.name}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {editingVariant === variant.id ? (
                                  <Input
                                    value={variant.code}
                                    onChange={(e) => updateVariant(planType.id!, variant.id!, { code: e.target.value })}
                                  />
                                ) : (
                                  <span className="font-mono text-sm">{variant.code}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {editingVariant === variant.id ? (
                                  <Input
                                    value={variant.description || ''}
                                    onChange={(e) => updateVariant(planType.id!, variant.id!, { description: e.target.value })}
                                  />
                                ) : (
                                  <span className="text-muted-foreground">{variant.description || '-'}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={variant.active}
                                  onCheckedChange={(checked) => updateVariant(planType.id!, variant.id!, { active: checked })}
                                />
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {variant.coverages?.length || 0} option(s)
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {editingVariant === variant.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingVariant(null)}
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingVariant(null)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingVariant(variant.id || null)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteVariant(planType.id!, variant.id!)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
