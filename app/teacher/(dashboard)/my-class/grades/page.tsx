import { getMyClassGrades } from "../../_actions/teacher-actions"
import { GradesClient } from "./_components/grades-client"

export default async function MyClassGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const result = await getMyClassGrades(params.period)
  
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
      className={result.className || ""}
      examPeriods={result.examPeriods || []}
      selectedPeriodId={result.selectedPeriodId}
      subjects={result.subjects || []}
      students={result.students || []}
    />
  )
}
