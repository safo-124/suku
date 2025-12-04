import { Users, UserCheck, UserX, Shield, GraduationCap, BookOpen, Building2 } from "lucide-react"
import { UsersClient } from "./_components/users-client"
import { getUserStats, UserStats } from "./_actions/user-actions"
import { cn } from "@/lib/utils"

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = "text-muted-foreground"
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="neu-flat rounded-xl p-4 hover-lift">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg neu-inset flex items-center justify-center">
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default async function UsersPage() {
  const statsResult = await getUserStats()
  const stats: UserStats | null = statsResult.success ? statsResult.stats ?? null : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground mt-1">
          Manage all users across all schools
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard 
            icon={Users} 
            label="Total Users" 
            value={stats.total} 
          />
          <StatCard 
            icon={UserCheck} 
            label="Active" 
            value={stats.active}
            color="text-green-400"
          />
          <StatCard 
            icon={UserX} 
            label="Inactive" 
            value={stats.inactive}
            color="text-zinc-400"
          />
          <StatCard 
            icon={Shield} 
            label="Admins" 
            value={(stats.roleBreakdown?.SUPER_ADMIN || 0) + (stats.roleBreakdown?.SCHOOL_ADMIN || 0)}
            color="text-amber-400"
          />
          <StatCard 
            icon={BookOpen} 
            label="Teachers" 
            value={stats.roleBreakdown?.TEACHER || 0}
            color="text-blue-400"
          />
          <StatCard 
            icon={GraduationCap} 
            label="Students" 
            value={stats.roleBreakdown?.STUDENT || 0}
            color="text-green-400"
          />
        </div>
      )}

      {/* Users List */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
        <div className="p-6">
          <UsersClient />
        </div>
      </div>
    </div>
  )
}
