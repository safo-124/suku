import { getStudentGrades } from "../_actions/student-actions"
import { GradesClient } from "./_components/grades-client"

export default async function StudentGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const result = await getStudentGrades(params.period)
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load grades"}
          </h2>
        </div>
      </div>
    )
  }
  
  return (
    <GradesClient 
      periods={result.periods || []}
      selectedPeriodId={result.selectedPeriodId}
      resultsBySubject={result.resultsBySubject || []}
      reportCard={result.reportCard ?? null}
    />
  )
}
