import { Building2, FolderOpen, Package, Tag, FileText, LayoutGrid, Clock, DollarSign, Calendar, MapPin, Car, Users, Heart, Factory, Plus, Building, Key, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
interface MDMEntity {
  id: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  description: string;
  route: string;
}
const mdmEntities: MDMEntity[] = [{
  id: 'insurance-providers',
  icon: Building2,
  label: 'Insurance Providers',
  description: 'Manage provider details, parent companies, IRDA license info',
  route: '/manage-insurance-providers'
}, {
  id: 'lines-of-business',
  icon: FolderOpen,
  label: 'Lines of Business',
  description: 'Define LOBs like Health, Motor, Life, Travel',
  route: '/admin/lines-of-business'
}, {
  id: 'products',
  icon: Package,
  label: 'Products',
  description: 'Map products to LOBs',
  route: '/admin/products'
}, {
  id: 'sub-products',
  icon: Tag,
  label: 'Sub Products',
  description: 'Define subcategories for products',
  route: '/admin/subproducts'
}, {
  id: 'policy-types',
  icon: FileText,
  label: 'Policy Types',
  description: 'New, Renewal, Rollover, Portability',
  route: '/admin/policy-types'
}, {
  id: 'plan-types',
  icon: LayoutGrid,
  label: 'Plan Types',
  description: 'Define available plan structures',
  route: '/admin/plan-types'
}, {
  id: 'premium-frequency',
  icon: Clock,
  label: 'Premium Frequency',
  description: 'Monthly, Quarterly, Yearly',
  route: '/admin/premium-frequency'
}, {
  id: 'premium-types',
  icon: DollarSign,
  label: 'Premium Types',
  description: 'Flat, Tiered, etc.',
  route: '/admin/premium-types'
}, {
  id: 'premium-terms',
  icon: Calendar,
  label: 'Premium Terms',
  description: 'Term durations and validity',
  route: '/admin/premium-terms'
}, {
  id: 'policy-tenure',
  icon: Calendar,
  label: 'Policy Tenure',
  description: 'Policy duration settings and terms',
  route: '/admin/policy-tenure'
}, {
  id: 'cities-pincodes',
  icon: MapPin,
  label: 'Master Locations',
  description: 'District, Division, Region, Block, State, Country, Pincode',
  route: '/admin/locations'
}, {
  id: 'vehicle-types',
  icon: Car,
  label: 'Vehicle Types',
  description: 'Private, Commercial, Miscellaneous categories',
  route: '/admin/vehicle-types'
}, {
  id: 'relationship-codes',
  icon: Users,
  label: 'Relationship Codes',
  description: 'Relation mappings (Self, Spouse, Child, etc.)',
  route: '/admin/relationship-codes'
}, {
  id: 'health-conditions',
  icon: Heart,
  label: 'Health Conditions',
  description: 'Pre-existing conditions list',
  route: '/admin/health-conditions'
}, {
  id: 'business-categories',
  icon: Factory,
  label: 'Business Categories',
  description: 'Industry categories',
  route: '/admin/business-categories'
}, {
  id: 'add-ons',
  icon: Plus,
  label: 'Add-ons',
  description: 'Additional coverages',
  route: '/admin/add-ons'
}, {
  id: 'departments',
  icon: Building,
  label: 'Departments',
  description: 'Organizational units',
  route: '/admin/departments'
}, {
  id: 'roles-permissions',
  icon: Key,
  label: 'Roles & Permissions',
  description: 'Access control management',
  route: '/admin/roles-permissions'
}, {
  id: 'occupations',
  icon: Briefcase,
  label: 'Occupations',
  description: 'Profession data management',
  route: '/admin/occupations'
}];
const MDMDashboard = () => {
  const navigate = useNavigate();
  const handleEntityClick = (route: string) => {
    navigate(route);
  };
  return <div className="min-h-screen bg-background">
      <div className="container-padding section-padding">
        {/* Header */}
        

        {/* Entity Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mdmEntities.map(entity => {
          const IconComponent = entity.icon;
          return <Card key={entity.id} className="cursor-pointer hover-lift transition-all duration-300 hover:shadow-lg group border-border/50" onClick={() => handleEntityClick(entity.route)}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm leading-tight">
                    {entity.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {entity.description}
                  </p>
                </CardContent>
              </Card>;
        })}
        </div>
      </div>
    </div>;
};
export default MDMDashboard;