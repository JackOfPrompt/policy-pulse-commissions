import { useState } from "react";
import { 
  LifePolicyBulkSchema,
  HealthPolicyBulkSchema,
  MotorPolicyBulkSchema,
} from "../lib/schemas/policySchemas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./ui/table";
import { CheckCircle, AlertTriangle, Edit } from "lucide-react";
import { toast } from "sonner";

type InvalidRow = {
  row: any;
  errors: string[];
  rowIndex: number;
};

type InvalidRowsEditorProps = {
  policyType: "life" | "health" | "motor";
  invalidRows: InvalidRow[];
  onFix: (fixedRows: any[]) => void;
  onUpdate: (updatedInvalidRows: InvalidRow[]) => void;
};

function getSchema(type: "life" | "health" | "motor") {
  switch (type) {
    case "life":
      return LifePolicyBulkSchema;
    case "health":
      return HealthPolicyBulkSchema;
    case "motor":
      return MotorPolicyBulkSchema;
  }
}

export function InvalidRowsEditor({ 
  policyType, 
  invalidRows, 
  onFix, 
  onUpdate 
}: InvalidRowsEditorProps) {
  const [rows, setRows] = useState(invalidRows);
  const [isValidating, setIsValidating] = useState(false);

  const schema = getSchema(policyType);

  const handleChange = (rowIdx: number, field: string, value: string) => {
    const updated = [...rows];
    updated[rowIdx].row[field] = value;
    setRows(updated);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    
    try {
      const fixed: any[] = [];
      const stillInvalid: InvalidRow[] = [];

      rows.forEach((r) => {
        const parsed = schema.safeParse(r.row);
        if (parsed.success) {
          fixed.push(parsed.data);
        } else {
          stillInvalid.push({
            ...r,
            errors: parsed.error.errors.map(
              (err) => `${err.path.join(".")}: ${err.message}`
            ),
          });
        }
      });

      setRows(stillInvalid);
      onUpdate(stillInvalid);
      
      if (fixed.length > 0) {
        onFix(fixed);
        toast.success(`Fixed ${fixed.length} rows successfully!`);
      }
      
      if (stillInvalid.length === 0) {
        toast.success("All rows are now valid! 🎉");
      } else {
        toast.warning(`${stillInvalid.length} rows still have errors`);
      }
    } catch (error) {
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8 text-green-600">
            <CheckCircle className="h-8 w-8 mr-2" />
            <span className="text-lg font-medium">All rows are valid! 🎉</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const headers = rows.length > 0 ? Object.keys(rows[0].row) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Fix Invalid Rows
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">{rows.length} errors</Badge>
            <Badge variant="secondary">{policyType}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Edit the fields below to fix validation errors. Invalid cells are highlighted.
          </AlertDescription>
        </Alert>

        <div className="overflow-x-auto max-h-96 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row #</TableHead>
                {headers.map((header) => (
                  <TableHead key={header} className="min-w-32">
                    {header}
                  </TableHead>
                ))}
                <TableHead className="min-w-64">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, rowIdx) => (
                <TableRow key={rowIdx} className="bg-red-50 hover:bg-red-100">
                  <TableCell className="font-medium text-red-600">
                    {r.rowIndex}
                  </TableCell>
                  {headers.map((header) => {
                    const hasError = r.errors.some(error => 
                      error.toLowerCase().includes(header.toLowerCase())
                    );
                    return (
                      <TableCell key={header}>
                        <Input
                          value={r.row[header] || ""}
                          onChange={(e) => handleChange(rowIdx, header, e.target.value)}
                          className={`h-8 text-sm ${
                            hasError 
                              ? "border-red-500 bg-red-50" 
                              : "border-gray-300"
                          }`}
                          placeholder={`Enter ${header}`}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <div className="text-xs text-red-600 space-y-1 max-w-64">
                      {r.errors.map((error, errorIdx) => (
                        <div key={errorIdx} className="bg-red-100 p-1 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            Make your changes above, then click Re-Validate to check for fixes
          </div>
          <Button 
            onClick={handleValidate} 
            disabled={isValidating}
            className="min-w-32"
          >
            {isValidating ? "Validating..." : "Re-Validate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}