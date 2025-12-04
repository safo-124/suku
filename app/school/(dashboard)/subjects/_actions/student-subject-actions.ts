"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { verifySchoolAccess } from "@/lib/auth"
import { UserRole } from "@/app/generated/prisma/client"

// Get available elective subjects for a student based on their class's school level
export async function getAvailableElectives(studentId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, electives: [] }
  }

  try {
    // Get the student's current class and its school level
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentId },
      include: {
        class: {
          include: {
            schoolLevel: true,
          },
        },
      },
    })

    if (!student?.class?.schoolLevel) {
      return { success: false, error: "Student not enrolled in a class with a school level", electives: [] }
    }

    if (!student.class.schoolLevel.allowElectives) {
      return { success: false, error: "This level does not allow elective selection", electives: [] }
    }

    // Get the current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: auth.school.id, isCurrent: true },
    })

    if (!currentYear) {
      return { success: false, error: "No current academic year found", electives: [] }
    }

    // Get level's elective subject IDs and their compulsory status
    const levelElectiveRecords = await prisma.levelSubject.findMany({
      where: {
        levelId: student.class.schoolLevel.id,
        subjectType: "ELECTIVE",
      },
      select: {
        subjectId: true,
        isCompulsory: true,
      },
    })

    const electiveSubjectIds = levelElectiveRecords.map(r => r.subjectId)
    const compulsoryMap = new Map(levelElectiveRecords.map(r => [r.subjectId, r.isCompulsory]))

    // Get subject details for those electives
    const electiveSubjects = await prisma.subject.findMany({
      where: {
        id: { in: electiveSubjectIds },
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
      orderBy: { name: "asc" },
    })

    // Get student's current selections for this year
    const currentSelections = await prisma.studentSubject.findMany({
      where: {
        studentId,
        academicYearId: currentYear.id,
      },
      select: { subjectId: true },
    })
    const selectedIds = new Set(currentSelections.map(s => s.subjectId))

    // Mark which are already selected
    const electivesWithStatus = electiveSubjects.map(subj => ({
      id: subj.id,
      name: subj.name,
      code: subj.code,
      description: subj.description,
      isCompulsory: compulsoryMap.get(subj.id) ?? false,
      isSelected: selectedIds.has(subj.id),
    }))

    return { 
      success: true, 
      electives: electivesWithStatus,
      allowElectives: student.class.schoolLevel.allowElectives,
      schoolLevelName: student.class.schoolLevel.name,
    }
  } catch (error) {
    console.error("Error fetching electives:", error)
    return { success: false, error: "Failed to fetch electives", electives: [] }
  }
}

// Get student's subject selections
export async function getStudentSubjects(studentId: string, academicYearId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, subjects: [] }
  }

  try {
    // Get current academic year if not provided
    let yearId = academicYearId
    if (!yearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { schoolId: auth.school.id, isCurrent: true },
      })
      if (!currentYear) {
        return { success: false, error: "No current academic year found", subjects: [] }
      }
      yearId = currentYear.id
    }

    const studentSubjects = await prisma.studentSubject.findMany({
      where: {
        studentId,
        academicYearId: yearId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        subject: { name: "asc" },
      },
    })

    return { success: true, subjects: studentSubjects }
  } catch (error) {
    console.error("Error fetching student subjects:", error)
    return { success: false, error: "Failed to fetch student subjects", subjects: [] }
  }
}

