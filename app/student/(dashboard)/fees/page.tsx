import { getStudentFees } from "../_actions/student-actions"
import { FeesClient } from "./_components/fees-client"

export default async function StudentFeesPage() {
  const result = await getStudentFees()
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load fees"}
          </h2>
        </div>
      </div>
    )
  }
  
  return (
    <FeesClient 
      fees={result.fees || []}
      payments={result.payments || []}
      summary={result.summary!}
    />
  )
}
