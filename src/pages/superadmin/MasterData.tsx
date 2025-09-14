import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Edit, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MasterDataUpload } from "@/components/masterdata/MasterDataUpload";
import { useNavigate } from "react-router-dom";
import users from "@/data/users.json";

// Import master data files
import gendersData from "@/data/master/genders.json";
import maritalStatusData from "@/data/master/marital_status.json";
import documentTypesData from "@/data/master/document_types.json";
import policyTypesData from "@/data/master/policy_types.json";
import relationsData from "@/data/master/relations.json";
import statesData from "@/data/master/states.json";
import fuelTypesData from "@/data/master/fuel_types.json";
import productTypesData from "@/data/master/product_types.json";
import departmentsData from "@/data/master/departments.json";

interface Dataset {
  name: string;
  displayName: string;
  data: any[];
  lastUpdated: string;
}

export default function MasterData() {
  const navigate = useNavigate();
  const user = users.superadmin;
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  useEffect(() => {
    // Initialize datasets from imported JSON files
    const initialDatasets: Dataset[] = [
      {
        name: "genders",
        displayName: "Genders",
        data: gendersData,
        lastUpdated: new Date().toISOString()
      },
      {
        name: "marital_status",
        displayName: "Marital Status",
        data: maritalStatusData,
        lastUpdated: new Date().toISOString()
      },
      {
        name: "document_types",
        displayName: "Document Types",
        data: documentTypesData,
        lastUpdated: new Date().toISOString()
      },
      {
        name: "policy_types",
        displayName: "Policy Types",
        data: policyTypesData,
        lastUpdated: new Date().toISOString()
      },
      {
        name: "relations",
        displayName: "Relations",
        data: relationsData,
        lastUpdated: new Date().toISOString()
      },
      {
        name: "states",
        displayName: "States",
        data: statesData,
        lastUpdated: new Date().toISOString()
      },
      {
        name: "fuel_types",
        displayName: "Fuel Types",
        data: fuelTypesData,
        lastUpdated: new Date().toISOString()
      },
      {
        name: "product_types",
        displayName: "Product Types",
        data: Object.entries(productTypesData).map(([id, config]) => ({ id, ...config })),
        lastUpdated: new Date().toISOString()
      },
      {
        name: "departments",
        displayName: "Departments",
        data: Object.entries(departmentsData).map(([id, config]) => ({ id, ...config })),
        lastUpdated: new Date().toISOString()
      }
    ];

    // Load from localStorage if available, otherwise use initial data
    const savedDatasets = localStorage.getItem('masterDatasets');
    if (savedDatasets) {
      setDatasets(JSON.parse(savedDatasets));
    } else {
      setDatasets(initialDatasets);
      localStorage.setItem('masterDatasets', JSON.stringify(initialDatasets));
    }
  }, []);

  const handleUpload = (fileName: string, data: any[]) => {
    const datasetName = fileName.replace('.json', '');
    const updated = datasets.map(dataset => 
      dataset.name === datasetName 
        ? { ...dataset, data, lastUpdated: new Date().toISOString() }
        : dataset
    );

    // If it's a new dataset, add it
    if (!datasets.find(d => d.name === datasetName)) {
      updated.push({
        name: datasetName,
        displayName: datasetName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        data,
        lastUpdated: new Date().toISOString()
      });
    }

    setDatasets(updated);
    localStorage.setItem('masterDatasets', JSON.stringify(updated));
  };

  const handleEditDataset = (datasetName: string) => {
    navigate(`/superadmin/master-data/${datasetName}`);
  };

  return (
    <DashboardLayout role="superadmin" user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Master Data Management</h1>
            <p className="text-muted-foreground">
              Manage system master data and configurations
            </p>
          </div>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Dataset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <Card key={dataset.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dataset.displayName}</CardTitle>
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>{dataset.name}.json</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Records</span>
                    <Badge variant="secondary">{dataset.data.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(dataset.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleEditDataset(dataset.name)}
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    View/Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <MasterDataUpload
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onUpload={handleUpload}
        />
      </div>
    </DashboardLayout>
  );
}