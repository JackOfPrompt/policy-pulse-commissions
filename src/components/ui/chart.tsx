import * as React from "react"
import { cn } from "@/lib/utils"

// Simple chart context and utilities
const ChartConfig = React.createContext<Record<string, any> | null>(null)

export function useChart() {
  const context = React.useContext(ChartConfig)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: Record<string, any>
    children: React.ComponentProps<"div">["children"]
  }
>(({ config, children, className, ...props }, ref) => {
  return (
    <ChartConfig.Provider value={config}>
      <div
        ref={ref}
        className={cn("aspect-auto", className)}
        {...props}
      >
        {children}
      </div>
    </ChartConfig.Provider>
  )
})

ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    />
  )
})

ChartTooltip.displayName = "ChartTooltip"

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean
    payload?: any[]
    label?: any
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
    labelFormatter?: (label: any, payload: any[]) => React.ReactNode
    formatter?: (value: any, name: any, props: any) => React.ReactNode
    color?: string
    labelClassName?: string
  }
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-background p-2 shadow-md", className)}
      {...props}
    />
  )
})

ChartTooltipContent.displayName = "ChartTooltipContent"

export const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center space-x-4", className)}
      {...props}
    />
  )
})

ChartLegend.displayName = "ChartLegend"

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: any[]
    verticalAlign?: string
    hideIcon?: boolean
    nameKey?: string
  }
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    />
  )
})

ChartLegendContent.displayName = "ChartLegendContent"