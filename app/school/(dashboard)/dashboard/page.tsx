import { Metadata } from "next"
import { getDashboardStats } from "./_actions/dashboard-actions"
import { DashboardClient } from "./_components/dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard | School Admin",
  description: "School administration dashboard",
}

export default async function SchoolDashboardPage() {
  const result = await getDashboardStats()

  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-400">
        Failed to load dashboard data. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at your school today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Last updated:</span>
          <span className="font-medium text-foreground">
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Dashboard Content */}
      <DashboardClient stats={result.data} />
    </div>
  )
}
