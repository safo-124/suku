"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { verifySchoolAccess, hashPassword } from "@/lib/auth"
import { UserRole } from "@/app/generated/prisma/client"

// Types
export interface CreateTeacherInput {
  firstName: string
  lastName: string
  email: string
  phone?: string
  employeeId?: string
  qualification?: string
  specialization?: string
  joinDate?: string
  password?: string
}

export interface UpdateTeacherInput extends Partial<CreateTeacherInput> {
  id: string
  isActive?: boolean
}

export interface TeacherFilters {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

// Get all teachers for the current school
export async function getTeachers(filters: TeacherFilters = {}) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, teachers: [], total: 0 }
  }

  const { search, isActive, page = 1, limit = 20 } = filters
  const skip = (page - 1) * limit

  try {
    const where = {
      schoolId: auth.school.id,
      role: UserRole.TEACHER,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { teacherProfile: { employeeId: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(isActive !== undefined && { isActive }),
    }

    const [teachers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          teacherProfile: true,
          classTeacherOf: {
            select: {
              id: true,
              name: true,
            },
          },
          classSubjects: {
            select: {
              id: true,
              class: { select: { name: true } },
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return { 
      success: true, 
      teachers: teachers as unknown as TeacherWithProfile[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return { success: false, error: "Failed to fetch teachers", teachers: [], total: 0 }
  }
}

// Get a single teacher by ID
export async function getTeacher(teacherId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
      },
      include: {
        teacherProfile: true,
        classTeacherOf: true,
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
        timetableSlots: {
          include: {
            class: true,
            period: true,
            classSubject: {
              include: { subject: true },
            },
          },
        },
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    return { success: true, teacher: teacher as unknown as TeacherWithProfile }
  } catch (error) {
    console.error("Error fetching teacher:", error)
    return { success: false, error: "Failed to fetch teacher" }
  }
}

// Create a new teacher
export async function createTeacher(data: CreateTeacherInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Check teacher limit
    const teacherCount = await prisma.user.count({
      where: { schoolId: auth.school.id, role: UserRole.TEACHER },
    })

    if (teacherCount >= auth.school.maxTeachers) {
      return { 
        success: false, 
        error: `Teacher limit reached (${auth.school.maxTeachers}). Please upgrade your plan.` 
      }
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existingUser) {
      return { success: false, error: "Email is already registered" }
    }

    // Check if employee ID is already taken within the school
    if (data.employeeId) {
      const existingEmployeeId = await prisma.teacherProfile.findFirst({
        where: {
          employeeId: data.employeeId,
          user: { schoolId: auth.school.id },
        },
      })

      if (existingEmployeeId) {
        return { success: false, error: "Employee ID is already taken" }
      }
    }

    // Generate temporary password if not provided
    const password = data.password || generateTempPassword()
    const passwordHash = await hashPassword(password)

    // Create user and profile in transaction
    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          passwordHash,
          role: UserRole.TEACHER,
          schoolId: auth.school!.id,
          isActive: true,
          emailVerified: false,
        },
      })

      const profile = await tx.teacherProfile.create({
        data: {
          userId: user.id,
          employeeId: data.employeeId || null,
          qualification: data.qualification || null,
          specialization: data.specialization || null,
          joinDate: data.joinDate ? new Date(data.joinDate) : null,
        },
      })

      return { ...user, teacherProfile: profile }
    })

    revalidatePath("/school/teachers")
    return { 
      success: true, 
      teacher,
      tempPassword: data.password ? undefined : password,
    }
  } catch (error) {
    console.error("Error creating teacher:", error)
    return { success: false, error: "Failed to create teacher" }
  }
}

