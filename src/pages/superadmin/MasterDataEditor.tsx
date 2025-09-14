import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DatasetEditor } from "@/components/masterdata/DatasetEditor";
import users from "@/data/users.json";

interface DataItem {
  id: string;
  label: string;
}

interface Dataset {
  name: string;
  displayName: string;
  data: DataItem[];
  lastUpdated: string;
}

export default function MasterDataEditor() {
  const { datasetName } = useParams();
  const navigate = useNavigate();
  const user = users.superadmin;
  const [dataset, setDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    const savedDatasets = localStorage.getItem('masterDatasets');
    if (savedDatasets && datasetName) {
      const datasets: Dataset[] = JSON.parse(savedDatasets);
      const found = datasets.find(d => d.name === datasetName);
      if (found) {
        setDataset(found);
      } else {
        navigate('/superadmin/master-data');
      }
    }
  }, [datasetName, navigate]);

  const handleSave = (data: DataItem[]) => {
    if (!dataset) return;

    const savedDatasets = localStorage.getItem('masterDatasets');
    if (savedDatasets) {
      const datasets: Dataset[] = JSON.parse(savedDatasets);
      const updated = datasets.map(d => 
        d.name === dataset.name 
          ? { ...d, data, lastUpdated: new Date().toISOString() }
          : d
      );
      localStorage.setItem('masterDatasets', JSON.stringify(updated));
      setDataset({ ...dataset, data, lastUpdated: new Date().toISOString() });
    }
  };

  if (!dataset) {
    return (
      <DashboardLayout role="superadmin" user={user}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dataset...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="superadmin" user={user}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/superadmin/master-data')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Master Data
          </Button>
        </div>

        <DatasetEditor
          data={dataset.data}
          datasetName={dataset.displayName}
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
  );
}