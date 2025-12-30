"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentSchool, verifySchoolAccess } from "@/lib/auth"
import { UserRole, PromotionRuleType, SubjectType } from "@/app/generated/prisma/client"

// ============================================
// SCHOOL PROFILE
// ============================================

export async function updateSchoolProfile(data: {
  name: string
  logo?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    await prisma.school.update({
      where: { id: school.id },
      data: {
        name: data.name,
        logo: data.logo,
        address: data.address,
        phone: data.phone,
        email: data.email,
      },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to update school profile:", err)
    return { success: false, error: "Failed to update school profile" }
  }
}

export async function getSchoolProfile() {
  const school = await getCurrentSchool()
  if (!school) {
    return null
  }

  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    logo: school.logo,
    address: school.address,
    phone: school.phone,
    email: school.email,
    subscriptionPlan: school.subscriptionPlan,
    subscriptionStatus: school.subscriptionStatus,
    maxStudents: school.maxStudents,
    maxTeachers: school.maxTeachers,
  }
}

// ============================================
// GRADE SCALES
// ============================================

export async function getGradeScales() {
  const school = await getCurrentSchool()
  if (!school) return []

  return prisma.gradeScale.findMany({
    where: { schoolId: school.id },
    orderBy: { maxScore: "desc" },
  })
}

export async function createGradeScale(data: {
  label: string
  minScore: number
  maxScore: number
  gpa?: number | null
  isPassingGrade: boolean
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Check for overlapping score ranges
    const existing = await prisma.gradeScale.findMany({
      where: { schoolId: school.id },
    })

    for (const grade of existing) {
      const min = Number(grade.minScore)
      const max = Number(grade.maxScore)
      if (
        (data.minScore >= min && data.minScore <= max) ||
        (data.maxScore >= min && data.maxScore <= max) ||
        (data.minScore <= min && data.maxScore >= max)
      ) {
        return { success: false, error: `Score range overlaps with grade ${grade.label} (${min}-${max})` }
      }
    }

    await prisma.gradeScale.create({
      data: {
        schoolId: school.id,
        label: data.label,
        minScore: data.minScore,
        maxScore: data.maxScore,
        gpa: data.gpa,
        isPassingGrade: data.isPassingGrade,
      },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to create grade scale:", err)
    return { success: false, error: "Failed to create grade scale" }
  }
}

export async function updateGradeScale(
  id: string,
  data: {
    label: string
    minScore: number
    maxScore: number
    gpa?: number | null
    isPassingGrade: boolean
  }
) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Verify grade belongs to school
    const grade = await prisma.gradeScale.findFirst({
      where: { id, schoolId: school.id },
    })

    if (!grade) {
      return { success: false, error: "Grade scale not found" }
    }

    // Check for overlapping score ranges (excluding self)
    const existing = await prisma.gradeScale.findMany({
      where: { schoolId: school.id, id: { not: id } },
    })

    for (const g of existing) {
      const min = Number(g.minScore)
      const max = Number(g.maxScore)
      if (
        (data.minScore >= min && data.minScore <= max) ||
        (data.maxScore >= min && data.maxScore <= max) ||
        (data.minScore <= min && data.maxScore >= max)
      ) {
        return { success: false, error: `Score range overlaps with grade ${g.label} (${min}-${max})` }
      }
    }

    await prisma.gradeScale.update({
      where: { id },
      data: {
        label: data.label,
        minScore: data.minScore,
        maxScore: data.maxScore,
        gpa: data.gpa,
        isPassingGrade: data.isPassingGrade,
      },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to update grade scale:", err)
    return { success: false, error: "Failed to update grade scale" }
  }
}

export async function deleteGradeScale(id: string) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const grade = await prisma.gradeScale.findFirst({
      where: { id, schoolId: school.id },
    })

    if (!grade) {
      return { success: false, error: "Grade scale not found" }
    }

    await prisma.gradeScale.delete({ where: { id } })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to delete grade scale:", err)
    return { success: false, error: "Failed to delete grade scale" }
  }
}

// ============================================
// PROMOTION RULES
// ============================================

export async function getPromotionRule() {
  const school = await getCurrentSchool()
  if (!school) return null

  return prisma.promotionRule.findFirst({
    where: { schoolId: school.id, isActive: true },
  })
}

export async function savePromotionRule(data: {
  type: string
  threshold: number
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Deactivate existing rules
    await prisma.promotionRule.updateMany({
      where: { schoolId: school.id },
      data: { isActive: false },
    })

    // Create new active rule
    await prisma.promotionRule.create({
      data: {
        schoolId: school.id,
        type: data.type as PromotionRuleType,
        threshold: data.threshold,
        isActive: true,
      },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to save promotion rule:", err)
    return { success: false, error: "Failed to save promotion rule" }
  }
}

// Get subjects marked as required for promotion
export async function getRequiredSubjects() {
  const school = await getCurrentSchool()
  if (!school) return []

  return prisma.subject.findMany({
    where: { schoolId: school.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      isRequiredForPromotion: true,
    },
  })
}

export async function updateSubjectPromotionRequirement(
  subjectId: string,
  isRequired: boolean
) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: school.id },
    })

    if (!subject) {
      return { success: false, error: "Subject not found" }
    }

    await prisma.subject.update({
      where: { id: subjectId },
      data: { isRequiredForPromotion: isRequired },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to update subject:", err)
    return { success: false, error: "Failed to update subject" }
  }
}

