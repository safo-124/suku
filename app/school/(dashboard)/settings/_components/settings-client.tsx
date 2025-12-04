"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  GraduationCap, 
  TrendingUp, 
  Calendar,
  Settings as SettingsIcon,
  Layers,
  ListOrdered
} from "lucide-react"
import { SchoolProfileForm } from "./school-profile-form"
import { GradeScaleManager } from "./grade-scale-manager"
import { PromotionRulesManager } from "./promotion-rules-manager"
import { AcademicYearManager } from "./academic-year-manager"
import { SchoolLevelsManager } from "./school-levels-manager"
import { GradeDefinitionsManager } from "./grade-definitions-manager"

interface SchoolProfile {
  id: string
  name: string
  slug: string
  logo: string | null
  address: string | null
  phone: string | null
  email: string | null
  subscriptionPlan: string
  subscriptionStatus: string
  maxStudents: number
  maxTeachers: number
}

interface GradeScale {
  id: string
  label: string
  minScore: unknown
  maxScore: unknown
  gpa: unknown
  isPassingGrade: boolean
}

interface PromotionRule {
  id: string
  type: string
  threshold: unknown
  isActive: boolean
}

interface Subject {
  id: string
  name: string
  code: string | null
  isRequiredForPromotion: boolean
}

interface AcademicPeriod {
  id: string
  name: string
  order: number
  startDate: Date
  endDate: Date
}

interface AcademicYear {
  id: string
  name: string
  startDate: Date
  endDate: Date
  isCurrent: boolean
  isArchived: boolean
  promotionThreshold: unknown
  periods: AcademicPeriod[]
  _count: {
    classes: number
    enrollments: number
  }
}

interface LevelSubject {
  id: string
  subjectType: string
  isCompulsory: boolean
  subject: {
    id: string
    name: string
    code: string | null
  }
}

interface SchoolLevel {
  id: string
  name: string
  shortName: string
  description: string | null
  allowElectives: boolean
  order: number
  subjects: LevelSubject[]
  grades: {
    id: string
    name: string
    shortName: string
  }[]
  _count: {
    classes: number
  }
}

interface GradeDefinition {
  id: string
  name: string
  shortName: string
  description: string | null
  order: number
  schoolLevelId: string | null
  schoolLevel: {
    id: string
    name: string
    shortName: string
  } | null
  _count: {
    classes: number
  }
}

interface SettingsClientProps {
  profile: SchoolProfile | null
  grades: GradeScale[]
  promotionRule: PromotionRule | null
  subjects: Subject[]
  academicYears: AcademicYear[]
  schoolLevels: SchoolLevel[]
  gradeDefinitions: GradeDefinition[]
}

const tabs = [
  { id: "profile", label: "School Profile", icon: Building2 },
  { id: "classes", label: "Classes/Grades", icon: ListOrdered },
  { id: "levels", label: "School Levels", icon: Layers },
  { id: "grades", label: "Grade Scale", icon: GraduationCap },
  { id: "promotion", label: "Promotion Rules", icon: TrendingUp },
  { id: "academic", label: "Academic Years", icon: Calendar },
]

export function SettingsClient({
  profile,
  grades,
  promotionRule,
  subjects,
  academicYears,
  schoolLevels,
  gradeDefinitions,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile")

  if (!profile) {
    return (
      <div className="text-center py-12 neu-sm rounded-2xl">
        <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h4 className="font-medium mb-2">School not found</h4>
        <p className="text-sm text-muted-foreground">
          Unable to load school settings
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-2 neu-sm rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "neu-inset text-foreground"
                : "text-muted-foreground hover:text-foreground hover:neu-sm"
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="neu-sm rounded-2xl p-6">
        {activeTab === "profile" && (
          <SchoolProfileForm profile={profile} />
        )}
        
        {activeTab === "classes" && (
          <GradeDefinitionsManager grades={gradeDefinitions} schoolLevels={schoolLevels} />
        )}
        
        {activeTab === "levels" && (
          <SchoolLevelsManager levels={schoolLevels} subjects={subjects} />
        )}
        
        {activeTab === "grades" && (
          <GradeScaleManager grades={grades} />
        )}
        
        {activeTab === "promotion" && (
          <PromotionRulesManager rule={promotionRule} subjects={subjects} />
        )}
        
        {activeTab === "academic" && (
          <AcademicYearManager years={academicYears} />
        )}
      </div>
    </div>
  )
}
