import { getTeacherAssignments } from "./_actions/assignment-actions"
import { AssignmentsClient } from "./_components/assignments-client"

export default async function AssignmentsPage() {
  const result = await getTeacherAssignments()
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load assignments"}
          </h2>
        </div>
      </div>
    )
  }
  
  return <AssignmentsClient assignments={result.assignments || []} />
}