// ============================================
// ACADEMIC YEARS
// ============================================

export async function getAcademicYears() {
  const school = await getCurrentSchool()
  if (!school) return []

  const years = await prisma.academicYear.findMany({
    where: { schoolId: school.id },
    include: {
      periods: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          classes: true,
          enrollments: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  })

  return years
}

export async function createAcademicYear(data: {
  name: string
  startDate: Date
  endDate: Date
  promotionThreshold?: number | null
  copyFromYearId?: string | null
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Check for duplicate name
    const existing = await prisma.academicYear.findFirst({
      where: { schoolId: school.id, name: data.name },
    })

    if (existing) {
      return { success: false, error: "An academic year with this name already exists" }
    }

    // Create the academic year
    const newYear = await prisma.academicYear.create({
      data: {
        schoolId: school.id,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        promotionThreshold: data.promotionThreshold,
        isCurrent: false,
        isArchived: false,
      },
    })

    // If copying from previous year, copy classes and periods
    if (data.copyFromYearId) {
      const sourceYear = await prisma.academicYear.findFirst({
        where: { id: data.copyFromYearId, schoolId: school.id },
        include: {
          periods: true,
          classes: {
            include: {
              classSubjects: true,
            },
          },
        },
      })

      if (sourceYear) {
        // Copy periods
        for (const period of sourceYear.periods) {
          await prisma.academicPeriod.create({
            data: {
              academicYearId: newYear.id,
              name: period.name,
              order: period.order,
              startDate: period.startDate,
              endDate: period.endDate,
            },
          })
        }

        // Copy classes and their subject assignments
        for (const cls of sourceYear.classes) {
          const newClass = await prisma.class.create({
            data: {
              schoolId: school.id,
              academicYearId: newYear.id,
              name: cls.name,
              gradeLevel: cls.gradeLevel,
              section: cls.section,
              capacity: cls.capacity,
              roomNumber: cls.roomNumber,
              classTeacherId: cls.classTeacherId,
            },
          })

          // Copy class subjects
          for (const cs of cls.classSubjects) {
            await prisma.classSubject.create({
              data: {
                classId: newClass.id,
                subjectId: cs.subjectId,
                teacherId: cs.teacherId,
              },
            })
          }
        }
      }
    }

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true, yearId: newYear.id }
  } catch (err) {
    console.error("Failed to create academic year:", err)
    return { success: false, error: "Failed to create academic year" }
  }
}

