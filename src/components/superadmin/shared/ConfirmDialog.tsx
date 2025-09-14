import React, { ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Trash2, Ban, CheckCircle } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'warning';
  requireConfirmation?: boolean;
  confirmationText?: string;
  requireReason?: boolean;
  reason?: string;
  onReasonChange?: (reason: string) => void;
  icon?: ReactNode;
}

const variantConfig = {
  default: {
    icon: CheckCircle,
    className: 'text-primary',
    buttonVariant: 'default' as const,
  },
  destructive: {
    icon: Trash2,
    className: 'text-destructive',
    buttonVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-warning',
    buttonVariant: 'default' as const,
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'default',
  requireConfirmation = false,
  confirmationText = 'I understand this action cannot be undone',
  requireReason = false,
  reason = '',
  onReasonChange,
  icon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = icon || config.icon;
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const isConfirmDisabled = 
    loading || 
    (requireReason && !reason?.trim()) ||
    (requireConfirmation && !confirmationChecked);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-muted ${config.className}`}>
              {React.isValidElement(IconComponent) ? (
                IconComponent
              ) : React.createElement(IconComponent as React.ComponentType<{ className?: string }>, { className: "h-5 w-5" })}
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {requireReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required)</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for this action..."
                value={reason}
                onChange={(e) => onReasonChange?.(e.target.value)}
                disabled={loading}
                className="min-h-[80px]"
              />
            </div>
          )}

          {requireConfirmation && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmation"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
                disabled={loading}
              />
              <Label
                htmlFor="confirmation"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {confirmationText}
              </Label>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <Button
            variant={config.buttonVariant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={isConfirmDisabled}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for managing confirmation state
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const openDialog = () => setOpen(true);
  const closeDialog = () => {
    setOpen(false);
    setReason('');
    setConfirmationChecked(false);
  };

  return {
    open,
    reason,
    confirmationChecked,
    openDialog,
    closeDialog,
    setReason,
    setConfirmationChecked,
  };
}