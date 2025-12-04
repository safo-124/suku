import { Building2, Users, CreditCard, TrendingUp, ArrowUpRight, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { cn } from "@/lib/utils"

type RecentSchool = {
  id: string
  name: string
  slug: string
  isActive: boolean
  subscriptionPlan: string
  subscriptionStatus: string
  createdAt: Date
  _count: {
    users: number
  }
}

async function getStats() {
  const totalSchools = await prisma.school.count()
  const activeSchools = await prisma.school.count({ where: { isActive: true } })
  const totalUsers = await prisma.user.count()
  const recentSchools = await prisma.school.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  }) as unknown as RecentSchool[]

  return {
    totalSchools,
    activeSchools,
    totalUsers,
    recentSchools,
  }
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
  accentColor?: string
}

function StatCard({ title, value, subtitle, icon: Icon, trend, accentColor = "bg-foreground" }: StatCardProps) {
  return (
    <div className="group relative">
      <div className="neu rounded-3xl p-6 hover-lift h-full">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium tracking-wide">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold tracking-tight">{value}</p>
              {trend === "up" && (
                <span className="flex items-center text-emerald-600 text-sm font-medium">
                  <ArrowUpRight className="h-4 w-4" />
                  12%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-300",
            "neu-convex group-hover:neu-inset-sm"
          )}>
            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
        
        {/* Decorative accent line */}
        <div className="absolute bottom-0 left-6 right-6 h-1 rounded-full overflow-hidden">
          <div className={cn("h-full w-1/3 rounded-full", accentColor)} />
        </div>
      </div>
    </div>
  )
}

function getPlanStyle(plan: string) {
  switch (plan) {
    case "ENTERPRISE":
      return "bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-700 border-violet-200"
    case "PROFESSIONAL":
      return "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200"
    case "BASIC":
      return "bg-gradient-to-r from-sky-500/10 to-cyan-500/10 text-sky-700 border-sky-200"
    default:
      return "bg-muted/50 text-muted-foreground border-border"
  }
}

function getStatusDot(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500"
    case "TRIAL":
      return "bg-blue-500"
    default:
      return "bg-muted-foreground"
  }
}

export default async function SuperAdminDashboard() {
  const stats = await getStats()

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Sparkles className="h-4 w-4" />
            <span>Welcome back</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Here&apos;s what&apos;s happening with your platform today.
          </p>
        </div>
        <Link href="/super-admin/schools/new">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl neu-convex hover:neu-inset-sm transition-all duration-300 font-medium text-sm">
            <Building2 className="h-4 w-4" />
            Add School
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Schools"
          value={stats.totalSchools}
          subtitle={`${stats.activeSchools} currently active`}
          icon={Building2}
          trend="up"
          accentColor="bg-foreground"
        />
        <StatCard
          title="Active Rate"
          value={stats.totalSchools > 0 ? `${Math.round((stats.activeSchools / stats.totalSchools) * 100)}%` : "0%"}
          subtitle="Of all registered schools"
          icon={TrendingUp}
          accentColor="bg-emerald-500"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Across all schools"
          icon={Users}
          trend="up"
          accentColor="bg-blue-500"
        />
        <StatCard
          title="Revenue"
          value="$0"
          subtitle="This month"
          icon={CreditCard}
          accentColor="bg-violet-500"
        />
      </div>

      {/* Recent Schools */}
      <div className="neu rounded-3xl overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Recent Schools</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Latest schools registered on the platform
              </p>
            </div>
            <Link href="/super-admin/schools">
              <button className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                View all
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
        
        <div className="p-6 sm:p-8">
          {stats.recentSchools.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-6 rounded-3xl neu-inset mb-6">
                <Building2 className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <h4 className="text-lg font-semibold mb-2">No schools yet</h4>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Create your first school to get started with the platform
              </p>
              <Link href="/super-admin/schools/new">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity">
                  <Building2 className="h-4 w-4" />
                  Create First School
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentSchools.map((school) => (
                <Link key={school.id} href={`/super-admin/schools/${school.id}`}>
                  <div className="group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:neu-sm cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl neu-convex group-hover:neu-inset-sm transition-all duration-300">
                        <Building2 className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold group-hover:text-foreground transition-colors">{school.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn("h-1.5 w-1.5 rounded-full", getStatusDot(school.subscriptionStatus))} />
                          <p className="text-sm text-muted-foreground">
                            {school.slug}.yourdomain.com
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <span className={cn(
                          "inline-flex px-3 py-1.5 rounded-xl text-xs font-medium border",
                          getPlanStyle(school.subscriptionPlan)
                        )}>
                          {school.subscriptionPlan.charAt(0) + school.subscriptionPlan.slice(1).toLowerCase()}
                        </span>
                        <p className="text-xs text-muted-foreground mt-2">
                          {school._count.users} user{school._count.users !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