export async function updateAcademicYear(
  id: string,
  data: {
    name: string
    startDate: Date
    endDate: Date
    promotionThreshold?: number | null
  }
) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const year = await prisma.academicYear.findFirst({
      where: { id, schoolId: school.id },
    })

    if (!year) {
      return { success: false, error: "Academic year not found" }
    }

    if (year.isArchived) {
      return { success: false, error: "Cannot edit an archived academic year" }
    }

    await prisma.academicYear.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        promotionThreshold: data.promotionThreshold,
      },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to update academic year:", err)
    return { success: false, error: "Failed to update academic year" }
  }
}

export async function setCurrentAcademicYear(id: string) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const year = await prisma.academicYear.findFirst({
      where: { id, schoolId: school.id },
    })

    if (!year) {
      return { success: false, error: "Academic year not found" }
    }

    if (year.isArchived) {
      return { success: false, error: "Cannot set an archived year as current" }
    }

    // Remove current from all years
    await prisma.academicYear.updateMany({
      where: { schoolId: school.id },
      data: { isCurrent: false },
    })

    // Set this year as current
    await prisma.academicYear.update({
      where: { id },
      data: { isCurrent: true },
    })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to set current academic year:", err)
    return { success: false, error: "Failed to set current academic year" }
  }
}

export async function archiveAcademicYear(id: string) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const year = await prisma.academicYear.findFirst({
      where: { id, schoolId: school.id },
    })

    if (!year) {
      return { success: false, error: "Academic year not found" }
    }

    if (year.isCurrent) {
      return { success: false, error: "Cannot archive the current academic year" }
    }

    await prisma.academicYear.update({
      where: { id },
      data: { isArchived: true, isCurrent: false },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to archive academic year:", err)
    return { success: false, error: "Failed to archive academic year" }
  }
}

export async function deleteAcademicYear(id: string) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const year = await prisma.academicYear.findFirst({
      where: { id, schoolId: school.id },
      include: {
        _count: {
          select: {
            classes: true,
            enrollments: true,
          },
        },
      },
    })

    if (!year) {
      return { success: false, error: "Academic year not found" }
    }

    if (year.isCurrent) {
      return { success: false, error: "Cannot delete the current academic year" }
    }

    if (year._count.enrollments > 0) {
      return { success: false, error: "Cannot delete an academic year with student enrollments" }
    }

    await prisma.academicYear.delete({ where: { id } })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to delete academic year:", err)
    return { success: false, error: "Failed to delete academic year" }
  }
}

// ============================================
// ACADEMIC PERIODS
// ============================================

export async function createAcademicPeriod(data: {
  academicYearId: string
  name: string
  startDate: Date
  endDate: Date
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Verify academic year belongs to school and is not archived
    const year = await prisma.academicYear.findFirst({
      where: { id: data.academicYearId, schoolId: school.id },
    })

    if (!year) {
      return { success: false, error: "Academic year not found" }
    }

    if (year.isArchived) {
      return { success: false, error: "Cannot add periods to an archived academic year" }
    }

    // Get next order number
    const lastPeriod = await prisma.academicPeriod.findFirst({
      where: { academicYearId: data.academicYearId },
      orderBy: { order: "desc" },
    })

    const order = (lastPeriod?.order ?? 0) + 1

    await prisma.academicPeriod.create({
      data: {
        academicYearId: data.academicYearId,
        name: data.name,
        order,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to create academic period:", err)
    return { success: false, error: "Failed to create academic period" }
  }
}

export async function updateAcademicPeriod(
  id: string,
  data: {
    name: string
    startDate: Date
    endDate: Date
  }
) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Verify period belongs to school's academic year
    const period = await prisma.academicPeriod.findFirst({
      where: { id },
      include: {
        academicYear: true,
      },
    })

    if (!period || period.academicYear.schoolId !== school.id) {
      return { success: false, error: "Academic period not found" }
    }

    if (period.academicYear.isArchived) {
      return { success: false, error: "Cannot edit periods in an archived academic year" }
    }

    await prisma.academicPeriod.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to update academic period:", err)
    return { success: false, error: "Failed to update academic period" }
  }
}

export async function reorderAcademicPeriods(
  periodIds: string[]
) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Update order for each period
    for (let i = 0; i < periodIds.length; i++) {
      await prisma.academicPeriod.update({
        where: { id: periodIds[i] },
        data: { order: i + 1 },
      })
    }

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to reorder periods:", err)
    return { success: false, error: "Failed to reorder periods" }
  }
}

