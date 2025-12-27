import { getAssignmentSubmissions } from "../../_actions/assignment-actions"
import { SubmissionsClient } from "./_components/submissions-client"
import { redirect } from "next/navigation"

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getAssignmentSubmissions(id)
  
  if (!result.success || !result.assignment) {
    redirect("/teacher/assignments")
  }
  
  return (
    <SubmissionsClient 
      assignment={result.assignment}
      students={result.students || []}
    />
  )
}
