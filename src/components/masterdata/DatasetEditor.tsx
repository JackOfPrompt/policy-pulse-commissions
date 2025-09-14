import { useState } from "react";
import { Plus, Edit2, Trash2, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface DataItem {
  id: string;
  label: string;
}

interface DatasetEditorProps {
  data: DataItem[];
  datasetName: string;
  onSave: (data: DataItem[]) => void;
}

export function DatasetEditor({ data, datasetName, onSave }: DatasetEditorProps) {
  const [editingData, setEditingData] = useState<DataItem[]>(data);
  const [editingItem, setEditingItem] = useState<DataItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ id: "", label: "" });

  const handleEdit = (item: DataItem) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = (index: number) => {
    if (editingItem) {
      const updated = [...editingData];
      updated[index] = editingItem;
      setEditingData(updated);
      setEditingItem(null);
    }
  };

  const handleDelete = (index: number) => {
    const updated = editingData.filter((_, i) => i !== index);
    setEditingData(updated);
  };

  const handleAdd = () => {
    if (!newItem.id || !newItem.label) {
      toast({
        title: "Invalid input",
        description: "Both ID and Label are required",
        variant: "destructive"
      });
      return;
    }

    if (editingData.some(item => item.id === newItem.id)) {
      toast({
        title: "Duplicate ID",
        description: "An item with this ID already exists",
        variant: "destructive"
      });
      return;
    }

    setEditingData([...editingData, newItem]);
    setNewItem({ id: "", label: "" });
    setIsAddModalOpen(false);
  };

  const handleSave = () => {
    onSave(editingData);
    toast({
      title: "Saved successfully",
      description: `${datasetName} has been updated`
    });
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(editingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${datasetName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{datasetName}</h2>
          <p className="text-muted-foreground">{editingData.length} records</p>
        </div>
        <div className="space-x-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-id">ID</Label>
                  <Input
                    id="new-id"
                    value={newItem.id}
                    onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                    placeholder="Enter unique ID"
                  />
                </div>
                <div>
                  <Label htmlFor="new-label">Label</Label>
                  <Input
                    id="new-label"
                    value={newItem.label}
                    onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                    placeholder="Enter display label"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editingData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editingItem && editingItem.id === item.id ? (
                    <Input
                      value={editingItem.id}
                      onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value })}
                      className="h-8"
                    />
                  ) : (
                    item.id
                  )}
                </TableCell>
                <TableCell>
                  {editingItem && editingItem.id === item.id ? (
                    <Input
                      value={editingItem.label}
                      onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                      className="h-8"
                    />
                  ) : (
                    item.label
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    {editingItem && editingItem.id === item.id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveEdit(index)}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}