export async function deleteAcademicPeriod(id: string) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const period = await prisma.academicPeriod.findFirst({
      where: { id },
      include: {
        academicYear: true,
        _count: {
          select: {
            assignments: true,
            examResults: true,
            reportCards: true,
          },
        },
      },
    })

    if (!period || period.academicYear.schoolId !== school.id) {
      return { success: false, error: "Academic period not found" }
    }

    if (period.academicYear.isArchived) {
      return { success: false, error: "Cannot delete periods from an archived academic year" }
    }

    const totalDependencies = 
      period._count.assignments + 
      period._count.examResults + 
      period._count.reportCards

    if (totalDependencies > 0) {
      return { 
        success: false, 
        error: "Cannot delete period with existing assignments, results, or report cards" 
      }
    }

    await prisma.academicPeriod.delete({ where: { id } })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to delete academic period:", err)
    return { success: false, error: "Failed to delete academic period" }
  }
}

// ============================================
// SCHOOL SETTINGS (JSON field)
// ============================================

export async function getSchoolSettings() {
  const school = await getCurrentSchool()
  if (!school) return null

  const fullSchool = await prisma.school.findUnique({
    where: { id: school.id },
    select: { settings: true },
  })

  return (fullSchool?.settings as Record<string, unknown>) || {}
}

export async function updateSchoolSettings(settings: Record<string, unknown>) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Merge with existing settings
    const existing = await prisma.school.findUnique({
      where: { id: school.id },
      select: { settings: true },
    })

    const currentSettings = (existing?.settings as Record<string, unknown>) || {}
    const mergedSettings = { ...currentSettings, ...settings }

    await prisma.school.update({
      where: { id: school.id },
      data: {
        settings: mergedSettings as object,
      },
    })

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to update settings:", err)
    return { success: false, error: "Failed to update settings" }
  }
}

// ============================================
// SCHOOL LEVELS
// ============================================

export async function getSchoolLevels() {
  const school = await getCurrentSchool()
  if (!school) return []

  return prisma.schoolLevel.findMany({
    where: { schoolId: school.id },
    include: {
      subjects: {
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      grades: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          classes: true,
        },
      },
    },
    orderBy: { order: "asc" },
  })
}

export async function createSchoolLevel(data: {
  name: string
  shortName: string
  description?: string | null
  allowElectives: boolean
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Check for duplicate name
    const existing = await prisma.schoolLevel.findFirst({
      where: { schoolId: school.id, name: data.name },
    })

    if (existing) {
      return { success: false, error: "A school level with this name already exists" }
    }

    // Get next order number
    const lastLevel = await prisma.schoolLevel.findFirst({
      where: { schoolId: school.id },
      orderBy: { order: "desc" },
    })

    const order = (lastLevel?.order ?? 0) + 1

    await prisma.schoolLevel.create({
      data: {
        schoolId: school.id,
        name: data.name,
        shortName: data.shortName,
        description: data.description,
        allowElectives: data.allowElectives,
        order,
      },
    })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to create school level:", err)
    return { success: false, error: "Failed to create school level" }
  }
}

