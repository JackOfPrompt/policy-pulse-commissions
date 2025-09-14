import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import policySchema from "@/data/policy_schema.json";

interface PolicyExtractorProps {
  onExtracted: (data: any) => void;
}

export function PolicyExtractor({ onExtracted }: PolicyExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Read file as text if it's a text file
      if (selectedFile.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setTextContent(text);
        };
        reader.readAsText(selectedFile);
      }
    }
  };

  const extractFromText = async (text: string) => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('extract-policy', {
        body: {
          fileText: text,
          schema: policySchema
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to extract policy data');
      }

      if (!data?.extracted) {
        throw new Error('No data returned from extraction');
      }

      // Save to localStorage for review
      localStorage.setItem('policyDraft', JSON.stringify(data.extracted));
      
      toast({
        title: "Extraction Complete",
        description: "Policy data has been extracted and is ready for review.",
      });

      onExtracted(data.extracted);
      
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error.message || "Failed to extract policy data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtract = async () => {
    if (!textContent && !file) {
      toast({
        title: "No Content",
        description: "Please provide text content or upload a file.",
        variant: "destructive",
      });
      return;
    }

    let contentToProcess = textContent;

    // Handle file upload to Supabase Storage and extraction
    if (file) {
      try {
        // Upload file to Supabase Storage first
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('policies')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Call edge function with file path
        const { data, error } = await supabase.functions.invoke('extract-policy', {
          body: {
            filePath: fileName
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Failed to extract policy data');
        }

        if (!data?.extracted) {
          throw new Error('No data returned from extraction');
        }

        // Save to localStorage for review
        localStorage.setItem('policyDraft', JSON.stringify(data.extracted));
        
        toast({
          title: "Extraction Complete",
          description: "Policy data has been extracted and is ready for review.",
        });

        onExtracted(data.extracted);
        
      } catch (error) {
        console.error('File processing error:', error);
        toast({
          title: "Processing Failed",
          description: error.message || "Failed to process file. Please try again.",
          variant: "destructive",
        });
      }
    } else if (contentToProcess) {
      await extractFromText(contentToProcess);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Policy Data Extractor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload Policy File</label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Or Paste Policy Text</label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste your insurance policy document text here..."
            rows={6}
            className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          onClick={handleExtract}
          disabled={isProcessing || (!textContent && !file)}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting Data...
            </>
          ) : (
            "Extract Policy Data"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}