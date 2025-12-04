import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Sparkles,
  Zap,
  Crown,
  Building2,
  DollarSign,
  Users,
} from "lucide-react"
import { SubscriptionsClient } from "./_components/subscriptions-client"
import { getSubscriptionStats } from "./_actions/subscription-actions"
import { PLAN_CONFIGS, SubscriptionPlan } from "./_lib/plans"
import { cn } from "@/lib/utils"

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  color = "text-muted-foreground"
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  subtext?: string
  color?: string
}) {
  return (
    <div className="neu-flat rounded-xl p-4 hover-lift">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg neu-inset flex items-center justify-center">
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground/70">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  count,
}: {
  plan: SubscriptionPlan
  count: number
}) {
  const config = PLAN_CONFIGS[plan]
  const icons: Record<SubscriptionPlan, React.ComponentType<{ className?: string }>> = {
    FREE: Sparkles,
    BASIC: Zap,
    PROFESSIONAL: Crown,
    ENTERPRISE: Building2,
  }
  const colors: Record<SubscriptionPlan, string> = {
    FREE: "text-zinc-400",
    BASIC: "text-blue-400",
    PROFESSIONAL: "text-purple-400",
    ENTERPRISE: "text-amber-400",
  }
  const Icon = icons[plan]

  return (
    <div className="neu-flat rounded-xl p-4 hover-lift">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg neu-inset flex items-center justify-center">
            <Icon className={cn("h-5 w-5", colors[plan])} />
          </div>
          <div>
            <p className="font-semibold">{config.name}</p>
            <p className="text-sm text-muted-foreground">${config.price}/mo</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">schools</p>
        </div>
      </div>
    </div>
  )
}

export default async function SubscriptionsPage() {
  const statsResult = await getSubscriptionStats()
  const stats = statsResult.success ? statsResult.stats : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subscriptions</h2>
        <p className="text-muted-foreground mt-1">
          Manage school subscriptions and billing
        </p>
      </div>

      {/* Revenue & Key Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={DollarSign} 
            label="Monthly Revenue" 
            value={`$${stats.mrr.toLocaleString()}`}
            color="text-green-400"
          />
          <StatCard 
            icon={CreditCard} 
            label="Total Schools" 
            value={stats.total}
          />
          <StatCard 
            icon={TrendingUp} 
            label="Active" 
            value={stats.statusBreakdown?.ACTIVE || 0}
            color="text-green-400"
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Trials Expiring" 
            value={stats.trialExpiringSoon}
            subtext="within 7 days"
            color="text-amber-400"
          />
        </div>
      )}

      {/* Plan Breakdown */}
      {stats && (
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-purple-500/50 via-purple-500/20 to-transparent" />
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Plan Distribution</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(["FREE", "BASIC", "PROFESSIONAL", "ENTERPRISE"] as SubscriptionPlan[]).map((plan) => (
                <PlanCard
                  key={plan}
                  plan={plan}
                  count={stats.planBreakdown?.[plan] || 0}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
        <div className="p-6">
          <SubscriptionsClient />
        </div>
      </div>
    </div>
  )
}
