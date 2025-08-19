import { Building2, FolderOpen, Package, Tag, FileText, LayoutGrid, Clock, DollarSign, Calendar, MapPin, Car, Users, Heart, Factory, Plus, Building, Key, Briefcase, Sparkles, Database, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
interface MDMEntity {
  id: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  description: string;
  route: string;
  priority?: 'high' | 'medium' | 'low';
  count?: number;
}
interface MDMCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  entities: MDMEntity[];
  color: 'primary' | 'secondary' | 'accent';
  gradient: string;
}
const mdmCategories: MDMCategory[] = [{
  id: 'core-masters',
  title: 'Core Masters',
  subtitle: 'Foundation Data',
  description: 'Essential master data that forms the foundation of your insurance ecosystem',
  icon: Database,
  color: 'secondary',
  gradient: 'from-secondary/20 via-secondary/10 to-primary/10',
  entities: [{
    id: 'insurance-providers',
    icon: Building2,
    label: 'Insurance Providers',
    description: 'Provider details, licenses, parent companies',
    route: '/manage-insurance-providers',
    priority: 'high',
    count: 45
  }, {
    id: 'lines-of-business',
    icon: FolderOpen,
    label: 'Lines of Business',
    description: 'Health, Motor, Life, Travel business lines',
    route: '/admin/lines-of-business',
    priority: 'high',
    count: 12
  }, {
    id: 'policy-types',
    icon: FileText,
    label: 'Policy Types',
    description: 'New, Renewal, Rollover, Portability types',
    route: '/admin/policy-types',
    priority: 'medium',
    count: 8
  }, {
    id: 'business-categories',
    icon: Factory,
    label: 'Business Categories',
    description: 'Industry and business classification',
    route: '/admin/business-categories',
    priority: 'medium',
    count: 25
  }, {
    id: 'master-locations',
    icon: MapPin,
    label: 'Master Locations',
    description: 'Geographic hierarchy and pincodes',
    route: '/admin/locations',
    priority: 'high',
    count: 650
  }]
}, {
  id: 'product-setup',
  title: 'Product Setup',
  subtitle: 'Product Configuration',
  description: 'Define products, variants, and classification structures',
  icon: Package,
  color: 'primary',
  gradient: 'from-primary/20 via-primary/10 to-secondary/10',
  entities: [{
    id: 'products',
    icon: Package,
    label: 'Products',
    description: 'Product catalog and LOB mapping',
    route: '/admin/products',
    priority: 'high',
    count: 120
  }, {
    id: 'sub-products',
    icon: Tag,
    label: 'Product Variants',
    description: 'Subcategories and product variations',
    route: '/admin/subproducts',
    priority: 'medium',
    count: 340
  }, {
    id: 'plan-types',
    icon: LayoutGrid,
    label: 'Plan Types',
    description: 'Basic, Enhanced, Elite plan structures',
    route: '/admin/plan-types',
    priority: 'medium',
    count: 18
  }, {
    id: 'vehicle-types',
    icon: Car,
    label: 'Vehicle Types',
    description: 'Motor-specific vehicle classifications',
    route: '/admin/vehicle-types',
    priority: 'low',
    count: 75
  }, {
    id: 'health-conditions',
    icon: Heart,
    label: 'Health Conditions',
    description: 'Pre-existing disease conditions list',
    route: '/admin/health-conditions',
    priority: 'medium',
    count: 200
  }, {
    id: 'relationship-codes',
    icon: Users,
    label: 'Relationship Codes',
    description: 'Family relationship mappings',
    route: '/admin/relationship-codes',
    priority: 'medium',
    count: 15
  }, {
    id: 'occupations',
    icon: Briefcase,
    label: 'Occupations',
    description: 'Professional occupation data',
    route: '/admin/occupations',
    priority: 'low',
    count: 450
  }]
}, {
  id: 'premium-config',
  title: 'Premium Configuration',
  subtitle: 'Pricing & Tenure',
  description: 'Configure premium structures, payment terms, and policy tenure',
  icon: DollarSign,
  color: 'accent',
  gradient: 'from-accent/15 via-secondary/5 to-primary/5',
  entities: [{
    id: 'premium-frequency',
    icon: Clock,
    label: 'Premium Frequency',
    description: 'Payment frequency options',
    route: '/admin/premium-frequency',
    priority: 'high',
    count: 5
  }, {
    id: 'premium-terms',
    icon: Calendar,
    label: 'Premium Terms',
    description: 'Duration and validity settings',
    route: '/admin/premium-terms',
    priority: 'medium',
    count: 12
  }, {
    id: 'policy-tenure',
    icon: Calendar,
    label: 'Policy Tenure',
    description: 'Policy duration and term options',
    route: '/admin/policy-tenure',
    priority: 'high',
    count: 8
  }]
}, {
  id: 'enhancements',
  title: 'Product Enhancements',
  subtitle: 'Add-ons & Coverage',
  description: 'Optional product enhancements and additional coverage options',
  icon: Sparkles,
  color: 'secondary',
  gradient: 'from-secondary/15 via-accent/10 to-primary/5',
  entities: [{
    id: 'add-ons',
    icon: Plus,
    label: 'Add-ons & Riders',
    description: 'Additional coverage enhancements',
    route: '/admin/add-ons',
    priority: 'medium',
    count: 85
  }]
}, {
  id: 'organization',
  title: 'Organization Setup',
  subtitle: 'Access Control',
  description: 'Internal organizational structure and access management',
  icon: Building,
  color: 'primary',
  gradient: 'from-primary/15 via-secondary/5 to-accent/5',
  entities: [{
    id: 'departments',
    icon: Building,
    label: 'Departments',
    description: 'Organizational department structure',
    route: '/admin/departments',
    priority: 'low',
    count: 20
  }, {
    id: 'roles-permissions',
    icon: Key,
    label: 'Roles & Permissions',
    description: 'User access control and permissions',
    route: '/admin/roles-permissions',
    priority: 'high',
    count: 12
  }]
}];
const getPriorityBadge = (priority?: string) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive" className="text-xs">Critical</Badge>;
    case 'medium':
      return <Badge variant="secondary" className="text-xs">Important</Badge>;
    case 'low':
      return <Badge variant="outline" className="text-xs">Optional</Badge>;
    default:
      return null;
  }
};
const getColorClasses = (color: string) => {
  switch (color) {
    case 'secondary':
      return {
        text: 'text-secondary',
        bg: 'bg-secondary/10',
        border: 'border-secondary/20',
        hover: 'hover:border-secondary/40'
      };
    case 'primary':
      return {
        text: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        hover: 'hover:border-primary/40'
      };
    case 'accent':
      return {
        text: 'text-accent',
        bg: 'bg-accent/10',
        border: 'border-accent/20',
        hover: 'hover:border-accent/40'
      };
    default:
      return {
        text: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        hover: 'hover:border-primary/40'
      };
  }
};
const MDMDashboard = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('core-masters');
  const handleEntityClick = (route: string) => {
    navigate(route);
  };
  const selectedCategoryData = mdmCategories.find(cat => cat.id === selectedCategory);
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="p-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            
            
          </motion.div>
        </div>

        {/* Category Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {mdmCategories.map((category, index) => {
          const colors = getColorClasses(category.color);
          const isSelected = selectedCategory === category.id;
          return <motion.div key={category.id} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.4,
            delay: index * 0.1
          }}>
                <Button variant={isSelected ? "default" : "outline"} onClick={() => setSelectedCategory(category.id)} className={`h-auto p-4 ${isSelected ? `bg-gradient-to-r from-${category.color} to-primary text-white` : `${colors.border} ${colors.hover} hover:scale-105`} transition-all duration-300`}>
                  <div className="flex items-center gap-3">
                    <category.icon className={`w-5 h-5 ${isSelected ? 'text-white' : colors.text}`} />
                    <div className="text-left">
                      <div className="font-semibold">{category.title}</div>
                      <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {category.subtitle}
                      </div>
                    </div>
                  </div>
                </Button>
              </motion.div>;
        })}
        </div>

        {/* Selected Category Content */}
        <AnimatePresence mode="wait">
          {selectedCategoryData && <motion.div key={selectedCategory} initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.4
        }}>
              <Card className={`mb-8 bg-gradient-to-br ${selectedCategoryData.gradient} border-none shadow-lg`}>
                
              </Card>

              {/* Entities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {selectedCategoryData.entities.map((entity, index) => {
              const EntityIcon = entity.icon;
              const colors = getColorClasses(selectedCategoryData.color);
              return <motion.div key={entity.id} initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.4,
                delay: index * 0.1
              }}>
                      <Card className={`cursor-pointer group hover:shadow-xl transition-all duration-300 hover:scale-105 ${colors.border} ${colors.hover} bg-card/80 backdrop-blur-sm`} onClick={() => handleEntityClick(entity.route)}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-full ${colors.bg} group-hover:scale-110 transition-transform duration-300`}>
                              <EntityIcon className={`w-6 h-6 ${colors.text}`} />
                            </div>
                            <div className="flex flex-col gap-2">
                              {getPriorityBadge(entity.priority)}
                              {entity.count && <Badge variant="outline" className="text-xs">
                                  {entity.count} items
                                </Badge>}
                            </div>
                          </div>
                          
                          <h3 className="text-foreground mb-2 group-hover:text-primary transition-colors font-normal">
                            {entity.label}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {entity.description}
                          </p>
                          
                          <div className="flex items-center justify-end">
                            <ArrowRight className={`w-4 h-4 ${colors.text} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>;
            })}
              </div>
            </motion.div>}
        </AnimatePresence>
      </div>
    </div>;
};
export default MDMDashboard;