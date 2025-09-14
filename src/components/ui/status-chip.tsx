import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusChipVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        success: "bg-success-light text-success border border-success/20",
        warning: "bg-warning-light text-warning border border-warning/20", 
        destructive: "bg-destructive-light text-destructive border border-destructive/20",
        info: "bg-info-light text-info border border-info/20",
        secondary: "bg-secondary text-secondary-foreground border border-border",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusChipVariants> {
  children: React.ReactNode;
}

function StatusChip({ className, variant, children, ...props }: StatusChipProps) {
  return (
    <div className={cn(statusChipVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { StatusChip, statusChipVariants };