// Student selects an elective subject
export async function selectElectiveSubject(studentId: string, subjectId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: auth.school.id, isCurrent: true },
    })

    if (!currentYear) {
      return { success: false, error: "No current academic year found" }
    }

    // Verify the student exists and has access to this elective
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentId },
      include: {
        class: {
          include: {
            schoolLevel: true,
          },
        },
      },
    })

    if (!student?.class?.schoolLevel) {
      return { success: false, error: "Student not enrolled in a class with a school level" }
    }

    if (!student.class.schoolLevel.allowElectives) {
      return { success: false, error: "This level does not allow elective selection" }
    }

    // Verify the subject is an elective for this level
    const levelSubject = await prisma.levelSubject.findFirst({
      where: {
        levelId: student.class.schoolLevel.id,
        subjectId,
        subjectType: "ELECTIVE",
      },
    })

    if (!levelSubject) {
      return { success: false, error: "This subject is not available as an elective for your level" }
    }

    // Check if already selected
    const existing = await prisma.studentSubject.findUnique({
      where: {
        studentId_subjectId_academicYearId: {
          studentId,
          subjectId,
          academicYearId: currentYear.id,
        },
      },
    })

    if (existing) {
      return { success: false, error: "Subject already selected" }
    }

    // Create the selection
    const selection = await prisma.studentSubject.create({
      data: {
        studentId,
        subjectId,
        academicYearId: currentYear.id,
      },
    })

    revalidatePath("/school/subjects")
    return { success: true, selection }
  } catch (error) {
    console.error("Error selecting elective:", error)
    return { success: false, error: "Failed to select elective" }
  }
}

// Remove an elective subject selection
export async function removeElectiveSubject(studentId: string, subjectId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Get current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: auth.school.id, isCurrent: true },
    })

    if (!currentYear) {
      return { success: false, error: "No current academic year found" }
    }

    // Find and delete the selection
    const existing = await prisma.studentSubject.findUnique({
      where: {
        studentId_subjectId_academicYearId: {
          studentId,
          subjectId,
          academicYearId: currentYear.id,
        },
      },
    })

    if (!existing) {
      return { success: false, error: "Subject selection not found" }
    }

    // If already approved, don't allow removal (optional - can be configured)
    if (existing.approvedAt) {
      return { success: false, error: "Cannot remove approved subject selection. Contact an administrator." }
    }

    await prisma.studentSubject.delete({
      where: { id: existing.id },
    })

    revalidatePath("/school/subjects")
    return { success: true }
  } catch (error) {
    console.error("Error removing elective:", error)
    return { success: false, error: "Failed to remove elective" }
  }
}

// Admin/Teacher approves a student's elective selection
export async function approveElectiveSelection(studentSubjectId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school || !auth.session?.user) {
    return { success: false, error: auth.error }
  }

  try {
    const updated = await prisma.studentSubject.update({
      where: { id: studentSubjectId },
      data: {
        approvedAt: new Date(),
        approvedById: auth.session.user.id,
      },
    })

    revalidatePath("/school/subjects")
    return { success: true, selection: updated }
  } catch (error) {
    console.error("Error approving selection:", error)
    return { success: false, error: "Failed to approve selection" }
  }
}

// Bulk approve student elective selections
export async function bulkApproveElectiveSelections(studentSubjectIds: string[]) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school || !auth.session?.user) {
    return { success: false, error: auth.error }
  }

  try {
    await prisma.studentSubject.updateMany({
      where: { id: { in: studentSubjectIds } },
      data: {
        approvedAt: new Date(),
        approvedById: auth.session.user.id,
      },
    })

    revalidatePath("/school/subjects")
    return { success: true, count: studentSubjectIds.length }
  } catch (error) {
    console.error("Error bulk approving selections:", error)
    return { success: false, error: "Failed to approve selections" }
  }
}

// Get students and their elective selections for admin view
export async function getStudentElectiveSelections(classId?: string, status?: "pending" | "approved" | "all") {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, selections: [] }
  }

  try {
    // Get current academic year
    const currentYear = await prisma.academicYear.findFirst({
      where: { schoolId: auth.school.id, isCurrent: true },
    })

    if (!currentYear) {
      return { success: false, error: "No current academic year found", selections: [] }
    }

    const selections = await prisma.studentSubject.findMany({
      where: {
        academicYearId: currentYear.id,
        ...(classId && {
          student: {
            classId,
          },
        }),
        ...(status === "pending" && { approvedAt: null }),
        ...(status === "approved" && { approvedAt: { not: null } }),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { student: { user: { firstName: "asc" } } },
        { subject: { name: "asc" } },
      ],
    })

    return { success: true, selections }
  } catch (error) {
    console.error("Error fetching student selections:", error)
    return { success: false, error: "Failed to fetch selections", selections: [] }
  }
}
