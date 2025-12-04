import { Metadata } from "next"
import { ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Attendance | School Admin",
  description: "Manage student attendance",
}

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 neu-flat rounded-xl">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Attendance</h1>
            <p className="text-muted-foreground">
              Track and manage student attendance
            </p>
          </div>
        </div>
        <Button className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl">
          Mark Attendance
        </Button>
      </div>

      {/* Coming Soon */}
      <div className="neu-flat rounded-2xl p-12 text-center">
        <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Attendance Module</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This module will include daily attendance marking, reports, 
          low attendance alerts, and attendance statistics.
        </p>
      </div>
    </div>
  )
}
