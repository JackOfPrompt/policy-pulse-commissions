import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMasterData } from "@/contexts/MasterDataContext";

interface CityPincodeData {
  city_name: string;
  state_name: string;
  pincode: string;
  district?: string;
  region?: string;
  tier?: string;
}

interface CityPincodeSelectorProps {
  onCityChange?: (city: CityPincodeData | null) => void;
  onPincodeChange?: (pincode: string) => void;
  onStateChange?: (state: string) => void;
  selectedCity?: string;
  selectedPincode?: string;
  selectedState?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function CityPincodeSelector({
  onCityChange,
  onPincodeChange,
  onStateChange,
  selectedCity = "",
  selectedPincode = "",
  selectedState = "",
  className,
  disabled = false,
  required = false
}: CityPincodeSelectorProps) {
  const { cities, getCitiesByState, getPincodesByCity, isLoading } = useMasterData();
  const [open, setOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'state' | 'city' | 'pincode'>('state');
  
  // Get unique states, cities, and pincodes
  const uniqueStates = Array.from(new Set(cities.map(city => city.state_name).filter(Boolean))).sort();
  const citiesInState = selectedState ? getCitiesByState(selectedState) : [];
  const uniqueCitiesInState = Array.from(new Set(citiesInState.map(city => city.city_name).filter(Boolean))).sort();
  const pincodesInCity = selectedCity ? getPincodesByCity(selectedCity) : [];

  // Find current city data
  const currentCityData = cities.find(city => 
    city.city_name === selectedCity && 
    city.state_name === selectedState &&
    city.pincode === selectedPincode
  );

  const handleStateSelect = (state: string) => {
    onStateChange?.(state);
    onCityChange?.(null);
    onPincodeChange?.("");
  };

  const handleCitySelect = (cityName: string) => {
    const cityData = citiesInState.find(city => city.city_name === cityName);
    if (cityData) {
      onCityChange?.(cityData as unknown as CityPincodeData);
      // If only one pincode available, auto-select it
      const cityPincodes = getPincodesByCity(cityName);
      if (cityPincodes.length === 1) {
        onPincodeChange?.(cityPincodes[0].pincode);
      }
    }
  };

  const handlePincodeSelect = (pincode: string) => {
    onPincodeChange?.(pincode);
    // Update city data based on pincode
    const pincodeData = cities.find(city => city.pincode === pincode);
    if (pincodeData) {
      onCityChange?.(pincodeData as unknown as CityPincodeData);
      onStateChange?.(pincodeData.state_name);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-20 mb-2"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Location Selection</span>
        {currentCityData?.tier && (
          <Badge variant="outline" className="text-xs">
            {currentCityData.tier}
          </Badge>
        )}
      </div>

      {/* Search Mode Selector */}
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          size="sm"
          variant={searchMode === 'state' ? 'default' : 'outline'}
          onClick={() => setSearchMode('state')}
        >
          By State
        </Button>
        <Button
          type="button"
          size="sm"
          variant={searchMode === 'city' ? 'default' : 'outline'}
          onClick={() => setSearchMode('city')}
        >
          By City
        </Button>
        <Button
          type="button"
          size="sm"
          variant={searchMode === 'pincode' ? 'default' : 'outline'}
          onClick={() => setSearchMode('pincode')}
        >
          By Pincode
        </Button>
      </div>

      {searchMode === 'state' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="state">State {required && <span className="text-red-500">*</span>}</Label>
            <Select value={selectedState} onValueChange={handleStateSelect} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {uniqueStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedState && (
            <div>
              <Label htmlFor="city">City {required && <span className="text-red-500">*</span>}</Label>
              <Select value={selectedCity} onValueChange={handleCitySelect} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCitiesInState.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCity && pincodesInCity.length > 1 && (
            <div>
              <Label htmlFor="pincode">Pincode {required && <span className="text-red-500">*</span>}</Label>
              <Select value={selectedPincode} onValueChange={handlePincodeSelect} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pincode" />
                </SelectTrigger>
                <SelectContent>
                  {pincodesInCity.map((city) => (
                    <SelectItem key={city.pincode} value={city.pincode}>
                      {city.pincode} {city.district && `(${city.district})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {searchMode === 'city' && (
        <div>
          <Label htmlFor="city-search">Search City {required && <span className="text-red-500">*</span>}</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled}
              >
                {selectedCity || "Search city..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search city..." />
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandList className="max-h-60">
                  <CommandGroup>
                    {cities.map((city) => (
                      <CommandItem
                        key={`${city.city_name}-${city.state_name}-${city.pincode}`}
                        value={`${city.city_name} ${city.state_name} ${city.pincode}`}
                        onSelect={() => {
                          handleCitySelect(city.city_name);
                          handleStateSelect(city.state_name);
                          handlePincodeSelect(city.pincode);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCity === city.city_name && 
                            selectedState === city.state_name &&
                            selectedPincode === city.pincode
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div>
                          <div className="font-medium">{city.city_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {city.state_name} - {city.pincode}
                            {city.district && ` (${city.district})`}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {searchMode === 'pincode' && (
        <div>
          <Label htmlFor="pincode-input">Pincode {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="pincode-input"
            placeholder="Enter 6-digit pincode"
            value={selectedPincode}
            maxLength={6}
            onChange={(e) => {
              const pincode = e.target.value;
              onPincodeChange?.(pincode);
              
              // Auto-lookup city and state when pincode is complete
              if (pincode.length === 6) {
                const pincodeData = cities.find(city => city.pincode === pincode);
                if (pincodeData) {
                  onCityChange?.(pincodeData as unknown as CityPincodeData);
                  onStateChange?.(pincodeData.state_name);
                }
              }
            }}
            disabled={disabled}
          />
          {selectedPincode.length === 6 && currentCityData && (
            <div className="mt-2 p-2 bg-muted rounded-md text-sm">
              <div className="font-medium">{currentCityData.city_name}</div>
              <div className="text-muted-foreground">
                {currentCityData.state_name}
                {currentCityData.district && ` • ${currentCityData.district}`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Display current selection */}
      {currentCityData && (
        <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/20">
          <div className="text-sm font-medium text-primary">Selected Location:</div>
          <div className="text-sm">
            {currentCityData.city_name}, {currentCityData.state_name} - {currentCityData.pincode}
            {currentCityData.district && (
              <span className="text-muted-foreground"> • {currentCityData.district}</span>
            )}
            {currentCityData.region && (
              <span className="text-muted-foreground"> • {currentCityData.region}</span>
            )}
          </div>
        </div>
      )}

      {cities.length === 0 && !isLoading && (
        <div className="text-center py-4 text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No city data available</p>
          <p className="text-xs">Please upload city/pincode data first</p>
        </div>
      )}
    </div>
  );
}