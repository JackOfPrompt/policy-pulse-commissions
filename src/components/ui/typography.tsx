import * as React from "react"
import { cn } from "@/lib/utils"

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body-large' | 'body' | 'body-small' | 'caption' | 'label'
  as?: React.ElementType
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'body', as, ...props }, ref) => {
    const Component = as || getDefaultElement(variant)
    
    return (
      <Component
        ref={ref}
        className={cn(getVariantClasses(variant), className)}
        {...props}
      />
    )
  }
)

Typography.displayName = "Typography"

function getDefaultElement(variant: string): React.ElementType {
  switch (variant) {
    case 'h1': return 'h1'
    case 'h2': return 'h2'
    case 'h3': return 'h3'
    case 'h4': return 'h4'
    case 'h5': return 'h5'
    case 'h6': return 'h6'
    case 'caption': return 'span'
    case 'label': return 'label'
    default: return 'p'
  }
}

function getVariantClasses(variant: string): string {
  switch (variant) {
    case 'h1': return 'text-heading-1'
    case 'h2': return 'text-heading-2'
    case 'h3': return 'text-heading-3'
    case 'h4': return 'text-xl font-light'
    case 'h5': return 'text-lg font-normal'
    case 'h6': return 'text-base font-normal'
    case 'body-large': return 'text-body-large'
    case 'body': return 'text-body'
    case 'body-small': return 'text-body-small'
    case 'caption': return 'text-caption'
    case 'label': return 'text-label'
    default: return 'text-body'
  }
}

export { Typography, type TypographyProps }