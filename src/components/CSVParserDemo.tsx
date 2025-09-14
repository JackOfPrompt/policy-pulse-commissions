import { useState } from "react";
import { 
  usePolicyCSVParser, 
} from "../hooks/usePolicyCSVParser";
import { 
  exportInvalidRowsToCSV, 
  exportSingleFileInvalidRows 
} from "../lib/utils/csvPolicyParser";
import { InvalidRowsEditor } from "./InvalidRowsEditor";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Download,
  Edit,
  FileX
} from "lucide-react";

export function CSVParserDemo() {
  const { 
    parseFile, 
    parseMultipleFiles, 
    isLoading, 
    singleResult, 
    multipleResults, 
    error, 
    reset 
  } = usePolicyCSVParser();

  const [editingResult, setEditingResult] = useState<any>(null);
  const [fixedRows, setFixedRows] = useState<any[]>([]);

  const handleSingleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseFile(file);
      setEditingResult(null);
      setFixedRows([]);
    }
  };

  const handleMultipleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      parseMultipleFiles(Array.from(files));
      setEditingResult(null);
      setFixedRows([]);
    }
  };

  const handleDownloadInvalidRows = () => {
    if (singleResult && singleResult.invalidRows.length > 0) {
      exportSingleFileInvalidRows(singleResult);
    } else if (multipleResults) {
      exportInvalidRowsToCSV(multipleResults);
    }
  };

  const handleStartEditing = (result: any) => {
    setEditingResult(result);
  };

  const handleFixRows = (newFixedRows: any[]) => {
    setFixedRows(prev => [...prev, ...newFixedRows]);
  };

  const handleUpdateInvalidRows = (updatedInvalidRows: any[]) => {
    if (editingResult) {
      setEditingResult({
        ...editingResult,
        invalidRows: updatedInvalidRows
      });
    }
  };

  const totalInvalidRows = singleResult ? singleResult.invalidRows.length : 
    multipleResults ? multipleResults.reduce((sum, r) => sum + r.invalidRows.length, 0) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Policy Parser Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList>
              <TabsTrigger value="single">Single File</TabsTrigger>
              <TabsTrigger value="multiple">Multiple Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="single-file" className="text-sm font-medium">
                  Upload Single CSV File
                </label>
                <Input
                  id="single-file"
                  type="file"
                  accept=".csv"
                  onChange={handleSingleFileChange}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  File name should contain 'life', 'health', or 'motor' for auto-detection
                </p>
              </div>
            </TabsContent>

            <TabsContent value="multiple" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="multiple-files" className="text-sm font-medium">
                  Upload Multiple CSV Files
                </label>
                <Input
                  id="multiple-files"
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleMultipleFileChange}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Select multiple CSV files (life.csv, health.csv, motor.csv)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Upload className="h-4 w-4 animate-spin mr-2" />
              Parsing CSV files...
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(singleResult || multipleResults || fixedRows.length > 0) && (
            <div className="flex gap-2">
              <Button onClick={reset} variant="outline" size="sm">
                Clear Results
              </Button>
              {totalInvalidRows > 0 && (
                <Button 
                  onClick={handleDownloadInvalidRows} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Invalid Rows CSV
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fixed Rows Summary */}
      {fixedRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Fixed Rows ({fixedRows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {fixedRows.length} rows have been successfully fixed and are ready for database insertion.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Single File Results */}
      {singleResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Single File Results</span>
              <Badge variant="secondary">{singleResult.policyType}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Valid Rows: {singleResult.validRows.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Invalid Rows: {singleResult.invalidRows.length}</span>
              </div>
            </div>
            
            {singleResult.invalidRows.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                    <FileX className="h-4 w-4" />
                    Validation Errors ({singleResult.invalidRows.length})
                  </h4>
                  <Button
                    onClick={() => handleStartEditing(singleResult)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Fix Inline
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {singleResult.invalidRows.slice(0, 5).map((invalid, index) => (
                    <div key={index} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-500">
                      <strong>Row {invalid.rowIndex}:</strong> {invalid.errors.join(", ")}
                    </div>
                  ))}
                  {singleResult.invalidRows.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {singleResult.invalidRows.length - 5} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Multiple Files Results */}
      {multipleResults && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multiple Files Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{multipleResults.length}</div>
                  <div className="text-sm text-muted-foreground">Files Parsed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {multipleResults.reduce((sum, r) => sum + r.validRows.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Valid</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {multipleResults.reduce((sum, r) => sum + r.invalidRows.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Invalid</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {multipleResults.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{result.fileName}</span>
                  <Badge variant="secondary">{result.policyType}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Valid: {result.validRows.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Invalid: {result.invalidRows.length}</span>
                  </div>
                </div>

                {result.invalidRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h5 className="text-sm font-semibold text-red-600">First Few Errors:</h5>
                      <Button
                        onClick={() => handleStartEditing(result)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 h-7 px-2"
                      >
                        <Edit className="h-3 w-3" />
                        Fix
                      </Button>
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {result.invalidRows.slice(0, 3).map((invalid, errorIndex) => (
                        <div key={errorIndex} className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-500">
                          <strong>Row {invalid.rowIndex}:</strong> {invalid.errors[0]}
                        </div>
                      ))}
                      {result.invalidRows.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          ... and {result.invalidRows.length - 3} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inline Editor for Invalid Rows */}
      {editingResult && editingResult.invalidRows.length > 0 && (
        <InvalidRowsEditor
          policyType={editingResult.policyType}
          invalidRows={editingResult.invalidRows}
          onFix={handleFixRows}
          onUpdate={handleUpdateInvalidRows}
        />
      )}
    </div>
  );
}