import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { ClassDetailClient } from "../_components/class-detail-client"
import { Prisma } from "@/app/generated/prisma/client"

export const metadata: Metadata = {
  title: "Class Details | School Admin",
  description: "View and manage class details",
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

const classSelect = {
  id: true,
  name: true,
  section: true,
  capacity: true,
  roomNumber: true,
  schoolLevelId: true,
  classTeacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  },
  academicYear: {
    select: {
      id: true,
      name: true,
      isCurrent: true,
    },
  },
  gradeDefinition: {
    select: {
      id: true,
      name: true,
      shortName: true,
      description: true,
    },
  },
  schoolLevel: {
    select: {
      id: true,
      name: true,
      shortName: true,
      allowElectives: true,
    },
  },
  classSubjects: {
    select: {
      id: true,
      subjectId: true,
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          isRequiredForPromotion: true,
        },
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      subject: { name: "asc" as const },
    },
  },
  _count: {
    select: {
      students: true,
    },
  },
} satisfies Prisma.ClassSelect

type ClassDataResult = Prisma.ClassGetPayload<{ select: typeof classSelect }>

async function getClassData(schoolId: string, classId: string) {
  const classData = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId,
    },
    select: classSelect,
  }) as ClassDataResult | null

  if (!classData) return null

  // Get subject types for this level if exists
  type ClassSubject = ClassDataResult['classSubjects'][number]
  type SubjectWithType = ClassSubject & { subjectType?: "CORE" | "ELECTIVE" }
  let subjectsWithTypes: SubjectWithType[] = classData.classSubjects.map(cs => ({ ...cs }))

  if (classData.schoolLevelId) {
    const levelSubjects = await prisma.levelSubject.findMany({
      where: {
        levelId: classData.schoolLevelId,
        subjectId: { in: classData.classSubjects.map(cs => cs.subjectId) },
      },
      select: {
        subjectId: true,
        subjectType: true,
      },
    })
    const typeMap = new Map(levelSubjects.map(ls => [ls.subjectId, ls.subjectType]))
    
    subjectsWithTypes = classData.classSubjects.map(cs => ({
      ...cs,
      subjectType: typeMap.get(cs.subjectId) || ("CORE" as const),
    }))
  }

  return {
    ...classData,
    classSubjects: subjectsWithTypes,
  }
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const school = await getSchoolData()

  if (!school) {
    redirect("/school/login")
  }

  const classData = await getClassData(school.id, id)

  if (!classData) {
    notFound()
  }

  return <ClassDetailClient classData={classData as any} />
}
