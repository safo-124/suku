import { Metadata } from "next"
import { Settings } from "lucide-react"

export const metadata: Metadata = {
  title: "Settings | School Admin",
  description: "School settings and configuration",
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 neu-flat rounded-xl">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your school settings
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="neu-flat rounded-2xl p-12 text-center">
        <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Settings Module</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This module will include school profile, academic year configuration,
          grading scales, promotion rules, and user management.
        </p>
      </div>
    </div>
  )
}
