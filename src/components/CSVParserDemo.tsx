import { useState } from "react";
import { usePolicyCSVParser } from "../hooks/usePolicyCSVParser";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FileText, Upload, AlertCircle, CheckCircle } from "lucide-react";

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

  const handleSingleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseFile(file);
    }
  };

  const handleMultipleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      parseMultipleFiles(Array.from(files));
    }
  };

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

          {(singleResult || multipleResults) && (
            <Button onClick={reset} variant="outline" size="sm">
              Clear Results
            </Button>
          )}
        </CardContent>
      </Card>

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
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Validation Errors:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {singleResult.invalidRows.slice(0, 5).map((invalid, index) => (
                    <div key={index} className="text-xs bg-red-50 p-2 rounded">
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
                    <h5 className="text-sm font-semibold">First Few Errors:</h5>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {result.invalidRows.slice(0, 3).map((invalid, errorIndex) => (
                        <div key={errorIndex} className="text-xs bg-red-50 p-2 rounded">
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
    </div>
  );
}