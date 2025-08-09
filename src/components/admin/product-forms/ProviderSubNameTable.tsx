import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface Provider {
  id: string;
  provider_name: string;
}

interface ProviderSubName {
  providerId: string;
  providerName: string;
  subName: string;
}

interface ProviderSubNameTableProps {
  providers: Provider[];
  selectedProviders: ProviderSubName[];
  onProvidersChange: (providers: ProviderSubName[]) => void;
}

export const ProviderSubNameTable = ({ 
  providers, 
  selectedProviders, 
  onProvidersChange 
}: ProviderSubNameTableProps) => {
  const [availableProviders, setAvailableProviders] = useState<Provider[]>(
    providers.filter(p => !selectedProviders.find(sp => sp.providerId === p.id))
  );

  const addProvider = (provider: Provider) => {
    const newProvider: ProviderSubName = {
      providerId: provider.id,
      providerName: provider.provider_name,
      subName: ""
    };
    
    onProvidersChange([...selectedProviders, newProvider]);
    setAvailableProviders(prev => prev.filter(p => p.id !== provider.id));
  };

  const removeProvider = (providerId: string) => {
    const providerToRemove = selectedProviders.find(sp => sp.providerId === providerId);
    if (providerToRemove) {
      const providerData = providers.find(p => p.id === providerId);
      if (providerData) {
        setAvailableProviders(prev => [...prev, providerData]);
      }
    }
    
    onProvidersChange(selectedProviders.filter(sp => sp.providerId !== providerId));
  };

  const updateSubName = (providerId: string, subName: string) => {
    onProvidersChange(
      selectedProviders.map(sp => 
        sp.providerId === providerId 
          ? { ...sp, subName }
          : sp
      )
    );
  };

  // Update available providers when props change
  useEffect(() => {
    setAvailableProviders(
      providers.filter(p => !selectedProviders.find(sp => sp.providerId === p.id))
    );
  }, [providers, selectedProviders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insurance Providers & Sub-Names</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Provider Buttons */}
        {availableProviders.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Providers:</h4>
            <div className="flex flex-wrap gap-2">
              {availableProviders.map((provider) => (
                <Button
                  key={provider.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addProvider(provider)}
                >
                  + {provider.provider_name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Providers Table */}
        {selectedProviders.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Providers:</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider Name</TableHead>
                  <TableHead>Sub-Name (Optional)</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProviders.map((provider) => (
                  <TableRow key={provider.providerId}>
                    <TableCell className="font-medium">
                      {provider.providerName}
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="e.g., Bajaj DriveSecure OD"
                        value={provider.subName}
                        onChange={(e) => updateSubName(provider.providerId, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProvider(provider.providerId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedProviders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {availableProviders.length === 0 
              ? "No providers support this LOB yet" 
              : "Select providers from the buttons above"
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
};