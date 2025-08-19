import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface PlanTypesStepProps {
  planTypes: PlanType[];
  onUpdate: (planTypes: PlanType[]) => void;
}

export const PlanTypesStep: React.FC<PlanTypesStepProps> = ({
  planTypes,
  onUpdate,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlanType, setNewPlanType] = useState<PlanType>({
    name: '',
    description: '',
    active: true,
  });

  const addPlanType = () => {
    if (!newPlanType.name.trim()) return;

    const planType: PlanType = {
      id: Date.now().toString(),
      ...newPlanType,
      variants: [],
    };

    onUpdate([...planTypes, planType]);
    setNewPlanType({ name: '', description: '', active: true });
  };

  const updatePlanType = (id: string, updates: Partial<PlanType>) => {
    const updated = planTypes.map(pt =>
      pt.id === id ? { ...pt, ...updates } : pt
    );
    onUpdate(updated);
    setEditingId(null);
  };

  const deletePlanType = (id: string) => {
    onUpdate(planTypes.filter(pt => pt.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Types Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define different plan categories for your product (e.g., Individual, Family Floater, Endowment, ULIP)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Plan Type */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Add New Plan Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Plan Type Name *</Label>
              <Input
                value={newPlanType.name}
                onChange={(e) => setNewPlanType({ ...newPlanType, name: e.target.value })}
                placeholder="e.g., Family Floater, Individual"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newPlanType.description || ''}
                onChange={(e) => setNewPlanType({ ...newPlanType, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={newPlanType.active}
                onCheckedChange={(checked) => setNewPlanType({ ...newPlanType, active: checked })}
              />
              <Label>Active</Label>
            </div>
            <Button onClick={addPlanType} disabled={!newPlanType.name.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan Type
            </Button>
          </div>
        </div>

        {/* Existing Plan Types */}
        {planTypes.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Existing Plan Types</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planTypes.map((planType) => (
                  <TableRow key={planType.id}>
                    <TableCell>
                      {editingId === planType.id ? (
                        <Input
                          value={planType.name}
                          onChange={(e) => {
                            const updated = planTypes.map(pt =>
                              pt.id === planType.id ? { ...pt, name: e.target.value } : pt
                            );
                            onUpdate(updated);
                          }}
                        />
                      ) : (
                        <span className="font-medium">{planType.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === planType.id ? (
                        <Input
                          value={planType.description || ''}
                          onChange={(e) => {
                            const updated = planTypes.map(pt =>
                              pt.id === planType.id ? { ...pt, description: e.target.value } : pt
                            );
                            onUpdate(updated);
                          }}
                        />
                      ) : (
                        <span className="text-muted-foreground">{planType.description || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={planType.active}
                        onCheckedChange={(checked) => {
                          const updated = planTypes.map(pt =>
                            pt.id === planType.id ? { ...pt, active: checked } : pt
                          );
                          onUpdate(updated);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {planType.variants?.length || 0} variant(s)
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingId === planType.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(planType.id || null)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePlanType(planType.id!)}
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
      </CardContent>
    </Card>
  );
};
