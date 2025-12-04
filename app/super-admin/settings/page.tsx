import { Metadata } from "next"
import { Settings } from "lucide-react"
import { getSettings } from "./_actions/settings-actions"
import { SettingsClient } from "./_components/settings-client"

export const metadata: Metadata = {
  title: "Settings | Super Admin",
  description: "Platform settings and configuration",
}

export default async function SettingsPage() {
  const result = await getSettings()
  
  if (!result.success || !result.settings) {
    return (
      <div className="p-6 text-red-400">
        Failed to load settings. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 neu-flat rounded-xl">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">
            Manage platform configuration and preferences
          </p>
        </div>
      </div>

      {/* Settings Content */}
      <SettingsClient initialSettings={result.settings} />
    </div>
  )
}