export async function updateSchoolLevel(
  id: string,
  data: {
    name: string
    shortName: string
    description?: string | null
    allowElectives: boolean
  }
) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const level = await prisma.schoolLevel.findFirst({
      where: { id, schoolId: school.id },
    })

    if (!level) {
      return { success: false, error: "School level not found" }
    }

    await prisma.schoolLevel.update({
      where: { id },
      data: {
        name: data.name,
        shortName: data.shortName,
        description: data.description,
        allowElectives: data.allowElectives,
      },
    })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to update school level:", err)
    return { success: false, error: "Failed to update school level" }
  }
}

export async function deleteSchoolLevel(id: string) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const level = await prisma.schoolLevel.findFirst({
      where: { id, schoolId: school.id },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
    })

    if (!level) {
      return { success: false, error: "School level not found" }
    }

    if (level._count.classes > 0) {
      return { success: false, error: "Cannot delete a school level with existing classes" }
    }

    await prisma.schoolLevel.delete({ where: { id } })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to delete school level:", err)
    return { success: false, error: "Failed to delete school level" }
  }
}

export async function reorderSchoolLevels(levelIds: string[]) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    for (let i = 0; i < levelIds.length; i++) {
      await prisma.schoolLevel.update({
        where: { id: levelIds[i] },
        data: { order: i + 1 },
      })
    }

    revalidatePath("/school/settings")
    return { success: true }
  } catch (err) {
    console.error("Failed to reorder levels:", err)
    return { success: false, error: "Failed to reorder levels" }
  }
}

// ============================================
// LEVEL SUBJECTS
// ============================================

export async function addSubjectToLevel(data: {
  levelId: string
  subjectId: string
  subjectType: string
  isCompulsory: boolean
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Verify level belongs to school
    const level = await prisma.schoolLevel.findFirst({
      where: { id: data.levelId, schoolId: school.id },
    })

    if (!level) {
      return { success: false, error: "School level not found" }
    }

    // Verify subject belongs to school
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, schoolId: school.id },
    })

    if (!subject) {
      return { success: false, error: "Subject not found" }
    }

    // Check if subject already assigned to level
    const existing = await prisma.levelSubject.findFirst({
      where: { levelId: data.levelId, subjectId: data.subjectId },
    })

    if (existing) {
      return { success: false, error: "Subject already assigned to this level" }
    }

    await prisma.levelSubject.create({
      data: {
        levelId: data.levelId,
        subjectId: data.subjectId,
        subjectType: data.subjectType as SubjectType,
        isCompulsory: data.isCompulsory,
      },
    })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to add subject to level:", err)
    return { success: false, error: "Failed to add subject to level" }
  }
}

export async function updateLevelSubject(
  id: string,
  data: {
    subjectType: string
    isCompulsory: boolean
  }
) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const levelSubject = await prisma.levelSubject.findFirst({
      where: { id },
      include: {
        level: true,
      },
    })

    if (!levelSubject || levelSubject.level.schoolId !== school.id) {
      return { success: false, error: "Level subject not found" }
    }

    await prisma.levelSubject.update({
      where: { id },
      data: {
        subjectType: data.subjectType as SubjectType,
        isCompulsory: data.isCompulsory,
      },
    })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to update level subject:", err)
    return { success: false, error: "Failed to update level subject" }
  }
}

export async function removeSubjectFromLevel(id: string) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const levelSubject = await prisma.levelSubject.findFirst({
      where: { id },
      include: {
        level: true,
      },
    })

    if (!levelSubject || levelSubject.level.schoolId !== school.id) {
      return { success: false, error: "Level subject not found" }
    }

    await prisma.levelSubject.delete({ where: { id } })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to remove subject from level:", err)
    return { success: false, error: "Failed to remove subject from level" }
  }
}

export async function getSubjectsForLevel(levelId: string) {
  const school = await getCurrentSchool()
  if (!school) return []

  return prisma.levelSubject.findMany({
    where: { levelId },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  })
}

