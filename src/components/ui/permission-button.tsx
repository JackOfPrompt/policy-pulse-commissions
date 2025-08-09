import { ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PermissionButtonProps extends ButtonProps {
  module: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'export';
  children: ReactNode;
  fallback?: ReactNode;
  hideWhenDisabled?: boolean;
  disabledTooltip?: string;
}

export const PermissionButton = ({
  module,
  action,
  children,
  fallback = null,
  hideWhenDisabled = false,
  disabledTooltip = "You don't have permission to perform this action",
  ...buttonProps
}: PermissionButtonProps) => {
  const { hasPermission } = usePermissions();
  
  const canPerformAction = hasPermission(module, action);

  if (!canPerformAction && hideWhenDisabled) {
    return <>{fallback}</>;
  }

  if (!canPerformAction && !hideWhenDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button {...buttonProps} disabled>
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{disabledTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button {...buttonProps}>
      {children}
    </Button>
  );
};