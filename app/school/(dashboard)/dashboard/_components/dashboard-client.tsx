"use client"

import { DashboardStats } from "../_actions/dashboard-actions"
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  FileText,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardClientProps {
  stats: DashboardStats
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: number
  trendLabel?: string
}) {
  const isPositive = trend && trend > 0

  return (
    <div className="neu-flat rounded-2xl p-5 hover:neu-lg transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isPositive ? "text-emerald-500" : "text-red-500"
              )}>
                {isPositive ? "+" : ""}{trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-muted-foreground ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 neu-sm rounded-xl group-hover:neu-convex transition-all">
          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  )
}

function ActivityItem({
  activity,
}: {
  activity: DashboardStats["recentActivity"][number]
}) {
  const icons = {
    enrollment: UserPlus,
    attendance: ClipboardCheck,
    fee: DollarSign,
    message: MessageSquare,
    assignment: FileText,
  }
  const Icon = icons[activity.type]

  const colors = {
    enrollment: "text-blue-500 bg-blue-500/10",
    attendance: "text-green-500 bg-green-500/10",
    fee: "text-amber-500 bg-amber-500/10",
    message: "text-purple-500 bg-purple-500/10",
    assignment: "text-indigo-500 bg-indigo-500/10",
  }

  const formatTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className={cn("p-2 rounded-lg shrink-0", colors[activity.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatTime(activity.timestamp)}
      </span>
    </div>
  )
}

function EventItem({
  event,
}: {
  event: DashboardStats["upcomingEvents"][number]
}) {
  const colors = {
    exam: "border-l-red-500",
    holiday: "border-l-green-500",
    meeting: "border-l-blue-500",
    event: "border-l-purple-500",
  }

  const formatDate = (date: Date) => {
    const days = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "Tomorrow"
    if (days < 7) return `In ${days} days`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className={cn(
      "p-3 rounded-xl border-l-4 bg-white/[0.02]",
      colors[event.type]
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{event.title}</p>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
          {event.type}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {formatDate(event.date)}
      </p>
    </div>
  )
}

function AttendanceBar({
  data,
}: {
  data: DashboardStats["attendanceByClass"][number]
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{data.className}</span>
        <span className="text-xs text-muted-foreground">{data.rate}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            data.rate >= 95 ? "bg-emerald-500" :
            data.rate >= 85 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${data.rate}%` }}
        />
      </div>
    </div>
  )
}

export function DashboardClient({ stats }: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.students.total}
          subtitle={`${stats.students.active} active`}
          icon={GraduationCap}
          trend={stats.students.trend}
          trendLabel="this month"
        />
        <StatCard
          title="Teachers"
          value={stats.teachers.total}
          subtitle={`${stats.teachers.subjects} subjects`}
          icon={Users}
        />
        <StatCard
          title="Today's Attendance"
          value={`${stats.attendance.todayRate}%`}
          subtitle={`${stats.attendance.absentToday} absent`}
          icon={ClipboardCheck}
          trend={stats.attendance.todayRate - stats.attendance.weeklyAverage}
          trendLabel="vs weekly avg"
        />
        <StatCard
          title="Fees Collected"
          value={`$${(stats.fees.collected / 1000).toFixed(0)}k`}
          subtitle={`$${(stats.fees.pending / 1000).toFixed(0)}k pending`}
          icon={DollarSign}
          trend={stats.fees.collectionRate - 75}
          trendLabel="collection rate"
        />
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts */}
        <div className="lg:col-span-2 neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-500/50 via-amber-500/20 to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">Attention Required</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <DollarSign className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-xs text-muted-foreground">Overdue Fees</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <ClipboardCheck className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Low Attendance</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">Unread Messages</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Summary */}
        <div className="neu-flat rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Classes</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Classes</span>
              <span className="font-semibold">{stats.classes.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Average Size</span>
              <span className="font-semibold">{stats.classes.averageSize} students</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              All classes have assigned teachers
            </div>
          </div>
        </div>
      </div>

      {/* Activity & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Recent Activity</h3>
              </div>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                View all
              </button>
            </div>
            <div className="space-y-1">
              {stats.recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Upcoming Events</h3>
              </div>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                View calendar
              </button>
            </div>
            <div className="space-y-3">
              {stats.upcomingEvents.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance by Class */}
      <div className="neu-flat rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Today's Attendance by Class</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">≥95%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">85-94%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">&lt;85%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.attendanceByClass.map((item) => (
              <AttendanceBar key={item.className} data={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