// Helper to get all subjects not yet assigned to a level
export async function getAvailableSubjectsForLevel(levelId: string) {
  const school = await getCurrentSchool()
  if (!school) return []

  // Get subjects already assigned to this level
  const assignedSubjects = await prisma.levelSubject.findMany({
    where: { levelId },
    select: { subjectId: true },
  })

  const assignedIds = assignedSubjects.map(s => s.subjectId)

  // Get all school subjects not already assigned
  return prisma.subject.findMany({
    where: {
      schoolId: school.id,
      id: { notIn: assignedIds },
    },
    orderBy: { name: "asc" },
  })
}

// ============================================
// GRADE DEFINITIONS (Custom Class/Grade Names)
// ============================================

export async function getGradeDefinitions() {
  const school = await getCurrentSchool()
  if (!school) return []

  return prisma.gradeDefinition.findMany({
    where: { schoolId: school.id },
    include: {
      schoolLevel: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
      _count: {
        select: {
          classes: true,
        },
      },
    },
    orderBy: { order: "asc" },
  })
}

export async function createGradeDefinition(data: {
  name: string
  shortName: string
  description?: string | null
  order: number
  schoolLevelId?: string | null
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Check for duplicate name
    const existingName = await prisma.gradeDefinition.findFirst({
      where: { schoolId: school.id, name: data.name },
    })

    if (existingName) {
      return { success: false, error: "A grade with this name already exists" }
    }

    // Check for duplicate order
    const existingOrder = await prisma.gradeDefinition.findFirst({
      where: { schoolId: school.id, order: data.order },
    })

    if (existingOrder) {
      return { success: false, error: `Order ${data.order} is already used by "${existingOrder.name}"` }
    }

    // Verify school level if provided
    if (data.schoolLevelId) {
      const level = await prisma.schoolLevel.findFirst({
        where: { id: data.schoolLevelId, schoolId: school.id },
      })
      if (!level) {
        return { success: false, error: "School level not found" }
      }
    }

    await prisma.gradeDefinition.create({
      data: {
        schoolId: school.id,
        name: data.name,
        shortName: data.shortName,
        description: data.description,
        order: data.order,
        schoolLevelId: data.schoolLevelId,
      },
    })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to create grade definition:", err)
    return { success: false, error: "Failed to create grade definition" }
  }
}

export async function updateGradeDefinition(
  id: string,
  data: {
    name: string
    shortName: string
    description?: string | null
    order: number
    schoolLevelId?: string | null
  }
) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const grade = await prisma.gradeDefinition.findFirst({
      where: { id, schoolId: school.id },
    })

    if (!grade) {
      return { success: false, error: "Grade definition not found" }
    }

    // Check for duplicate name (excluding self)
    if (data.name !== grade.name) {
      const existingName = await prisma.gradeDefinition.findFirst({
        where: { schoolId: school.id, name: data.name, id: { not: id } },
      })
      if (existingName) {
        return { success: false, error: "A grade with this name already exists" }
      }
    }

    // Check for duplicate order (excluding self)
    if (data.order !== grade.order) {
      const existingOrder = await prisma.gradeDefinition.findFirst({
        where: { schoolId: school.id, order: data.order, id: { not: id } },
      })
      if (existingOrder) {
        return { success: false, error: `Order ${data.order} is already used by "${existingOrder.name}"` }
      }
    }

    await prisma.gradeDefinition.update({
      where: { id },
      data: {
        name: data.name,
        shortName: data.shortName,
        description: data.description,
        order: data.order,
        schoolLevelId: data.schoolLevelId || null,
      },
    })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to update grade definition:", err)
    return { success: false, error: "Failed to update grade definition" }
  }
}

export async function deleteGradeDefinition(id: string) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    const grade = await prisma.gradeDefinition.findFirst({
      where: { id, schoolId: school.id },
      include: {
        _count: {
          select: {
            classes: true,
          },
        },
      },
    })

    if (!grade) {
      return { success: false, error: "Grade definition not found" }
    }

    if (grade._count.classes > 0) {
      return { success: false, error: "Cannot delete a grade with existing classes" }
    }

    await prisma.gradeDefinition.delete({ where: { id } })

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to delete grade definition:", err)
    return { success: false, error: "Failed to delete grade definition" }
  }
}

