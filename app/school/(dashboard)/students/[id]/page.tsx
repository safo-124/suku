import { Metadata } from "next"
import { notFound } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { 
  getStudentProfile, 
  getStudentAttendanceSummary, 
  getStudentGradesSummary 
} from "./_actions/profile-actions"
import { ProfileClient } from "./_components/profile-client"

export const metadata: Metadata = {
  title: "Student Profile | School Admin",
  description: "View student profile details",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { id } = await params
  
  // Fetch all data in parallel
  const [profileResult, attendanceResult, gradesResult] = await Promise.all([
    getStudentProfile(id),
    getStudentAttendanceSummary(id),
    getStudentGradesSummary(id),
  ])
  
  if (!profileResult.success || !profileResult.student) {
    notFound()
  }

  return (
    <ProfileClient
      student={profileResult.student as any}
      attendance={attendanceResult.success ? {
        academicYear: attendanceResult.academicYear!,
        stats: attendanceResult.stats!,
        attendanceRate: attendanceResult.attendanceRate!,
        recentAttendance: attendanceResult.recentAttendance!,
      } : null}
      grades={gradesResult.success ? {
        periods: gradesResult.periods!,
        selectedPeriodId: gradesResult.selectedPeriodId!,
        grades: gradesResult.grades!,
        subjectSummaries: gradesResult.subjectSummaries!,
        reportCard: gradesResult.reportCard!,
      } : null}
    />
  )
}