// Update a teacher
export async function updateTeacher(data: UpdateTeacherInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify teacher belongs to this school
    const existingTeacher = await prisma.user.findFirst({
      where: {
        id: data.id,
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
      },
      include: { teacherProfile: true },
    })

    if (!existingTeacher) {
      return { success: false, error: "Teacher not found" }
    }

    // Check email uniqueness if changed
    if (data.email && data.email.toLowerCase() !== existingTeacher.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      })
      if (existingEmail) {
        return { success: false, error: "Email is already registered" }
      }
    }

    // Check employee ID uniqueness if changed
    if (data.employeeId && data.employeeId !== existingTeacher.teacherProfile?.employeeId) {
      const existingEmployeeId = await prisma.teacherProfile.findFirst({
        where: {
          employeeId: data.employeeId,
          user: { schoolId: auth.school.id },
          NOT: { userId: data.id },
        },
      })
      if (existingEmployeeId) {
        return { success: false, error: "Employee ID is already taken" }
      }
    }

    // Update user and profile
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: data.id },
        data: {
          ...(data.email && { email: data.email.toLowerCase() }),
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      })

      if (existingTeacher.teacherProfile) {
        await tx.teacherProfile.update({
          where: { id: existingTeacher.teacherProfile.id },
          data: {
            ...(data.employeeId !== undefined && { employeeId: data.employeeId || null }),
            ...(data.qualification !== undefined && { qualification: data.qualification || null }),
            ...(data.specialization !== undefined && { specialization: data.specialization || null }),
            ...(data.joinDate !== undefined && { 
              joinDate: data.joinDate ? new Date(data.joinDate) : null 
            }),
          },
        })
      }
    })

    revalidatePath("/school/teachers")
    revalidatePath(`/school/teachers/${data.id}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating teacher:", error)
    return { success: false, error: "Failed to update teacher" }
  }
}

// Delete a teacher
export async function deleteTeacher(teacherId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify teacher belongs to this school
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    await prisma.user.delete({
      where: { id: teacherId },
    })

    revalidatePath("/school/teachers")
    return { success: true }
  } catch (error) {
    console.error("Error deleting teacher:", error)
    return { success: false, error: "Failed to delete teacher" }
  }
}

// Toggle teacher active status
export async function toggleTeacherStatus(teacherId: string, isActive: boolean) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    await prisma.user.update({
      where: { id: teacherId },
      data: { isActive },
    })

    revalidatePath("/school/teachers")
    return { success: true }
  } catch (error) {
    console.error("Error toggling teacher status:", error)
    return { success: false, error: "Failed to update teacher status" }
  }
}

// Reset teacher password
export async function resetTeacherPassword(teacherId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    await prisma.user.update({
      where: { id: teacherId },
      data: { passwordHash },
    })

    return { success: true, tempPassword }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, error: "Failed to reset password" }
  }
}

// Helper: Generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// ============================================
// SUBJECT ASSIGNMENTS
// ============================================

// Get all class-subjects available for assignment (for a specific academic year)
export async function getAvailableClassSubjects(academicYearId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, classSubjects: [] }
  }

  try {
    // Get current academic year if not specified
    let yearId = academicYearId
    if (!yearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { schoolId: auth.school.id, isCurrent: true },
      })
      yearId = currentYear?.id
    }

    if (!yearId) {
      return { success: false, error: "No academic year found", classSubjects: [] }
    }

    const classSubjects = await prisma.classSubject.findMany({
      where: {
        class: {
          schoolId: auth.school.id,
          academicYearId: yearId,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
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
      orderBy: [
        { class: { name: "asc" } },
        { subject: { name: "asc" } },
      ],
    })

    return { success: true, classSubjects }
  } catch (error) {
    console.error("Error fetching class subjects:", error)
    return { success: false, error: "Failed to fetch class subjects", classSubjects: [] }
  }
}

// Assign a subject (class-subject) to a teacher
export async function assignSubjectToTeacher(classSubjectId: string, teacherId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify teacher belongs to this school
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    // Verify class subject belongs to this school
    const classSubject = await prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        class: { schoolId: auth.school.id },
      },
    })

    if (!classSubject) {
      return { success: false, error: "Class subject not found" }
    }

    // Update the class subject with the teacher
    await prisma.classSubject.update({
      where: { id: classSubjectId },
      data: { teacherId },
    })

    revalidatePath("/school/teachers")
    revalidatePath(`/school/teachers/${teacherId}`)
    revalidatePath("/school/classes")
    return { success: true }
  } catch (error) {
    console.error("Error assigning subject to teacher:", error)
    return { success: false, error: "Failed to assign subject" }
  }
}

// Unassign a subject from a teacher
export async function unassignSubjectFromTeacher(classSubjectId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify class subject belongs to this school
    const classSubject = await prisma.classSubject.findFirst({
      where: {
        id: classSubjectId,
        class: { schoolId: auth.school.id },
      },
      include: { teacher: true },
    })

    if (!classSubject) {
      return { success: false, error: "Class subject not found" }
    }

    const teacherId = classSubject.teacherId

    // Remove the teacher from the class subject
    await prisma.classSubject.update({
      where: { id: classSubjectId },
      data: { teacherId: null },
    })

    revalidatePath("/school/teachers")
    if (teacherId) {
      revalidatePath(`/school/teachers/${teacherId}`)
    }
    revalidatePath("/school/classes")
    return { success: true }
  } catch (error) {
    console.error("Error unassigning subject from teacher:", error)
    return { success: false, error: "Failed to unassign subject" }
  }
}

// Bulk assign subjects to a teacher
export async function bulkAssignSubjectsToTeacher(classSubjectIds: string[], teacherId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify teacher belongs to this school
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    // Verify all class subjects belong to this school
    const classSubjects = await prisma.classSubject.findMany({
      where: {
        id: { in: classSubjectIds },
        class: { schoolId: auth.school.id },
      },
    })

    if (classSubjects.length !== classSubjectIds.length) {
      return { success: false, error: "Some class subjects not found" }
    }

    // Update all class subjects with the teacher
    await prisma.classSubject.updateMany({
      where: { id: { in: classSubjectIds } },
      data: { teacherId },
    })

    revalidatePath("/school/teachers")
    revalidatePath(`/school/teachers/${teacherId}`)
    revalidatePath("/school/classes")
    return { success: true, assignedCount: classSubjectIds.length }
  } catch (error) {
    console.error("Error bulk assigning subjects to teacher:", error)
    return { success: false, error: "Failed to assign subjects" }
  }
}

// ============================================
// CLASS TEACHER ASSIGNMENTS
// ============================================

// Get all classes available for class teacher assignment
export async function getAvailableClasses(academicYearId?: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, classes: [] }
  }

  try {
    // Get current academic year if not specified
    let yearId = academicYearId
    if (!yearId) {
      const currentYear = await prisma.academicYear.findFirst({
        where: { schoolId: auth.school.id, isCurrent: true },
      })
      yearId = currentYear?.id
    }

    if (!yearId) {
      return { success: false, error: "No academic year found", classes: [] }
    }

    const classes = await prisma.class.findMany({
      where: {
        schoolId: auth.school.id,
        academicYearId: yearId,
      },
      include: {
        classTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        gradeDefinition: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return { success: true, classes }
  } catch (error) {
    console.error("Error fetching classes:", error)
    return { success: false, error: "Failed to fetch classes", classes: [] }
  }
}

// Assign a teacher as class teacher for a class
export async function assignClassTeacher(classId: string, teacherId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify teacher belongs to this school
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: auth.school.id,
        role: UserRole.TEACHER,
      },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    // Verify class belongs to this school
    const classToUpdate = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: auth.school.id,
      },
    })

    if (!classToUpdate) {
      return { success: false, error: "Class not found" }
    }

    // Update the class with the teacher
    await prisma.class.update({
      where: { id: classId },
      data: { classTeacherId: teacherId },
    })

    revalidatePath("/school/teachers")
    revalidatePath(`/school/teachers/${teacherId}`)
    revalidatePath("/school/classes")
    revalidatePath(`/school/classes/${classId}`)
    return { success: true }
  } catch (error) {
    console.error("Error assigning class teacher:", error)
    return { success: false, error: "Failed to assign class teacher" }
  }
}

// Remove a class teacher from a class
export async function removeClassTeacher(classId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify class belongs to this school
    const classToUpdate = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: auth.school.id,
      },
    })

    if (!classToUpdate) {
      return { success: false, error: "Class not found" }
    }

    const previousTeacherId = classToUpdate.classTeacherId

    // Remove the class teacher
    await prisma.class.update({
      where: { id: classId },
      data: { classTeacherId: null },
    })

    revalidatePath("/school/teachers")
    if (previousTeacherId) {
      revalidatePath(`/school/teachers/${previousTeacherId}`)
    }
    revalidatePath("/school/classes")
    revalidatePath(`/school/classes/${classId}`)
    return { success: true }
  } catch (error) {
    console.error("Error removing class teacher:", error)
    return { success: false, error: "Failed to remove class teacher" }
  }
}

// Types for responses
type TeacherWithProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  createdAt: Date
  teacherProfile: {
    id: string
    employeeId: string | null
    qualification: string | null
    specialization: string | null
    joinDate: Date | null
  } | null
  classTeacherOf: {
    id: string
    name: string
  }[]
  classSubjects: {
    id: string
    class: { name: string }
    subject: { name: string }
  }[]
}
