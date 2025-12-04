import { Metadata } from "next"
import { MessageSquare, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Messages | School Admin",
  description: "Communication center",
}

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 neu-flat rounded-xl">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with parents and staff
            </p>
          </div>
        </div>
        <Button className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Coming Soon */}
      <div className="neu-flat rounded-2xl p-12 text-center">
        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Messages Module</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This module will include direct messaging, announcements, 
          bulk SMS/email, and push notifications.
        </p>
      </div>
    </div>
  )
}
