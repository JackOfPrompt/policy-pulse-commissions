import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Package, ListOrdered } from "lucide-react";
import ProductsTab from "@/components/admin/ProductsTab";
import LineOfBusinessTab from "@/components/admin/LineOfBusinessTab";

const ProductManagement = () => {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="p-6 space-y-6">

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-transparent rounded-none">
                <TabsTrigger 
                  value="products" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none"
                >
                  <Package className="h-4 w-4" />
                  Products
                </TabsTrigger>
                <TabsTrigger 
                  value="lob" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none"
                >
                  <ListOrdered className="h-4 w-4" />
                  Lines of Business (LOBs)
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="products" className="mt-0 p-6">
              <ProductsTab />
            </TabsContent>
            
            <TabsContent value="lob" className="mt-0 p-6">
              <LineOfBusinessTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;