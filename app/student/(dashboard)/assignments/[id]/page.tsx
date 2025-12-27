import { getAssignmentForStudent } from "../_actions/assignment-actions"
import { AssignmentDetailClient } from "./_components/assignment-detail-client"
import { redirect } from "next/navigation"

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getAssignmentForStudent(id)
  
  if (!result.success || !result.assignment) {
    redirect("/student/assignments")
  }
  
  return (
    <AssignmentDetailClient 
      assignment={result.assignment}
      questions={result.questions || []}
      submission={result.submission}
    />
  )
}
