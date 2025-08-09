import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  accept?: string;
  maxSize?: number;
  bucketName: string;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = "Upload Image",
  accept = ".png,.jpg,.jpeg,.svg",
  maxSize = 2 * 1024 * 1024, // 2MB
  bucketName,
  folder = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || '');
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = accept.split(',').map(ext => ext.replace('.', '').trim());
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: `Only ${accept} files are allowed`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      setPreview(urlData.publicUrl);
      onChange(data.path);
      
      toast({
        title: "Upload successful",
        description: "Image uploaded successfully"
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [accept, maxSize, bucketName, folder, onChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': accept.split(',')
    },
    multiple: false,
    maxSize
  });

  const handleRemove = async () => {
    if (value) {
      try {
        await supabase.storage
          .from(bucketName)
          .remove([value]);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    setPreview('');
    onChange('');
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {preview ? (
        <div className="relative inline-block">
          <img
            src={getImageUrl(preview)}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-border"
          />
          <div className="absolute -top-2 -right-2 flex gap-1">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreview('')}
            >
              Change Image
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Upload className="h-8 w-8 text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-foreground">
                  {isDragActive
                    ? "Drop the image here"
                    : "Drag & drop an image here, or click to select"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: {accept} • Max size: {maxSize / (1024 * 1024)}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};