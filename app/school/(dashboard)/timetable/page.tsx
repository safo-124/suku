import { Metadata } from "next"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Timetable | School Admin",
  description: "Manage school timetables",
}

export default function TimetablePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 neu-flat rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Timetable</h1>
            <p className="text-muted-foreground">
              Manage class schedules and periods
            </p>
          </div>
        </div>
        <Button className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl">
          Generate Timetable
        </Button>
      </div>

      {/* Coming Soon */}
      <div className="neu-flat rounded-2xl p-12 text-center">
        <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Timetable Module</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This module will include period configuration, class-wise timetables,
          teacher schedules, and automatic conflict detection.
        </p>
      </div>
    </div>
  )
}
