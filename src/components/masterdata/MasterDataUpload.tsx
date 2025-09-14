import { useState } from "react";
import { Upload, X, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface MasterDataUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (fileName: string, data: any[]) => void;
}

export function MasterDataUpload({ open, onOpenChange, onUpload }: MasterDataUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [fileName, setFileName] = useState("");

  const validateJSON = (data: any): boolean => {
    if (!Array.isArray(data)) return false;
    return data.every(item => 
      item && typeof item === 'object' && 
      'id' in item && 'label' in item
    );
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!validateJSON(data)) {
          toast({
            title: "Invalid JSON format",
            description: "JSON must be an array with objects containing 'id' and 'label' fields",
            variant: "destructive"
          });
          return;
        }

        setPreview(data);
        setFileName(file.name);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Could not parse the uploaded file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleConfirm = () => {
    if (preview && fileName) {
      onUpload(fileName, preview);
      setPreview(null);
      setFileName("");
      onOpenChange(false);
      toast({
        title: "Upload successful",
        description: `${fileName} has been uploaded successfully`
      });
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setFileName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Master Data</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload JSON File</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your JSON file here, or click to browse
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
              </label>
            </Button>
            <div className="mt-4 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              JSON must contain an array with objects having 'id' and 'label' fields
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">({preview.length} records)</span>
            </div>

            <div className="max-h-64 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium">ID</th>
                    <th className="text-left p-2 font-medium">Label</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((item: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{item.id}</td>
                      <td className="p-2">{item.label}</td>
                    </tr>
                  ))}
                  {preview.length > 10 && (
                    <tr className="border-t">
                      <td colSpan={2} className="p-2 text-center text-muted-foreground">
                        ... and {preview.length - 10} more records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                Confirm Upload
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}