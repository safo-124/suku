import { getStudentTimetable } from "../_actions/student-actions"
import { TimetableClient } from "./_components/timetable-client"

export default async function StudentTimetablePage() {
  const result = await getStudentTimetable()
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load timetable"}
          </h2>
        </div>
      </div>
    )
  }
  
  return (
    <TimetableClient 
      periods={result.periods || []}
      timetable={result.timetable || []}
      className={result.className}
    />
  )
}
