import { getTeacherDashboard } from "../_actions/teacher-actions"
import { DashboardClient } from "./_components/dashboard-client"

export default async function TeacherDashboardPage() {
  const result = await getTeacherDashboard()
  
  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load dashboard"}
          </h2>
        </div>
      </div>
    )
  }
  
  return <DashboardClient data={result.data} />
}
