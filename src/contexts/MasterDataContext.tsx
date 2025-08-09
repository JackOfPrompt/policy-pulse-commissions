import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MasterDataItem {
  id: string;
  [key: string]: any;
}

interface MasterDataContextType {
  // Vehicle Data
  vehicleData: MasterDataItem[];
  getVehiclesByMake: (make: string) => MasterDataItem[];
  
  // Cities & Pincodes
  cities: MasterDataItem[];
  getCitiesByState: (state: string) => MasterDataItem[];
  getPincodesByCity: (city: string) => MasterDataItem[];
  
  // Add-ons & Riders
  addons: MasterDataItem[];
  getAddonsByLOB: (lob: string) => MasterDataItem[];
  
  // Health Conditions
  healthConditions: MasterDataItem[];
  
  // Benefits
  benefits: MasterDataItem[];
  getBenefitsByLOB: (lob: string) => MasterDataItem[];
  
  // Premium Bands
  premiumBands: MasterDataItem[];
  getPremiumBandsByLOB: (lob: string) => MasterDataItem[];
  
  // Business Categories
  businessCategories: MasterDataItem[];
  
  // Relationship Types
  relationshipTypes: MasterDataItem[];
  
  // Occupations
  occupations: MasterDataItem[];
  
  // UIN Codes
  uinCodes: MasterDataItem[];
  getUINByProvider: (providerName: string) => MasterDataItem[];
  
  // Loading states
  isLoading: boolean;
  refreshMasterData: () => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};

interface MasterDataProviderProps {
  children: ReactNode;
}

export const MasterDataProvider: React.FC<MasterDataProviderProps> = ({ children }) => {
  const [vehicleData, setVehicleData] = useState<MasterDataItem[]>([]);
  const [cities, setCities] = useState<MasterDataItem[]>([]);
  const [addons, setAddons] = useState<MasterDataItem[]>([]);
  const [healthConditions, setHealthConditions] = useState<MasterDataItem[]>([]);
  const [benefits, setBenefits] = useState<MasterDataItem[]>([]);
  const [premiumBands, setPremiumBands] = useState<MasterDataItem[]>([]);
  const [businessCategories, setBusinessCategories] = useState<MasterDataItem[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<MasterDataItem[]>([]);
  const [occupations, setOccupations] = useState<MasterDataItem[]>([]);
  const [uinCodes, setUinCodes] = useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMasterData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all master data in parallel
      const responses = await Promise.allSettled([
        supabase.from('master_vehicle_data' as any).select('*').eq('is_active', true),
        supabase.from('master_cities' as any).select('*').eq('is_active', true),
        supabase.from('master_addons' as any).select('*').eq('is_active', true),
        supabase.from('master_health_conditions' as any).select('*').eq('is_active', true),
        supabase.from('master_benefits' as any).select('*').eq('is_active', true),
        supabase.from('master_premium_bands' as any).select('*').eq('is_active', true),
        supabase.from('master_business_categories' as any).select('*').eq('is_active', true),
        supabase.from('master_relationship_types' as any).select('*').eq('is_active', true),
        supabase.from('master_occupations' as any).select('*').eq('is_active', true),
        supabase.from('master_uin_codes' as any).select('*').eq('is_active', true)
      ]);

      // Process results
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value.data && !response.value.error) {
          const data = response.value.data as unknown as MasterDataItem[];
          switch (index) {
            case 0:
              setVehicleData(data || []);
              break;
            case 1:
              setCities(data || []);
              break;
            case 2:
              setAddons(data || []);
              break;
            case 3:
              setHealthConditions(data || []);
              break;
            case 4:
              setBenefits(data || []);
              break;
            case 5:
              setPremiumBands(data || []);
              break;
            case 6:
              setBusinessCategories(data || []);
              break;
            case 7:
              setRelationshipTypes(data || []);
              break;
            case 8:
              setOccupations(data || []);
              break;
            case 9:
              setUinCodes(data || []);
              break;
          }
        } else if (response.status === 'rejected') {
          console.error(`Error fetching master data table ${index}:`, response.reason);
          // Set empty array for failed requests
          switch (index) {
            case 0: setVehicleData([]); break;
            case 1: setCities([]); break;
            case 2: setAddons([]); break;
            case 3: setHealthConditions([]); break;
            case 4: setBenefits([]); break;
            case 5: setPremiumBands([]); break;
            case 6: setBusinessCategories([]); break;
            case 7: setRelationshipTypes([]); break;
            case 8: setOccupations([]); break;
            case 9: setUinCodes([]); break;
          }
        }
      });
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Helper functions
  const getVehiclesByMake = (make: string) => {
    return vehicleData.filter(vehicle => 
      vehicle.make?.toLowerCase() === make.toLowerCase()
    );
  };

  const getCitiesByState = (state: string) => {
    return cities.filter(city => 
      city.state_name?.toLowerCase() === state.toLowerCase()
    );
  };

  const getPincodesByCity = (cityName: string) => {
    return cities.filter(city => 
      city.city_name?.toLowerCase() === cityName.toLowerCase()
    );
  };

  const getAddonsByLOB = (lob: string) => {
    return addons.filter(addon => 
      addon.line_of_business?.toLowerCase() === lob.toLowerCase()
    );
  };

  const getBenefitsByLOB = (lob: string) => {
    return benefits.filter(benefit => 
      benefit.line_of_business?.toLowerCase() === lob.toLowerCase()
    );
  };

  const getPremiumBandsByLOB = (lob: string) => {
    return premiumBands.filter(band => 
      band.line_of_business?.toLowerCase() === lob.toLowerCase()
    );
  };

  const getUINByProvider = (providerName: string) => {
    return uinCodes.filter(uin => 
      uin.insurer_name?.toLowerCase().includes(providerName.toLowerCase())
    );
  };

  const refreshMasterData = async () => {
    await fetchMasterData();
  };

  const contextValue: MasterDataContextType = {
    vehicleData,
    getVehiclesByMake,
    cities,
    getCitiesByState,
    getPincodesByCity,
    addons,
    getAddonsByLOB,
    healthConditions,
    benefits,
    getBenefitsByLOB,
    premiumBands,
    getPremiumBandsByLOB,
    businessCategories,
    relationshipTypes,
    occupations,
    uinCodes,
    getUINByProvider,
    isLoading,
    refreshMasterData
  };

  return (
    <MasterDataContext.Provider value={contextValue}>
      {children}
    </MasterDataContext.Provider>
  );
};