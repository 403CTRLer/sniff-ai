import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    positive: boolean
  }
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
}

export function StatsCard({ title, value, description, icon: Icon, trend, badge }: StatsCardProps) {
  return (
    <Card className="bg-[#1A1A1A] border-[#333333] hover:border-[#D4AF37] transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="bg-[#333333] text-[#D4AF37] border-[#D4AF37]">
              {badge.text}
            </Badge>
          )}
          <Icon className="h-4 w-4 text-[#D4AF37]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-medium ${trend.positive ? "text-green-400" : "text-red-400"}`}>
              {trend.positive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
