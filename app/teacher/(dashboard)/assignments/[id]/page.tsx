import { getAssignmentDetails } from "../_actions/assignment-actions"
import { AssignmentDetailClient } from "./_components/assignment-detail-client"
import { redirect } from "next/navigation"

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getAssignmentDetails(id)
  
  if (!result.success || !result.assignment) {
    redirect("/teacher/assignments")
  }
  
  return (
    <AssignmentDetailClient 
      assignment={result.assignment}
      questions={result.questions || []}
    />
  )
}
