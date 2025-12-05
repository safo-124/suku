import { getStudentMessages } from "../_actions/student-actions"
import { MessagesClient } from "./_components/messages-client"

export default async function StudentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const type = (params.type as "inbox" | "sent") || "inbox"
  const result = await getStudentMessages(type)
  
  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            {result.error || "Failed to load messages"}
          </h2>
        </div>
      </div>
    )
  }
  
  return <MessagesClient messages={result.messages || []} type={type} />
}
