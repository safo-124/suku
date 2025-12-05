import { getTeacherMessages } from "../_actions/teacher-actions"
import { MessagesClient } from "./_components/messages-client"

export default async function TeacherMessagesPage() {
  const result = await getTeacherMessages()
  
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
  
  return <MessagesClient messages={result.messages || []} />
}
