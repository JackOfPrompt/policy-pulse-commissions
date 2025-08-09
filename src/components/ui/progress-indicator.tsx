import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Upload, Clock } from "lucide-react";

interface ProgressIndicatorProps {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentRow?: number;
  estimatedTimeRemaining?: number;
  isProcessing: boolean;
  stage: 'validation' | 'processing' | 'completed';
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  total,
  processed,
  successful,
  failed,
  currentRow,
  estimatedTimeRemaining,
  isProcessing,
  stage
}) => {
  const progressPercentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStageTitle = () => {
    switch (stage) {
      case 'validation':
        return 'Validating Data';
      case 'processing':
        return 'Processing Records';
      case 'completed':
        return 'Process Complete';
      default:
        return 'Processing';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {isProcessing && <Upload className="h-5 w-5 animate-pulse text-blue-500" />}
            {stage === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {getStageTitle()}
          </h3>
          <div className="text-sm text-muted-foreground">
            {processed} / {total} rows
          </div>
        </div>

        <Progress value={progressPercentage} className="w-full h-2" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{total}</div>
            <div className="text-xs text-muted-foreground">Total Rows</div>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle className="h-5 w-5" />
              {successful}
            </div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
              <XCircle className="h-5 w-5" />
              {failed}
            </div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              {currentRow && (
                <>
                  <span>Processing row {currentRow}</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </>
              )}
            </div>
            
            {estimatedTimeRemaining && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>~{formatTime(estimatedTimeRemaining)} remaining</span>
              </div>
            )}
          </div>
        )}

        {stage === 'completed' && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Process completed! {successful} records processed successfully
                {failed > 0 && `, ${failed} failed`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressIndicator;