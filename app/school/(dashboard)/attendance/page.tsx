import { Metadata } from "next"
import { ClipboardList } from "lucide-react"
import { 
  getSchoolAttendanceOverview, 
  getAcademicPeriodsWithAttendance,
  getPeriodAttendanceStats 
} from "./_actions/attendance-actions"
import { AttendanceClient } from "./_components/attendance-client"

export const metadata: Metadata = {
  title: "Attendance | School Admin",
  description: "Track and manage student attendance",
}

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const date = params.date || new Date().toISOString().split("T")[0]
  
  const [result, periodsResult, periodStatsResult] = await Promise.all([
    getSchoolAttendanceOverview(date),
    getAcademicPeriodsWithAttendance(),
    getPeriodAttendanceStats(),
  ])
  
  if (!result.success) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 neu-flat rounded-xl">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Attendance</h1>
            <p className="text-muted-foreground">
              Track and manage student attendance
            </p>
          </div>
        </div>

        {/* Error */}
        <div className="neu-flat rounded-2xl p-12 text-center">
          <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Attendance</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {result.error || "An error occurred while loading attendance data."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 neu-flat rounded-xl">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Attendance</h1>
          <p className="text-muted-foreground">
            View attendance records across all classes and levels
          </p>
        </div>
      </div>

      {/* Attendance Client */}
      <AttendanceClient
        initialDate={result.date!}
        levels={result.levels!}
        overallStats={result.overallStats!}
        periods={periodsResult.success ? periodsResult.periods! : []}
        academicYear={periodsResult.success ? periodsResult.academicYear! : null}
        periodStats={periodStatsResult.success ? {
          period: periodStatsResult.period!,
          summary: periodStatsResult.summary!,
          stats: periodStatsResult.stats!,
          attendanceRate: periodStatsResult.attendanceRate!,
        } : null}
      />
    </div>
  )
}
