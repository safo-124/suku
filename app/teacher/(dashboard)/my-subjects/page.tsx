import { getMySubjects } from "../_actions/teacher-actions"
import { SubjectsClient } from "./_components/subjects-client"

export default async function MySubjectsPage() {
  const result = await getMySubjects()
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load subjects"}
          </h2>
        </div>
      </div>
    )
  }
  
  return <SubjectsClient subjects={result.subjects || []} />
}
