"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { verifySchoolAccess } from "@/lib/auth"
import { UserRole } from "@/app/generated/prisma/client"

// Types
export interface CreateClassInput {
  name: string
  gradeDefinitionId?: string
  section?: string
  capacity?: number
  roomNumber?: string
  classTeacherId?: string
  academicYearId: string
  schoolLevelId?: string
}

export interface UpdateClassInput extends Partial<CreateClassInput> {
  id: string
}

export interface ClassFilters {
  search?: string
  gradeDefinitionId?: string
  academicYearId?: string
  page?: number
  limit?: number
}

// Get all classes for the current school
export async function getClasses(filters: ClassFilters = {}) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, classes: [], total: 0 }
  }

  const { search, gradeDefinitionId, academicYearId, page = 1, limit = 20 } = filters
  const skip = (page - 1) * limit

  try {
    const where = {
      schoolId: auth.school.id,
      ...(academicYearId && { academicYearId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { roomNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(gradeDefinitionId && { gradeDefinitionId }),
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
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
          gradeDefinition: {
            select: {
              id: true,
              name: true,
              shortName: true,
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
          _count: {
            select: {
              students: true,
              classSubjects: true,
            },
          },
        },
        orderBy: [
          { gradeDefinition: { order: "asc" } },
          { section: "asc" },
          { name: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.class.count({ where }),
    ])

    return { 
      success: true, 
      classes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error("Error fetching classes:", error)
    return { success: false, error: "Failed to fetch classes", classes: [], total: 0 }
  }
}

// Get a single class by ID
export async function getClass(classId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN, UserRole.TEACHER])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: auth.school.id,
      },
      include: {
        classTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        academicYear: true,
        students: {
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
          },
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!classData) {
      return { success: false, error: "Class not found" }
    }

    return { success: true, class: classData }
  } catch (error) {
    console.error("Error fetching class:", error)
    return { success: false, error: "Failed to fetch class" }
  }
}

// Create a new class
export async function createClass(data: CreateClassInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify academic year belongs to this school
    const academicYear = await prisma.academicYear.findFirst({
      where: { 
        id: data.academicYearId, 
        schoolId: auth.school.id 
      },
    })

    if (!academicYear) {
      return { success: false, error: "Academic year not found" }
    }

    // Check if class name already exists for this academic year
    const existingClass = await prisma.class.findFirst({
      where: {
        schoolId: auth.school.id,
        academicYearId: data.academicYearId,
        name: data.name,
      },
    })

    if (existingClass) {
      return { success: false, error: "A class with this name already exists for this academic year" }
    }

    const classData = await prisma.class.create({
      data: {
        schoolId: auth.school.id,
        academicYearId: data.academicYearId,
        name: data.name,
        gradeDefinitionId: data.gradeDefinitionId || null,
        section: data.section || null,
        capacity: data.capacity || null,
        roomNumber: data.roomNumber || null,
        classTeacherId: data.classTeacherId || null,
        schoolLevelId: data.schoolLevelId || null,
      },
    })

    revalidatePath("/school/classes")
    return { success: true, class: classData }
  } catch (error) {
    console.error("Error creating class:", error)
    return { success: false, error: "Failed to create class" }
  }
}

// Update a class
export async function updateClass(data: UpdateClassInput) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify class belongs to this school
    const existingClass = await prisma.class.findFirst({
      where: {
        id: data.id,
        schoolId: auth.school.id,
      },
    })

    if (!existingClass) {
      return { success: false, error: "Class not found" }
    }

    // Check name uniqueness if changed
    if (data.name && data.name !== existingClass.name) {
      const duplicateName = await prisma.class.findFirst({
        where: {
          schoolId: auth.school.id,
          academicYearId: data.academicYearId || existingClass.academicYearId,
          name: data.name,
          NOT: { id: data.id },
        },
      })
      if (duplicateName) {
        return { success: false, error: "A class with this name already exists" }
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id: data.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.gradeDefinitionId !== undefined && { gradeDefinitionId: data.gradeDefinitionId || null }),
        ...(data.section !== undefined && { section: data.section || null }),
        ...(data.capacity !== undefined && { capacity: data.capacity || null }),
        ...(data.roomNumber !== undefined && { roomNumber: data.roomNumber || null }),
        ...(data.classTeacherId !== undefined && { classTeacherId: data.classTeacherId || null }),
        ...(data.academicYearId && { academicYearId: data.academicYearId }),
        ...(data.schoolLevelId !== undefined && { schoolLevelId: data.schoolLevelId || null }),
      },
    })

    revalidatePath("/school/classes")
    revalidatePath(`/school/classes/${data.id}`)
    return { success: true, class: updatedClass }
  } catch (error) {
    console.error("Error updating class:", error)
    return { success: false, error: "Failed to update class" }
  }
}

