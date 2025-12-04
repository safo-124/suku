"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  Building2, 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Loader2,
  ArrowUpRight,
  Crown,
  Zap,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getAnalytics, AnalyticsData, TimeRange } from "../_actions/analytics-actions"

const planIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  FREE: Sparkles,
  BASIC: Zap,
  PROFESSIONAL: Crown,
  ENTERPRISE: Building2,
}

const planColors: Record<string, string> = {
  FREE: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  BASIC: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  PROFESSIONAL: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  ENTERPRISE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500",
  TRIAL: "bg-blue-500",
  PAST_DUE: "bg-amber-500",
  CANCELLED: "bg-red-500",
  EXPIRED: "bg-zinc-500",
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500",
  SCHOOL_ADMIN: "bg-amber-500",
  TEACHER: "bg-blue-500",
  STUDENT: "bg-green-500",
  PARENT: "bg-purple-500",
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
  color = "text-muted-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  change?: number
  trend?: "up" | "down" | "neutral"
  color?: string
}) {
  return (
    <div className="neu-flat rounded-2xl p-5 hover-lift">
      <div className="flex items-start justify-between">
        <div className="h-11 w-11 rounded-xl neu-inset flex items-center justify-center">
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg",
            trend === "up" && "bg-green-500/10 text-green-400",
            trend === "down" && "bg-red-500/10 text-red-400",
            trend === "neutral" && "bg-zinc-500/10 text-zinc-400"
          )}>
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {change > 0 ? "+" : ""}{change}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  )
}

function SimpleBarChart({
  data,
  label,
  color = "bg-white",
}: {
  data: { label: string; value: number }[]
  label: string
  color?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-2 rounded-full neu-inset overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", color)}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DistributionChart({
  data,
  colors,
}: {
  data: { name: string; value: number; percentage: number }[]
  colors: Record<string, string>
}) {
  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="h-4 rounded-full neu-inset overflow-hidden flex">
        {data.map((item, i) => (
          <div
            key={i}
            className={cn("h-full transition-all duration-500", colors[item.name] || "bg-zinc-500")}
            style={{ width: `${item.percentage}%` }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className={cn("h-3 w-3 rounded-full", colors[item.name] || "bg-zinc-500")} />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniLineChart({
  data,
  label,
}: {
  data: { date: string; value: number }[]
  label: string
}) {
  if (data.length === 0) return null
  
  const max = Math.max(...data.map((d) => d.value), 1)
  const min = Math.min(...data.map((d) => d.value), 0)
  const range = max - min || 1
  
  // Create SVG path
  const width = 100
  const height = 40
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.value - min) / range) * height
    return `${x},${y}`
  })
  const pathD = `M ${points.join(" L ")}`
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{data[data.length - 1]?.value.toLocaleString()}</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
          </linearGradient>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAnalytics(timeRange)
      if (result.success && result.data) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  if (isLoading) {
    return (
      <div className="neu-inset rounded-2xl p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="neu-inset rounded-2xl p-12 text-center">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Overview</h3>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[140px] neu-flat border-0 rounded-xl h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="neu-flat border-white/10">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Schools"
          value={data.overview.totalSchools.toLocaleString()}
          change={data.overview.schoolGrowth}
          trend={data.overview.schoolGrowth > 0 ? "up" : data.overview.schoolGrowth < 0 ? "down" : "neutral"}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={data.overview.totalUsers.toLocaleString()}
          change={data.overview.userGrowth}
          trend={data.overview.userGrowth > 0 ? "up" : data.overview.userGrowth < 0 ? "down" : "neutral"}
        />
        <StatCard
          icon={Activity}
          label="Active Schools"
          value={data.overview.activeSchools.toLocaleString()}
          color="text-green-400"
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={`$${data.overview.mrr.toLocaleString()}`}
          color="text-green-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="neu-flat rounded-2xl p-5">
          <MiniLineChart
            data={data.charts.schoolsOverTime.map((d) => ({ date: d.date, value: d.count }))}
            label="Schools Growth"
          />
        </div>
        <div className="neu-flat rounded-2xl p-5">
          <MiniLineChart
            data={data.charts.usersOverTime.map((d) => ({ date: d.date, value: d.count }))}
            label="Users Growth"
          />
        </div>
        <div className="neu-flat rounded-2xl p-5">
          <MiniLineChart
            data={data.charts.revenueOverTime.map((d) => ({ date: d.date, value: d.amount }))}
            label="Revenue Trend"
          />
        </div>
      </div>

      {/* Distributions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-purple-500/50 via-purple-500/20 to-transparent" />
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Plan Distribution</h3>
            <DistributionChart
              data={data.distributions.planDistribution.map((d) => ({
                name: d.plan,
                value: d.count,
                percentage: d.percentage,
              }))}
              colors={{
                FREE: "bg-zinc-500",
                BASIC: "bg-blue-500",
                PROFESSIONAL: "bg-purple-500",
                ENTERPRISE: "bg-amber-500",
              }}
            />
          </div>
        </div>

        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-green-500/50 via-green-500/20 to-transparent" />
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Status Distribution</h3>
            <DistributionChart
              data={data.distributions.statusDistribution.map((d) => ({
                name: d.status,
                value: d.count,
                percentage: d.percentage,
              }))}
              colors={statusColors}
            />
          </div>
        </div>
      </div>

      {/* Role Distribution */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500/50 via-blue-500/20 to-transparent" />
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">User Roles</h3>
          <DistributionChart
            data={data.distributions.roleDistribution.map((d) => ({
              name: d.role.replace("_", " "),
              value: d.count,
              percentage: d.percentage,
            }))}
            colors={{
              "SUPER ADMIN": "bg-red-500",
              "SCHOOL ADMIN": "bg-amber-500",
              TEACHER: "bg-blue-500",
              STUDENT: "bg-green-500",
              PARENT: "bg-purple-500",
            }}
          />
        </div>
      </div>

      {/* Top Schools */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Top Schools by Users</h3>
            <Link href="/super-admin/schools">
              <Button variant="ghost" size="sm" className="neu-flat hover:neu-inset rounded-xl">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {data.topSchools.map((school, i) => {
              const PlanIcon = planIcons[school.plan] || Building2
              return (
                <Link
                  key={school.id}
                  href={`/super-admin/schools/${school.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg neu-inset flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{school.name}</p>
                    <p className="text-sm text-muted-foreground">{school.slug}.suku.app</p>
                  </div>
                  <Badge className={cn("border", planColors[school.plan])}>
                    <PlanIcon className="h-3 w-3 mr-1" />
                    {school.plan}
                  </Badge>
                  <div className="text-right">
                    <p className="font-semibold">{school.userCount}</p>
                    <p className="text-xs text-muted-foreground">users</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
