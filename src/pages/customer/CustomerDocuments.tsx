import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DocumentUpload } from "@/components/customer/DocumentUpload";
import customerData from "@/data/customer/customerData.json";

export default function CustomerDocuments() {
  return (
    <DashboardLayout role="customer" user={customerData}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Documents</h1>
          <p className="text-muted-foreground">
            Upload and manage your insurance documents
          </p>
        </div>

        <DocumentUpload />
      </div>
    </DashboardLayout>
  );
}