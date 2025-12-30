import { getMyClassAttendance, getMyClassAttendanceSummary } from "../../_actions/teacher-actions"
import { AttendanceClient } from "./_components/attendance-client"
import { ClipboardList, AlertCircle } from "lucide-react"

export default async function MyClassAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; periodId?: string }>
}) {
  const params = await searchParams
  
  const [result, summaryResult] = await Promise.all([
    getMyClassAttendance(params.date),
    getMyClassAttendanceSummary(params.periodId),
  ])
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            {result.error === "You are not assigned as a class teacher" ? (
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            ) : (
              <AlertCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {result.error === "You are not assigned as a class teacher" 
                ? "Class Teacher Access Required"
                : "Unable to Load Attendance"
              }
            </h2>
            <p className="text-muted-foreground mt-1 max-w-md">
              {result.error === "You are not assigned as a class teacher"
                ? "Only class teachers can mark and view class attendance. Contact your administrator if you believe this is an error."
                : result.error || "An unexpected error occurred. Please try again."
              }
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <AttendanceClient 
      className={result.className || ""}
      classId={result.classId || ""}
      date={result.date || new Date().toISOString().split("T")[0]}
      students={result.students || []}
      summary={summaryResult.success ? {
        periods: summaryResult.periods!,
        period: summaryResult.period!,
        students: summaryResult.students!,
        classStats: summaryResult.classStats!,
        classAttendanceRate: summaryResult.classAttendanceRate!,
      } : null}
    />
  )
}
