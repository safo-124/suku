import { Metadata } from "next"
import { BookOpen } from "lucide-react"
import prisma from "@/lib/prisma"
import { SubjectsClient } from "./_components/subjects-client"
import { getCurrentSchoolSlug } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Subjects | School Admin",
  description: "Manage subjects and curriculum",
}

async function getSchoolData() {
  const schoolSlug = await getCurrentSchoolSlug()

  if (!schoolSlug) {
    return null
  }

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    select: { id: true },
  })

  return school
}

async function getSubjectsData(schoolId: string) {
  const [subjects, schoolLevels, classes] = await Promise.all([
    prisma.subject.findMany({
      where: { schoolId },
      include: {
        levelSubjects: {
          include: {
            level: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
          },
        },
        _count: {
          select: {
            classSubjects: true,
            questions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.schoolLevel.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        shortName: true,
        allowElectives: true,
        order: true,
      },
      orderBy: { order: "asc" },
    }),
    prisma.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  return { subjects, schoolLevels, classes }
}

export default async function SubjectsPage() {
  const school = await getSchoolData()

  if (!school) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">School not found</p>
      </div>
    )
  }

  const { subjects, schoolLevels, classes } = await getSubjectsData(school.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 neu-flat rounded-xl">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Subjects</h1>
          <p className="text-muted-foreground">
            Manage subjects and assign them to school levels
          </p>
        </div>
      </div>

      {/* Subjects Client Component */}
      <SubjectsClient
        subjects={subjects as any}
        schoolLevels={schoolLevels}
        classes={classes}
      />
    </div>
  )
}
