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

    // Fetch ALL subjects for this school level if provided (both CORE and ELECTIVE)
    // All subjects should be available as ClassSubjects for teacher assignment
    let levelSubjects: { subjectId: string }[] = []
    if (data.schoolLevelId) {
      levelSubjects = await prisma.levelSubject.findMany({
        where: {
          levelId: data.schoolLevelId,
        },
        select: {
          subjectId: true,
        },
      })
    }

    // Use transaction to create class and auto-assign level subjects
    const classData = await prisma.$transaction(async (tx) => {
      // Create the class
      const newClass = await tx.class.create({
        data: {
          schoolId: auth.school!.id,
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

      // Auto-assign all level subjects to the class
      if (levelSubjects.length > 0) {
        await tx.classSubject.createMany({
          data: levelSubjects.map((subject) => ({
            classId: newClass.id,
            subjectId: subject.subjectId,
          })),
        })
      }

      return newClass
    })

    revalidatePath("/school/classes")
    return { 
      success: true, 
      class: classData,
      assignedSubjects: levelSubjects.length,
    }
  } catch (error) {
    console.error("Error creating class:", error)
    return { success: false, error: "Failed to create class" }
  }
}

// Get all subjects for a school level (for preview in class form)
export async function getSubjectsForLevel(levelId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error, subjects: [] as { id: string; name: string; code: string | null; subjectType: string }[] }
  }

  try {
    // Query subjects with their level assignments
    const subjectsData = await prisma.subject.findMany({
      where: {
        schoolId: auth.school.id,
        levelSubjects: {
          some: {
            levelId,
          },
        },
      },
      include: {
        levelSubjects: {
          where: { levelId },
          take: 1,
        },
      },
      orderBy: {
        name: "asc",
      },
    }) as unknown as Array<{
      id: string
      name: string
      code: string | null
      levelSubjects: Array<{ subjectType: string }>
    }>

    const formattedSubjects = subjectsData.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      subjectType: s.levelSubjects[0]?.subjectType || "CORE",
    }))

    return { 
      success: true, 
      subjects: formattedSubjects,
    }
  } catch (error) {
    console.error("Error fetching level subjects:", error)
    return { success: false, error: "Failed to fetch level subjects", subjects: [] as { id: string; name: string; code: string | null; subjectType: string }[] }
  }
}

// Alias for backward compatibility
export async function getCoreSubjectsForLevel(levelId: string) {
  return getSubjectsForLevel(levelId)
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

    // Check if school level is changing
    const levelChanging = data.schoolLevelId !== undefined && 
      data.schoolLevelId !== existingClass.schoolLevelId

    const updatedClass = await prisma.$transaction(async (tx) => {
      // Update the class
      const updated = await tx.class.update({
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

      // If school level changed, sync ALL level subjects
      if (levelChanging && data.schoolLevelId) {
        // Get current class subjects
        const currentSubjects = await tx.classSubject.findMany({
          where: { classId: data.id },
          select: { subjectId: true },
        })
        const currentSubjectIds = new Set(currentSubjects.map(s => s.subjectId))

        // Get new level's ALL subjects (both CORE and ELECTIVE)
        const newLevelSubjects = await tx.levelSubject.findMany({
          where: {
            levelId: data.schoolLevelId,
          },
          select: { subjectId: true },
        })

        // Add only the new level subjects that aren't already assigned
        const subjectsToAdd = newLevelSubjects.filter(
          s => !currentSubjectIds.has(s.subjectId)
        )

        if (subjectsToAdd.length > 0) {
          await tx.classSubject.createMany({
            data: subjectsToAdd.map((subject) => ({
              classId: data.id,
              subjectId: subject.subjectId,
            })),
          })
        }
      }

      return updated
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

// Bulk create classes from grade definitions
export async function createClassesFromGradeDefinitions(academicYearId: string) {
  const auth = await verifySchoolAccess([UserRole.SCHOOL_ADMIN])
  
  if (!auth.success || !auth.school) {
    return { success: false, error: auth.error }
  }

  try {
    // Verify academic year belongs to this school
    const academicYear = await prisma.academicYear.findFirst({
      where: { 
        id: academicYearId, 
        schoolId: auth.school.id 
      },
    })

    if (!academicYear) {
      return { success: false, error: "Academic year not found" }
    }

    // Get all grade definitions for this school
    const gradeDefinitions = await prisma.gradeDefinition.findMany({
      where: { schoolId: auth.school.id },
      orderBy: { order: "asc" },
      include: {
        schoolLevel: {
          select: { id: true },
        },
      },
    })

    if (gradeDefinitions.length === 0) {
      return { success: false, error: "No grade definitions found. Please create grade definitions in Settings first." }
    }

    // Get existing classes for this academic year to avoid duplicates
    const existingClasses = await prisma.class.findMany({
      where: {
        schoolId: auth.school.id,
        academicYearId,
      },
      select: {
        name: true,
        gradeDefinitionId: true,
      },
    })

    const existingNames = new Set(existingClasses.map(c => c.name))
    const existingGradeIds = new Set(existingClasses.map(c => c.gradeDefinitionId))

    // Filter out grade definitions that already have a class
    const newGradeDefinitions = gradeDefinitions.filter(
      gd => !existingGradeIds.has(gd.id) && !existingNames.has(gd.name)
    )

    if (newGradeDefinitions.length === 0) {
      return { success: false, error: "All grade definitions already have classes for this academic year." }
    }

    // Create classes in a transaction with auto-assignment of core subjects
    const createdClasses = await prisma.$transaction(async (tx) => {
      const classes = []
      
      for (const gd of newGradeDefinitions) {
        // Create the class
        const newClass = await tx.class.create({
          data: {
            schoolId: auth.school!.id,
            academicYearId,
            name: gd.name,
            gradeDefinitionId: gd.id,
            schoolLevelId: gd.schoolLevelId || null,
          },
        })

        // Auto-assign ALL level subjects if there's a school level
        if (gd.schoolLevelId) {
          const levelSubjects = await tx.levelSubject.findMany({
            where: {
              levelId: gd.schoolLevelId,
            },
            select: { subjectId: true },
          })

          if (levelSubjects.length > 0) {
            await tx.classSubject.createMany({
              data: levelSubjects.map((subject) => ({
                classId: newClass.id,
                subjectId: subject.subjectId,
              })),
            })
          }
        }

        classes.push(newClass)
      }

      return classes
    })

    revalidatePath("/school/classes")
    revalidatePath("/school/teachers")
    return { 
      success: true, 
      createdCount: createdClasses.length,
      skippedCount: gradeDefinitions.length - newGradeDefinitions.length,
    }
  } catch (error) {
    console.error("Error creating classes from grade definitions:", error)
    return { success: false, error: "Failed to create classes" }
  }
}
