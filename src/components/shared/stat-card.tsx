import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "cn"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  hint?: string
  tone?: "default" | "success" | "warning" | "destructive" | "primary"
  className?: string
}

const toneClasses = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  destructive: "text-destructive",
} as const

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <Card size="sm" className={cn("gap-0 py-3", className)}>
      <CardContent className="flex items-start justify-between gap-3 px-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {title}
          </p>
          <p
            className={cn(
              "mt-1 font-heading text-xl font-semibold tabular-nums",
              toneClasses[tone]
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
