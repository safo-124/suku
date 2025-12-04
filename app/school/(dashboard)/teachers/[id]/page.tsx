import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { getTeacher, getAvailableClassSubjects, getAvailableClasses } from "../_actions/teacher-actions"
import { TeacherDetailClient } from "./_components/teacher-detail-client"

export const metadata: Metadata = {
  title: "Teacher Details | School Admin",
  description: "View and manage teacher details",
}

interface TeacherDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<TeacherDetailLoading />}>
      <TeacherDetailContent teacherId={id} />
    </Suspense>
  )
}

async function TeacherDetailContent({ teacherId }: { teacherId: string }) {
  const [teacherResult, classSubjectsResult, classesResult] = await Promise.all([
    getTeacher(teacherId),
    getAvailableClassSubjects(),
    getAvailableClasses(),
  ])

  if (!teacherResult.success || !teacherResult.teacher) {
    notFound()
  }

  return (
    <TeacherDetailClient
      teacher={teacherResult.teacher as any}
      availableClassSubjects={(classSubjectsResult.classSubjects || []) as any}
      availableClasses={(classesResult.classes || []) as any}
    />
  )
}

function TeacherDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-muted/50 rounded-xl animate-pulse" />
        <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="neu rounded-3xl p-6 h-80 animate-pulse" />
        </div>
        <div className="lg:col-span-2">
          <div className="neu rounded-3xl p-6 h-80 animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}
