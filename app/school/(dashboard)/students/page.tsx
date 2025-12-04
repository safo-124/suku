import { Metadata } from "next"
import { Suspense } from "react"
import { GraduationCap, Loader2 } from "lucide-react"
import { StudentsClient } from "./_components/students-client"
import { getStudents, getClassesForDropdown } from "./_actions/student-actions"
import { Gender } from "@/app/generated/prisma/client"

export const metadata: Metadata = {
  title: "Students | School Admin",
  description: "Manage students in your school",
}

interface StudentsPageProps {
  searchParams: Promise<{
    search?: string
    classId?: string
    gender?: Gender
    isActive?: string
    page?: string
  }>
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams

  return (
    <Suspense fallback={<StudentsLoading />}>
      <StudentsContent params={params} />
    </Suspense>
  )
}

async function StudentsContent({ params }: { params: Awaited<StudentsPageProps["searchParams"]> }) {
  const page = parseInt(params.page || "1", 10)
  const isActive = params.isActive ? params.isActive === "true" : undefined

  const [studentsResult, classesResult] = await Promise.all([
    getStudents({
      search: params.search,
      classId: params.classId,
      gender: params.gender,
      isActive,
      page,
      limit: 20,
    }),
    getClassesForDropdown(),
  ])

  return (
    <StudentsClient
      students={studentsResult.students as any}
      classes={classesResult.classes as any}
      total={studentsResult.total}
      page={studentsResult.page || 1}
      totalPages={studentsResult.totalPages || 1}
    />
  )
}

function StudentsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-muted/30 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-muted/50 rounded-xl animate-pulse" />
      </div>

      <div className="flex gap-4">
        <div className="h-11 flex-1 max-w-md bg-muted/30 rounded-xl animate-pulse" />
        <div className="h-11 w-40 bg-muted/30 rounded-xl animate-pulse" />
        <div className="h-11 w-32 bg-muted/30 rounded-xl animate-pulse" />
      </div>

      <div className="neu rounded-3xl p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}
