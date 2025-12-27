import { getSubmissionDetails } from "../../../_actions/assignment-actions"
import { SubmissionDetailClient } from "./_components/submission-detail-client"
import { redirect } from "next/navigation"

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>
}) {
  const { id, submissionId } = await params
  const result = await getSubmissionDetails(submissionId)
  
  if (!result.success || !result.submission) {
    redirect(`/teacher/assignments/${id}/submissions`)
  }
  
  return (
    <SubmissionDetailClient 
      submission={result.submission}
      assignment={result.assignment!}
      student={result.student!}
      questions={result.questions || []}
    />
  )
}
