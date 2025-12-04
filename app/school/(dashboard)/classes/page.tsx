import { Metadata } from "next"
import { BookOpen } from "lucide-react"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { UserRole } from "@/app/generated/prisma/client"
import { ClassesClient } from "./_components/classes-client"

export const metadata: Metadata = {
  title: "Classes | School Admin",
  description: "Manage classes and sections",
}

async function getSchoolData() {
  const headersList = await headers()
  const schoolSlug = headersList.get("x-school-slug")

  if (!schoolSlug) {
    return null
  }

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    select: { id: true },
  })

  return school
}

async function getClassesData(schoolId: string) {
  const [classes, teachers, academicYears] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId },
      include: {
        classTeacher: {
          select: { 
            id: true,
            firstName: true,
            lastName: true, 
            email: true,
          },
        },
        academicYear: {
          select: { name: true },
        },
        _count: {
          select: {
            students: true,
            classSubjects: true,
          },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { section: "asc" }],
    }),
    // Get users with Teacher role for class teacher assignment
    prisma.user.findMany({
      where: { 
        schoolId,
        role: UserRole.TEACHER,
        isActive: true,
      },
      select: { 
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
    }),
  ])

  const currentAcademicYear = academicYears.find((y) => y.isCurrent) || null

  return { classes, teachers, academicYears, currentAcademicYear }
}

export default async function ClassesPage() {
  const school = await getSchoolData()

  if (!school) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">School not found</p>
      </div>
    )
  }

  const { classes, teachers, academicYears, currentAcademicYear } = 
    await getClassesData(school.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 neu-flat rounded-xl">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Classes</h1>
          <p className="text-muted-foreground">
            Manage classes, sections, and subjects
          </p>
        </div>
      </div>

      {/* Classes Client Component */}
      <ClassesClient
        classes={classes as any}
        teachers={teachers}
        academicYears={academicYears}
        currentAcademicYear={currentAcademicYear}
      />
    </div>
  )
}
