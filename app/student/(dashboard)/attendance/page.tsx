import { getStudentAttendance, getStudentAttendanceSummary } from "../_actions/student-actions"
import { AttendanceClient } from "./_components/attendance-client"

export default async function StudentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; periodId?: string }>
}) {
  const params = await searchParams
  const month = params.month ? parseInt(params.month) : undefined
  const year = params.year ? parseInt(params.year) : undefined
  
  const [result, summaryResult] = await Promise.all([
    getStudentAttendance(month, year),
    getStudentAttendanceSummary(params.periodId),
  ])
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load attendance"}
          </h2>
        </div>
      </div>
    )
  }
  
  return (
    <AttendanceClient 
      attendance={result.attendance || []}
      stats={result.stats!}
      month={result.month!}
      year={result.year!}
      summary={summaryResult.success ? {
        className: summaryResult.className!,
        periods: summaryResult.periods!,
        period: summaryResult.period!,
        stats: summaryResult.stats!,
        totalMarked: summaryResult.totalMarked!,
        attendancePercent: summaryResult.attendancePercent!,
        recentRecords: summaryResult.recentRecords!,
      } : null}
    />
  )
}
