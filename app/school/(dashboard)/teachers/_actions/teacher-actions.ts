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
