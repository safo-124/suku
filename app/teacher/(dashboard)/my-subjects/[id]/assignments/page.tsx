import { getSubjectAssignments } from "../../../assignments/_actions/assignment-actions"
import { SubjectAssignmentsClient } from "./_components/subject-assignments-client"
import { redirect } from "next/navigation"

export default async function SubjectAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getSubjectAssignments(id)
  
  if (!result.success || !result.classSubject) {
    redirect("/teacher/my-subjects")
  }
  
  return (
    <SubjectAssignmentsClient 
      classSubject={result.classSubject}
      studentCount={result.studentCount || 0}
      assignments={result.assignments || []}
    />
  )
}