export async function reorderGradeDefinitions(gradeIds: string[]) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    for (let i = 0; i < gradeIds.length; i++) {
      await prisma.gradeDefinition.update({
        where: { id: gradeIds[i] },
        data: { order: i + 1 },
      })
    }

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true }
  } catch (err) {
    console.error("Failed to reorder grades:", err)
    return { success: false, error: "Failed to reorder grades" }
  }
}

// Bulk create grade definitions (for quick setup)
export async function bulkCreateGradeDefinitions(grades: {
  name: string
  shortName: string
  schoolLevelId?: string | null
}[]) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Get current max order
    const lastGrade = await prisma.gradeDefinition.findFirst({
      where: { schoolId: school.id },
      orderBy: { order: "desc" },
    })
    let currentOrder = lastGrade?.order ?? 0

    const createdGrades = []
    for (const grade of grades) {
      // Check for duplicate name
      const existing = await prisma.gradeDefinition.findFirst({
        where: { schoolId: school.id, name: grade.name },
      })
      if (existing) {
        continue // Skip duplicates
      }

      currentOrder++
      const created = await prisma.gradeDefinition.create({
        data: {
          schoolId: school.id,
          name: grade.name,
          shortName: grade.shortName,
          order: currentOrder,
          schoolLevelId: grade.schoolLevelId,
        },
      })
      createdGrades.push(created)
    }

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true, count: createdGrades.length }
  } catch (err) {
    console.error("Failed to bulk create grades:", err)
    return { success: false, error: "Failed to create grades" }
  }
}

// Bulk create school levels with associated grade definitions
export async function bulkCreateSchoolLevelsWithGrades(data: {
  levels: {
    name: string
    shortName: string
    description?: string | null
    allowElectives: boolean
    grades: { name: string; shortName: string }[]
  }[]
}) {
  const { success, school, error } = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!success || !school) {
    return { success: false, error: error || "Unauthorized" }
  }

  try {
    // Get current max orders
    const lastLevel = await prisma.schoolLevel.findFirst({
      where: { schoolId: school.id },
      orderBy: { order: "desc" },
    })
    let levelOrder = lastLevel?.order ?? 0

    const lastGrade = await prisma.gradeDefinition.findFirst({
      where: { schoolId: school.id },
      orderBy: { order: "desc" },
    })
    let gradeOrder = lastGrade?.order ?? 0

    let levelsCreated = 0
    let gradesCreated = 0

    for (const levelData of data.levels) {
      // Check if level already exists
      let level = await prisma.schoolLevel.findFirst({
        where: { schoolId: school.id, name: levelData.name },
      })

      if (!level) {
        // Create new level
        levelOrder++
        level = await prisma.schoolLevel.create({
          data: {
            schoolId: school.id,
            name: levelData.name,
            shortName: levelData.shortName,
            description: levelData.description,
            allowElectives: levelData.allowElectives,
            order: levelOrder,
          },
        })
        levelsCreated++
      }

      // Create grades under this level
      for (const gradeData of levelData.grades) {
        const existingGrade = await prisma.gradeDefinition.findFirst({
          where: { schoolId: school.id, name: gradeData.name },
        })

        if (!existingGrade) {
          gradeOrder++
          await prisma.gradeDefinition.create({
            data: {
              schoolId: school.id,
              name: gradeData.name,
              shortName: gradeData.shortName,
              order: gradeOrder,
              schoolLevelId: level.id,
            },
          })
          gradesCreated++
        }
      }
    }

    revalidatePath("/school/settings")
    revalidatePath("/school/classes")
    return { success: true, levelsCreated, gradesCreated }
  } catch (err) {
    console.error("Failed to bulk create levels with grades:", err)
    return { success: false, error: "Failed to create school levels" }
  }
}
