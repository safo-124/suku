import { BarChart3 } from "lucide-react"
import { AnalyticsClient } from "./_components/analytics-client"

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl neu-convex flex items-center justify-center">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Platform insights and performance metrics
          </p>
        </div>
      </div>

      {/* Analytics Content */}
      <AnalyticsClient />
    </div>
  )
}
