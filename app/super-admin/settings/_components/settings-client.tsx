"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Save, 
  Loader2, 
  Globe, 
  Mail, 
  Palette, 
  Settings2, 
  ToggleLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  PlatformSettings, 
  updateSettings, 
  resetSettings,
  testEmailSettings,
} from "../_actions/settings-actions"

interface SettingsClientProps {
  initialSettings: PlatformSettings
}

type TabId = "general" | "branding" | "defaults" | "features" | "email"

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "General", icon: Globe },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "defaults", label: "Defaults", icon: Settings2 },
  { id: "features", label: "Features", icon: ToggleLeft },
  { id: "email", label: "Email", icon: Mail },
]

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
]

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState<TabId>("general")
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [testingEmail, setTestingEmail] = useState(false)
  const [emailTestResult, setEmailTestResult] = useState<"success" | "error" | null>(null)

  const inputClass = "neu-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-white/20 rounded-xl h-11"
  const selectClass = "neu-inset border-0 bg-transparent rounded-xl h-11 [&>span]:text-sm"

  const handleSave = (section: keyof PlatformSettings) => {
    setSaveStatus("saving")
    startTransition(async () => {
      const result = await updateSettings(section, settings[section])
      if (result.success) {
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    })
  }

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetSettings()
      if (result.success) {
        // Reload settings from server
        window.location.reload()
      }
    })
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    setEmailTestResult(null)
    const result = await testEmailSettings()
    setEmailTestResult(result.success ? "success" : "error")
    setTestingEmail(false)
  }

  const updateField = <T extends keyof PlatformSettings>(
    section: T,
    field: keyof PlatformSettings[T],
    value: PlatformSettings[T][keyof PlatformSettings[T]]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
    setSaveStatus("idle")
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar Tabs */}
      <div className="w-56 shrink-0">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                  isActive
                    ? "neu-inset text-foreground"
                    : "neu-flat hover:neu-sm text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={isPending}
            className="w-full neu-flat hover:neu-inset rounded-xl text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="neu-flat rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
          <div className="p-6">
            {/* General Settings */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">General Settings</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Basic platform configuration
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label>Platform Name</Label>
                    <Input
                      value={settings.general.platformName}
                      onChange={(e) => updateField("general", "platformName", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Platform URL</Label>
                    <Input
                      value={settings.general.platformUrl}
                      onChange={(e) => updateField("general", "platformUrl", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateField("general", "supportEmail", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Default Timezone</Label>
                    <Select
                      value={settings.general.defaultTimezone}
                      onValueChange={(v) => updateField("general", "defaultTimezone", v)}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="neu-flat border-white/10">
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SaveButton
                  status={saveStatus}
                  isPending={isPending}
                  onClick={() => handleSave("general")}
                />
              </div>
            )}

            {/* Branding Settings */}
            {activeTab === "branding" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Branding</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize the platform appearance
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={settings.branding.logoUrl}
                      onChange={(e) => updateField("branding", "logoUrl", e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <Input
                      value={settings.branding.faviconUrl}
                      onChange={(e) => updateField("branding", "faviconUrl", e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.branding.primaryColor}
                          onChange={(e) => updateField("branding", "primaryColor", e.target.value)}
                          className="h-11 w-14 rounded-xl cursor-pointer neu-inset p-1"
                        />
                        <Input
                          value={settings.branding.primaryColor}
                          onChange={(e) => updateField("branding", "primaryColor", e.target.value)}
                          className={cn(inputClass, "flex-1")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.branding.accentColor}
                          onChange={(e) => updateField("branding", "accentColor", e.target.value)}
                          className="h-11 w-14 rounded-xl cursor-pointer neu-inset p-1"
                        />
                        <Input
                          value={settings.branding.accentColor}
                          onChange={(e) => updateField("branding", "accentColor", e.target.value)}
                          className={cn(inputClass, "flex-1")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <SaveButton
                  status={saveStatus}
                  isPending={isPending}
                  onClick={() => handleSave("branding")}
                />
              </div>
            )}

            {/* Default Settings */}
            {activeTab === "defaults" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Default Settings</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure default values for new schools
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label>Default Trial Days</Label>
                    <Input
                      type="number"
                      value={settings.defaults.defaultTrialDays}
                      onChange={(e) => updateField("defaults", "defaultTrialDays", parseInt(e.target.value) || 14)}
                      min={1}
                      max={90}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Default Plan</Label>
                    <Select
                      value={settings.defaults.defaultPlan}
                      onValueChange={(v) => updateField("defaults", "defaultPlan", v)}
                    >
                      <SelectTrigger className={selectClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="neu-flat border-white/10">
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Schools Per Admin</Label>
                    <Input
                      type="number"
                      value={settings.defaults.maxSchoolsPerAdmin}
                      onChange={(e) => updateField("defaults", "maxSchoolsPerAdmin", parseInt(e.target.value) || 5)}
                      min={1}
                      max={100}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 neu-inset rounded-xl">
                    <div>
                      <p className="font-medium">Require Email Verification</p>
                      <p className="text-sm text-muted-foreground">
                        Users must verify their email before accessing the platform
                      </p>
                    </div>
                    <Switch
                      checked={settings.defaults.requireEmailVerification}
                      onCheckedChange={(checked) => updateField("defaults", "requireEmailVerification", checked)}
                    />
                  </div>
                </div>

                <SaveButton
                  status={saveStatus}
                  isPending={isPending}
                  onClick={() => handleSave("defaults")}
                />
              </div>
            )}

            {/* Feature Flags */}
            {activeTab === "features" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Feature Flags</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable or disable platform features
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 neu-inset rounded-xl">
                    <div>
                      <p className="font-medium">Public Registration</p>
                      <p className="text-sm text-muted-foreground">
                        Allow new schools to register on their own
                      </p>
                    </div>
                    <Switch
                      checked={settings.features.allowPublicRegistration}
                      onCheckedChange={(checked) => updateField("features", "allowPublicRegistration", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 neu-inset rounded-xl">
                    <div>
                      <p className="font-medium">Multi-Tenancy</p>
                      <p className="text-sm text-muted-foreground">
                        Enable subdomain-based school separation
                      </p>
                    </div>
                    <Switch
                      checked={settings.features.enableMultiTenancy}
                      onCheckedChange={(checked) => updateField("features", "enableMultiTenancy", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 neu-inset rounded-xl">
                    <div>
                      <p className="font-medium">API Access</p>
                      <p className="text-sm text-muted-foreground">
                        Allow schools to access the REST API
                      </p>
                    </div>
                    <Switch
                      checked={settings.features.enableApiAccess}
                      onCheckedChange={(checked) => updateField("features", "enableApiAccess", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div>
                      <p className="font-medium text-amber-300">Maintenance Mode</p>
                      <p className="text-sm text-amber-300/70">
                        Show maintenance page to all users except super admins
                      </p>
                    </div>
                    <Switch
                      checked={settings.features.maintenanceMode}
                      onCheckedChange={(checked) => updateField("features", "maintenanceMode", checked)}
                    />
                  </div>
                </div>

                <SaveButton
                  status={saveStatus}
                  isPending={isPending}
                  onClick={() => handleSave("features")}
                />
              </div>
            )}

            {/* Email Settings */}
            {activeTab === "email" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Email Configuration</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure SMTP settings for sending emails
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SMTP Host</Label>
                      <Input
                        value={settings.email.smtpHost}
                        onChange={(e) => updateField("email", "smtpHost", e.target.value)}
                        placeholder="smtp.example.com"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Port</Label>
                      <Input
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) => updateField("email", "smtpPort", parseInt(e.target.value) || 587)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input
                      value={settings.email.smtpUser}
                      onChange={(e) => updateField("email", "smtpUser", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 neu-inset rounded-xl">
                    <div>
                      <p className="font-medium">Use TLS/SSL</p>
                      <p className="text-sm text-muted-foreground">
                        Enable secure connection to SMTP server
                      </p>
                    </div>
                    <Switch
                      checked={settings.email.smtpSecure}
                      onCheckedChange={(checked) => updateField("email", "smtpSecure", checked)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>From Email</Label>
                      <Input
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => updateField("email", "fromEmail", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>From Name</Label>
                      <Input
                        value={settings.email.fromName}
                        onChange={(e) => updateField("email", "fromName", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Test Email */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="font-medium">Test Email Connection</p>
                      <p className="text-sm text-muted-foreground">
                        Send a test email to verify SMTP settings
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {emailTestResult === "success" && (
                        <span className="flex items-center gap-1 text-sm text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Connected
                        </span>
                      )}
                      {emailTestResult === "error" && (
                        <span className="flex items-center gap-1 text-sm text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          Failed
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        onClick={handleTestEmail}
                        disabled={testingEmail}
                        className="neu-flat hover:neu-inset rounded-xl"
                      >
                        {testingEmail ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Test
                      </Button>
                    </div>
                  </div>
                </div>

                <SaveButton
                  status={saveStatus}
                  isPending={isPending}
                  onClick={() => handleSave("email")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SaveButton({
  status,
  isPending,
  onClick,
}: {
  status: "idle" | "saving" | "saved" | "error"
  isPending: boolean
  onClick: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
      {status === "saved" && (
        <span className="flex items-center gap-1 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Changes saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          Failed to save
        </span>
      )}
      <Button
        onClick={onClick}
        disabled={isPending}
        className="neu-convex hover:scale-[0.98] active:neu-inset rounded-xl"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  )
}
