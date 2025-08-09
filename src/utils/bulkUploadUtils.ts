import { supabase } from "@/integrations/supabase/client";

export interface BulkUploadError {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
}

export interface BulkUploadSession {
  id: string;
  entityType: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: BulkUploadError[];
  startTime: Date;
  endTime?: Date;
}

export class BulkUploadLogger {
  private sessionId: string;
  private entityType: string;
  private errors: BulkUploadError[] = [];

  constructor(entityType: string) {
    this.sessionId = crypto.randomUUID();
    this.entityType = entityType;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  clear(): void {
    this.errors = [];
  }

  logError(rowNumber: number, data: Record<string, any>, errors: string[]): void {
    const error: BulkUploadError = { rowNumber, data, errors };
    this.errors.push(error);
  }

  getErrorCount(): number {
    return this.errors.length;
  }

  async logValidationError(rowNumber: number, data: Record<string, any>, errors: string[]): Promise<void> {
    const error: BulkUploadError = { rowNumber, data, errors };
    this.errors.push(error);

    try {
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('upload_error_logs').insert({
        upload_session_id: this.sessionId,
        entity_type: this.entityType,
        row_number: rowNumber,
        row_data: data,
        errors: errors,
        uploaded_by: user.user?.id
      });
    } catch (error) {
      console.error('Failed to log validation error:', error);
    }
  }

  async logProcessingError(rowNumber: number, data: Record<string, any>, error: string): Promise<void> {
    const errorObj: BulkUploadError = { rowNumber, data, errors: [error] };
    this.errors.push(errorObj);

    try {
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('upload_error_logs').insert({
        upload_session_id: this.sessionId,
        entity_type: this.entityType,
        row_number: rowNumber,
        row_data: data,
        errors: [error],
        uploaded_by: user.user?.id
      });
    } catch (logError) {
      console.error('Failed to log processing error:', logError);
    }
  }

  getErrors(): BulkUploadError[] {
    return this.errors;
  }

  generateErrorReport(): string {
    if (this.errors.length === 0) return '';

    const headers = ['Row Number', 'Error Details', ...Object.keys(this.errors[0]?.data || {})];
    const rows = this.errors.map(error => [
      error.rowNumber.toString(),
      error.errors.join('; '),
      ...Object.values(error.data).map(v => String(v || ''))
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  downloadErrorReport(): void {
    const csvContent = this.generateErrorReport();
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.entityType.toLowerCase()}_errors_${new Date().toISOString().split('T')[0]}_${this.sessionId.slice(0, 8)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

export interface ProcessingProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentRow?: number;
  estimatedTimeRemaining?: number;
}

export class ProgressTracker {
  private startTime: Date;
  private onUpdate: (progress: ProcessingProgress) => void;
  private currentProgress: ProcessingProgress;
  
  constructor(onUpdate: (progress: ProcessingProgress) => void) {
    this.startTime = new Date();
    this.onUpdate = onUpdate;
    this.currentProgress = { total: 0, processed: 0, successful: 0, failed: 0 };
  }

  reset(total: number): void {
    this.startTime = new Date();
    this.currentProgress = { total, processed: 0, successful: 0, failed: 0 };
    this.onUpdate(this.currentProgress);
  }

  incrementSuccess(): void {
    this.currentProgress.processed++;
    this.currentProgress.successful++;
    this.updateProgress(this.currentProgress);
  }

  incrementFailed(): void {
    this.currentProgress.processed++;
    this.currentProgress.failed++;
    this.updateProgress(this.currentProgress);
  }

  getProgress(): number {
    return this.currentProgress.total > 0 
      ? Math.round((this.currentProgress.processed / this.currentProgress.total) * 100) 
      : 0;
  }

  updateProgress(progress: ProcessingProgress): void {
    const elapsed = Date.now() - this.startTime.getTime();
    const avgTimePerRow = elapsed / Math.max(progress.processed, 1);
    const remainingRows = progress.total - progress.processed;
    const estimatedTimeRemaining = Math.round((remainingRows * avgTimePerRow) / 1000);

    this.currentProgress = { ...progress, estimatedTimeRemaining };
    this.onUpdate(this.currentProgress);
  }
}

export const parseCSVContent = (csvContent: string): Record<string, any>[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Enhanced CSV parser that handles quoted fields properly
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }

  return data;
};

export const generateCSVTemplate = (columns: string[], sampleData: Record<string, any>[]): string => {
  const csvContent = [
    columns.join(','),
    ...sampleData.map(row => 
      columns.map(col => `"${(row[col] || '').toString().replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  return csvContent;
};

export const downloadCSVTemplate = (entityType: string, columns: string[], sampleData: Record<string, any>[]): void => {
  const csvContent = generateCSVTemplate(columns, sampleData);
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${entityType.toLowerCase()}_template.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const getErrorReportsBySession = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('upload_error_logs')
      .select('*')
      .eq('upload_session_id', sessionId)
      .order('row_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch error reports:', error);
    return [];
  }
};

export const getAllErrorReportsByEntity = async (entityType: string) => {
  try {
    const { data, error } = await supabase
      .from('upload_error_logs')
      .select('*')
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch error reports:', error);
    return [];
  }
};