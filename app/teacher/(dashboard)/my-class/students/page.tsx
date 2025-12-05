import { getMyClassStudents } from "../../_actions/teacher-actions"
import { StudentsClient } from "./_components/students-client"

export default async function MyClassStudentsPage() {
  const result = await getMyClassStudents()
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load students"}
          </h2>
        </div>
      </div>
    )
  }
  
  return <StudentsClient className={result.className || ""} students={result.students || []} />
}
