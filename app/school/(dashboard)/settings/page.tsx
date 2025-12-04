import { Metadata } from "next"
import { Settings } from "lucide-react"
import { SettingsClient } from "./_components/settings-client"
import {
  getSchoolProfile,
  getGradeScales,
  getPromotionRule,
  getRequiredSubjects,
  getAcademicYears,
  getSchoolLevels,
  getGradeDefinitions,
} from "./_actions/settings-actions"

export const metadata: Metadata = {
  title: "Settings | School Admin",
  description: "School settings and configuration",
}

export default async function SettingsPage() {
  // Fetch all settings data in parallel
  const [profile, grades, promotionRule, subjects, academicYears, schoolLevels, gradeDefinitions] = await Promise.all([
    getSchoolProfile(),
    getGradeScales(),
    getPromotionRule(),
    getRequiredSubjects(),
    getAcademicYears(),
    getSchoolLevels(),
    getGradeDefinitions(),
  ])

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
            Configure your school settings and academic structure
          </p>
        </div>
      </div>

      {/* Settings Content */}
      <SettingsClient
        profile={profile}
        grades={grades}
        promotionRule={promotionRule}
        subjects={subjects}
        academicYears={academicYears as any}
        schoolLevels={schoolLevels as any}
        gradeDefinitions={gradeDefinitions as any}
      />
    </div>
  )
}