// Delete a class
export async function deleteClass(classId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify class belongs to this school
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: auth.school.id,
      },
      include: {
        _count: { select: { students: true } },
      },
    })

    if (!classData) {
      return { success: false, error: "Class not found" }
    }

    if (classData._count.students > 0) {
      return { 
        success: false, 
        error: `Cannot delete class with ${classData._count.students} students. Please reassign them first.` 
      }
    }

    await prisma.class.delete({
      where: { id: classId },
    })

    revalidatePath("/school/classes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting class:", error)
    return { success: false, error: "Failed to delete class" }
  }
}

// Get teachers for dropdown (for class teacher assignment)
export async function getTeachersForDropdown() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, teachers: [] }
  }

  try {
    const teachers = await prisma.user.findMany({
      where: {
        schoolId: auth.school.id,
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
    })

    return { success: true, teachers }
  } catch (error) {
    console.error("Error fetching teachers:", error)
    return { success: false, error: "Failed to fetch teachers", teachers: [] }
  }
}

// Get school levels for dropdown
export async function getSchoolLevelsForDropdown() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, levels: [] }
  }

  try {
    const levels = await prisma.schoolLevel.findMany({
      where: { schoolId: auth.school.id },
      select: {
        id: true,
        name: true,
        shortName: true,
        allowElectives: true,
      },
      orderBy: { order: "asc" },
    })

    return { success: true, levels }
  } catch (error) {
    console.error("Error fetching school levels:", error)
    return { success: false, error: "Failed to fetch school levels", levels: [] }
  }
}

// Get grade definitions for dropdown
export async function getGradeDefinitionsForDropdown() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, gradeDefinitions: [] }
  }

  try {
    const gradeDefinitions = await prisma.gradeDefinition.findMany({
      where: { schoolId: auth.school.id },
      select: {
        id: true,
        name: true,
        shortName: true,
        description: true,
        order: true,
      },
      orderBy: { order: "asc" },
    })

    return { success: true, gradeDefinitions }
  } catch (error) {
    console.error("Error fetching grade definitions:", error)
    return { success: false, error: "Failed to fetch grade definitions", gradeDefinitions: [] }
  }
}

// Get academic years
export async function getAcademicYears() {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, years: [] }
  }

  try {
    const years = await prisma.academicYear.findMany({
      where: { schoolId: auth.school.id },
      orderBy: { startDate: "desc" },
    })

    return { success: true, years }
  } catch (error) {
    console.error("Error fetching academic years:", error)
    return { success: false, error: "Failed to fetch academic years", years: [] }
  }
}

// Create academic year (needed if none exists)
export async function createAcademicYear(data: {
  name: string
  startDate: string
  endDate: string
  isCurrent?: boolean
}) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // If setting as current, unset other current years
    if (data.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { schoolId: auth.school.id, isCurrent: true },
        data: { isCurrent: false },
      })
    }

    const year = await prisma.academicYear.create({
      data: {
        schoolId: auth.school.id,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isCurrent: data.isCurrent || false,
      },
    })

    revalidatePath("/school/classes")
    return { success: true, year }
  } catch (error) {
    console.error("Error creating academic year:", error)
    return { success: false, error: "Failed to create academic year" }
  }
}
