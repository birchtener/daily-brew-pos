import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer")
  }
  return context
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ id, className, config, children, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-grid-horizontal_line]:stroke-border [&_.recharts-cartesian-grid-vertical_line]:stroke-border [&_.recharts-curve.recharts-area]:fill-opacity-10 [&_.recharts-dot]:stroke-background [&_.recharts-grid-background]:fill-muted [&_.recharts-indicator]:stroke-background [&_.recharts-sector]:stroke-background [&_.recharts-active-dot]:stroke-background [&_.recharts-active-dot]:stroke-width-2",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer id={id}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, value]) => value.color || value.theme
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(config)
          .map(([key, value]) => {
            const color = value.color
            if (!color) return ""
            return `
              [data-chart="${id}"] {
                --color-${key}: ${color};
              }
            `
          })
          .join("\n"),
      }}
    />
  )
}

export const ChartTooltip = RechartsPrimitive.Tooltip

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  payload?: any[]
  label?: any
  labelFormatter?: (value: any, payload: any[]) => React.ReactNode
  labelClassName?: string
  formatter?: any
  color?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
}

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = config[key]
      const value =
        typeof label === "string"
          ? config[label]?.label || label
          : itemConfig?.label || label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

    if (!active || !payload?.length) {
      return null
    }

    const nestFormatter = payload.length === 1

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-md",
          className
        )}
      >
        {!nestFormatter ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item: any, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = config[key]
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey || index}
                className={cn(
                  "flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  nestFormatter && "justify-between"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {!hideIndicator && (
                    <div
                      className={cn(
                        "shrink-0 rounded-[2px]",
                        indicator === "dot" && "h-2 w-2",
                        indicator === "line" && "w-0.5 h-3",
                        indicator === "dashed" &&
                          "w-0.5 h-3 border-t border-dashed bg-transparent"
                      )}
                      style={
                        {
                          backgroundColor: indicatorColor,
                          borderColor: indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <span className="text-muted-foreground">
                    {itemConfig?.label || item.name}
                  </span>
                </div>
                {item.value !== undefined && (
                  <span className="font-mono font-bold text-foreground">
                    {typeof formatter === "function"
                      ? formatter(item.value, item.name, item, index, payload)
                      : item.value}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export const ChartLegend = RechartsPrimitive.Legend

interface ChartLegendContentProps extends React.HTMLAttributes<HTMLDivElement> {
  payload?: any[]
  verticalAlign?: "top" | "middle" | "bottom"
  hideIcon?: boolean
  nameKey?: string
}

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
      {payload.map((item: any) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = config[key]

        return (
          <div
            key={item.value}
            className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground text-xs"
          >
            {!hideIcon && itemConfig?.icon && <itemConfig.icon />}
            {!hideIcon && !itemConfig?.icon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            <span>{itemConfig?.label || item.value}</span>
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"
